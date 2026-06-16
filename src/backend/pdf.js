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
  return {
    token: { type: 'string', value: decodeHexString(content.slice(start + 1, end)) },
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

function collectTextFromTokens(tokens) {
  const lines = [];

  tokens.forEach((token, index) => {
    if (token.type !== 'word') return;
    if ((token.value === 'Tj' || token.value === "'" || token.value === '"') && tokens[index - 1]?.type === 'string') {
      lines.push(tokens[index - 1].value);
      return;
    }
    if (token.value !== 'TJ') return;

    let start = index - 1;
    while (start >= 0 && tokens[start].type !== '[') start -= 1;
    if (start < 0) return;
    const text = tokens
      .slice(start + 1, index)
      .filter((item) => item.type === 'string')
      .map((item) => item.value)
      .join(' ');
    if (text) lines.push(text);
  });

  return lines;
}

async function extractStreamText(pdfSource) {
  const streamPattern = /<<(.*?)>>\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  const lines = [];
  let match = streamPattern.exec(pdfSource);

  while (match) {
    const dictionary = match[1];
    const rawStream = match[2];
    let streamBytes = binaryToBytes(rawStream);
    if (/\/Filter\s*\/FlateDecode/.test(dictionary)) {
      streamBytes = await inflateBytes(streamBytes);
    }

    lines.push(...collectTextFromTokens(tokenizeContent(bytesToBinary(streamBytes))));
    match = streamPattern.exec(pdfSource);
  }

  return lines;
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
