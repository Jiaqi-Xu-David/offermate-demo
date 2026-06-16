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

function decodeUtf16Be(bytes) {
  let text = '';
  const start = bytes[0] === 0xfe && bytes[1] === 0xff ? 2 : 0;
  for (let index = start; index + 1 < bytes.length; index += 2) {
    text += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
  }
  return text;
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
  return bytesToBinary(bytes);
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

  return { token: { type: 'string', value: decodeLiteralString(value) }, index };
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
    const text = tokens
      .slice(start + 1, index)
      .filter((item) => item.type === 'string')
      .map((item) => tokenText(item, unicodeMap))
      .join(' ');
    if (text) lines.push(text);
  });

  return lines;
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

  while (match) {
    const dictionary = match[1];
    const rawStream = match[2];
    let streamBytes = binaryToBytes(rawStream);
    if (/\/Filter\s*\/FlateDecode/.test(dictionary)) {
      streamBytes = await inflateBytes(streamBytes);
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
  return lines
    .join('\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
