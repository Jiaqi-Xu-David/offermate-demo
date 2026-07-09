import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPdfText } from '../src/backend/pdf.js';

function buildPdfWithRawStreamBytes(streamDictionary, streamBytes) {
  const prefix = new TextEncoder().encode(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${streamBytes.length} ${streamDictionary} >>
stream
`);
  const suffix = new TextEncoder().encode(`
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`);
  const pdf = new Uint8Array(prefix.length + streamBytes.length + suffix.length);
  pdf.set(prefix, 0);
  pdf.set(streamBytes, prefix.length);
  pdf.set(suffix, prefix.length + streamBytes.length);
  return pdf;
}

test('extracts text from RunLengthDecode PDF streams', async () => {
  const content = 'BT (Figma Resume) Tj ET';
  const encoded = new Uint8Array([
    ...[...new TextEncoder().encode(content)].flatMap((byte) => [0, byte]),
    128,
  ]);
  const pdf = buildPdfWithRawStreamBytes('/Filter /RunLengthDecode', encoded);

  const text = await extractPdfText(pdf);

  assert.match(text, /Figma Resume/);
});
