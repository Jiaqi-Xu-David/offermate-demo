function toUint8Array(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  throw new TypeError('PDF input must be an ArrayBuffer or Uint8Array');
}

function bytesToBinary(bytes) {
  let output = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    output += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return output;
}

function binaryToBytes(value) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

async function inflateBytes(bytes) {
  if (typeof DecompressionStream === 'function') {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  const { inflateSync } = await import('node:zlib');
  return inflateSync(bytes);
}

function decodeAsciiHexBytes(bytes) {
  const source = bytesToBinary(bytes).replace(/\s+/g, '');
  const endMarker = source.indexOf('>');
  const clean = (endMarker === -1 ? source : source.slice(0, endMarker)).replace(/[^0-9A-Fa-f]/g, '');
  const padded = clean.length % 2 === 0 ? clean : `${clean}0`;
  const decoded = new Uint8Array(padded.length / 2);
  for (let index = 0; index < padded.length; index += 2) {
    decoded[index / 2] = Number.parseInt(padded.slice(index, index + 2), 16);
  }
  return decoded;
}

function decodeAscii85Bytes(bytes) {
  const source = bytesToBinary(bytes).replace(/\s+/g, '');
  const endMarker = source.indexOf('~>');
  const clean = (endMarker === -1 ? source : source.slice(0, endMarker)).replace(/^<~/, '');
  const output = [];
  let group = [];

  const flushGroup = (isPartial = false) => {
    if (!group.length) return;
    const sourceGroup = isPartial ? [...group] : group;
    while (group.length < 5) group.push('u');

    let value = 0;
    group.forEach((char) => {
      value = value * 85 + (char.charCodeAt(0) - 33);
    });

    const decoded = [
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    ];
    output.push(...decoded.slice(0, isPartial ? sourceGroup.length - 1 : 4));
    group = [];
  };

  for (const char of clean) {
    if (char === 'z' && group.length === 0) {
      output.push(0, 0, 0, 0);
      continue;
    }
    if (char < '!' || char > 'u') continue;
    group.push(char);
    if (group.length === 5) flushGroup();
  }

  if (group.length) flushGroup(true);
  return new Uint8Array(output);
}

function decodeRunLengthBytes(bytes) {
  const output = [];
  for (let index = 0; index < bytes.length; index += 1) {
    const length = bytes[index];
    if (length === 128) break;
    if (length <= 127) {
      const end = Math.min(index + 1 + length + 1, bytes.length);
      output.push(...bytes.subarray(index + 1, end));
      index += length + 1;
      continue;
    }
    const repeatByte = bytes[index + 1];
    if (repeatByte === undefined) break;
    output.push(...new Array(257 - length).fill(repeatByte));
    index += 1;
  }
  return new Uint8Array(output);
}

function decodeUtf16Be(bytes) {
  let text = '';
  const start = bytes[0] === 0xfe && bytes[1] === 0xff ? 2 : 0;
  for (let index = start; index + 1 < bytes.length; index += 2) {
    text += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
  }
  return text;
}

function decodeUtf8(bytes) {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function decodePdfByteString(value) {
  const bytes = binaryToBytes(value);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return decodeUtf16Be(bytes);

  try {
    const decoded = decodeUtf8(bytes);
    const decodedSignal = (decoded.match(/[\u4e00-\u9fa5]/g) ?? []).length;
    const rawSignal = (value.match(/[\u00c0-\u00ff]/g) ?? []).length;
    if (decodedSignal > 0 || rawSignal > 0) return decoded;
  } catch {
    // Keep the raw PDF byte string when it is not valid UTF-8.
  }

  return value;
}

function decodeUnicodeHex(source) {
  const bytes = hexToBytes(source);
  if (bytes.length === 1) return String.fromCharCode(bytes[0]);
  return decodeUtf16Be(bytes);
}

function decodeHexString(source) {
  const clean = source.replace(/\s+/g, '');
  const padded = clean.length % 2 === 0 ? clean : `${clean}0`;
  const bytes = new Uint8Array(padded.length / 2);
  for (let index = 0; index < padded.length; index += 2) {
    bytes[index / 2] = Number.parseInt(padded.slice(index, index + 2), 16);
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return decodeUtf16Be(bytes);
  return decodePdfByteString(bytesToBinary(bytes));
}

function hexToBytes(source) {
  const clean = source.replace(/\s+/g, '');
  const padded = clean.length % 2 === 0 ? clean : `${clean}0`;
  const bytes = new Uint8Array(padded.length / 2);
  for (let index = 0; index < padded.length; index += 2) {
    bytes[index / 2] = Number.parseInt(padded.slice(index, index + 2), 16);
  }
  return bytes;
}

function decodeLiteralString(source) {
  let output = '';
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char !== '\\') {
      output += char;
      continue;
    }

    const next = source[index + 1];
    if (next === '\r' || next === '\n') {
      index += next === '\r' && source[index + 2] === '\n' ? 2 : 1;
      continue;
    }
    if (/[0-7]/.test(next ?? '')) {
      const match = source.slice(index + 1).match(/^[0-7]{1,3}/)?.[0] ?? '';
      output += String.fromCharCode(Number.parseInt(match, 8));
      index += match.length;
      continue;
    }

    const escapes = {
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      '(': '(',
      ')': ')',
      '\\': '\\',
    };
    output += escapes[next] ?? next ?? '';
    index += 1;
  }
  return output;
}

function readLiteral(content, start) {
  let index = start + 1;
  let depth = 1;
  let value = '';

  while (index < content.length && depth > 0) {
    const char = content[index];
    if (char === '\\') {
      value += char;
      if (index + 1 < content.length) value += content[index + 1];
      index += 2;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (depth > 0) value += char;
    index += 1;
  }

  return { token: { type: 'string', value: decodePdfByteString(decodeLiteralString(value)) }, index };
}

function readHex(content, start) {
  const end = content.indexOf('>', start + 1);
  if (end === -1) return { token: { type: 'word', value: '<' }, index: start + 1 };
  const rawHex = content.slice(start + 1, end).replace(/\s+/g, '').toUpperCase();
  return {
    token: { type: 'string', value: decodeHexString(rawHex), rawHex },
    index: end + 1,
  };
}

function tokenizeContent(content) {
  const tokens = [];
  let index = 0;

  while (index < content.length) {
    const char = content[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === '(') {
      const result = readLiteral(content, index);
      tokens.push(result.token);
      index = result.index;
      continue;
    }
    if (char === '<' && content[index + 1] !== '<') {
      const result = readHex(content, index);
      tokens.push(result.token);
      index = result.index;
      continue;
    }
    if (char === '[' || char === ']') {
      tokens.push({ type: char, value: char });
      index += 1;
      continue;
    }

    const match = content.slice(index).match(/^[^\s()[\]<>]+/);
    if (!match) {
      index += 1;
      continue;
    }
    tokens.push({ type: 'word', value: match[0] });
    index += match[0].length;
  }

  return tokens;
}

function decodeWithCMap(rawHex, unicodeMap) {
  if (!rawHex || !unicodeMap?.size) return null;
  const codeLengths = [...new Set([...unicodeMap.keys()].map((key) => key.length))].sort((a, b) => b - a);
  let index = 0;
  let output = '';

  while (index < rawHex.length) {
    const matchedLength = codeLengths.find((length) => unicodeMap.has(rawHex.slice(index, index + length)));
    if (!matchedLength) return null;
    output += unicodeMap.get(rawHex.slice(index, index + matchedLength));
    index += matchedLength;
  }

  return output;
}

function tokenText(token, unicodeMap) {
  return decodeWithCMap(token.rawHex, unicodeMap) ?? token.value;
}

function visibleLength(value) {
  return Array.from(String(value ?? '').trim()).length;
}

function shouldJoinTightly(left, right) {
  const leftText = String(left ?? '').trim();
  const rightText = String(right ?? '').trim();
  if (!leftText || !rightText) return true;
  if (visibleLength(leftText) <= 1 || visibleLength(rightText) <= 1) return true;
  return /[\u4e00-\u9fa5]$/.test(leftText) && /^[\u4e00-\u9fa5]/.test(rightText);
}

function joinPdfTextFragments(fragments) {
  return fragments.reduce((text, fragment) => {
    const clean = String(fragment ?? '').trim();
    if (!clean) return text;
    if (!text) return clean;
    return shouldJoinTightly(text, clean) ? `${text}${clean}` : `${text} ${clean}`;
  }, '');
}

function collectTextFromTokens(tokens, unicodeMap = new Map()) {
  const lines = [];

  tokens.forEach((token, index) => {
    if (token.type !== 'word') return;
    if ((token.value === 'Tj' || token.value === "'" || token.value === '"') && tokens[index - 1]?.type === 'string') {
      lines.push(tokenText(tokens[index - 1], unicodeMap));
      return;
    }
    if (token.value !== 'TJ') return;

    let start = index - 1;
    while (start >= 0 && tokens[start].type !== '[') start -= 1;
    if (start < 0) return;
    const text = joinPdfTextFragments(
      tokens
        .slice(start + 1, index)
        .filter((item) => item.type === 'string')
        .map((item) => tokenText(item, unicodeMap)),
    );
    if (text) lines.push(text);
  });

  return lines;
}

function isSeparatedSingleGlyphLine(line) {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 3 && parts.every((part) => visibleLength(part) === 1);
}

function isSingleGlyphLine(line) {
  const clean = line.trim();
  return clean.length > 0 && visibleLength(clean) === 1;
}

function normalizePdfTextLine(line) {
  const clean = line.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').trim();
  if (isSeparatedSingleGlyphLine(clean)) return clean.replace(/\s+/g, '');
  return clean;
}

function normalizeExtractedText(rawText) {
  const lines = String(rawText ?? '')
    .split(/\r?\n/)
    .map(normalizePdfTextLine)
    .filter(Boolean);
  const normalized = [];
  let glyphBuffer = '';

  lines.forEach((line) => {
    if (isSingleGlyphLine(line)) {
      glyphBuffer += line;
      return;
    }
    if (glyphBuffer) {
      normalized.push(glyphBuffer);
      glyphBuffer = '';
    }
    normalized.push(line);
  });

  if (glyphBuffer) normalized.push(glyphBuffer);

  return normalized
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseUnicodeCMaps(streams) {
  const unicodeMap = new Map();

  streams.forEach(({ content }) => {
    if (!content.includes('beginbfchar') && !content.includes('beginbfrange')) return;

    for (const section of content.matchAll(/\d+\s+beginbfchar([\s\S]*?)endbfchar/g)) {
      for (const pair of section[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
        unicodeMap.set(pair[1].toUpperCase(), decodeUnicodeHex(pair[2]));
      }
    }

    for (const section of content.matchAll(/\d+\s+beginbfrange([\s\S]*?)endbfrange/g)) {
      for (const range of section[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
        const start = Number.parseInt(range[1], 16);
        const end = Number.parseInt(range[2], 16);
        const destinationStart = Number.parseInt(range[3], 16);
        const width = range[1].length;
        for (let code = start; code <= end; code += 1) {
          unicodeMap.set(code.toString(16).toUpperCase().padStart(width, '0'), String.fromCharCode(destinationStart + code - start));
        }
      }

      for (const range of section[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g)) {
        const start = Number.parseInt(range[1], 16);
        const width = range[1].length;
        const destinations = [...range[3].matchAll(/<([0-9A-Fa-f]+)>/g)].map((item) => decodeUnicodeHex(item[1]));
        destinations.forEach((value, offset) => {
          unicodeMap.set((start + offset).toString(16).toUpperCase().padStart(width, '0'), value);
        });
      }
    }
  });

  return unicodeMap;
}

async function extractStreams(pdfSource) {
  const streamPattern = /<<(.*?)>>\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  const streams = [];
  let match = streamPattern.exec(pdfSource);
  const FILTER_ALIASES = {
    AHx: 'ASCIIHexDecode',
    A85: 'ASCII85Decode',
    Fl: 'FlateDecode',
    RL: 'RunLengthDecode',
  };

  streamLoop:
  while (match) {
    const dictionary = match[1];
    const rawStream = match[2];
    let streamBytes = binaryToBytes(rawStream);
    const filters = [...dictionary.matchAll(/\/Filter\s*(?:\[\s*((?:\/[A-Za-z0-9]+(?:\s+)?)*)\]|\/([A-Za-z0-9]+))/g)]
      .flatMap((entry) =>
        entry[1]
          ? [...entry[1].matchAll(/\/([A-Za-z0-9]+)/g)].map((item) => item[1])
          : entry[2]
            ? [entry[2]]
            : [],
      );

    for (const filter of filters) {
      const normalizedFilter = FILTER_ALIASES[filter] ?? filter;
      try {
        if (normalizedFilter === 'ASCIIHexDecode') {
          streamBytes = decodeAsciiHexBytes(streamBytes);
          continue;
        }
        if (normalizedFilter === 'ASCII85Decode') {
          streamBytes = decodeAscii85Bytes(streamBytes);
          continue;
        }
        if (normalizedFilter === 'RunLengthDecode') {
          streamBytes = decodeRunLengthBytes(streamBytes);
          continue;
        }
        if (normalizedFilter === 'FlateDecode') {
          streamBytes = await inflateBytes(streamBytes);
        }
      } catch {
        match = streamPattern.exec(pdfSource);
        continue streamLoop;
      }
    }

    streams.push({ dictionary, content: bytesToBinary(streamBytes) });
    match = streamPattern.exec(pdfSource);
  }

  return streams;
}

async function extractStreamText(pdfSource) {
  const streams = await extractStreams(pdfSource);
  const unicodeMap = parseUnicodeCMaps(streams);
  return streams.flatMap(({ content }) => collectTextFromTokens(tokenizeContent(content), unicodeMap));
}

export async function extractPdfText(input) {
  const bytes = toUint8Array(input);
  if (!bytes.length) return '';

  const source = bytesToBinary(bytes);
  const lines = await extractStreamText(source);
  return normalizeExtractedText(lines.join('\n'));
}
