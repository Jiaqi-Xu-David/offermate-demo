import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractPdfText } from '../src/backend/pdf.js';
import { hashPassword, parseCookieHeader, verifyPassword } from '../src/backend/auth.js';
import { APP_SCHEMA_SQL } from '../src/backend/schema.js';

function buildMinimalPdf(streamBody) {
  return new TextEncoder().encode(`%PDF-1.4
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
<< /Length ${streamBody.length} >>
stream
${streamBody}
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`);
}

test('extracts text from literal, array, and utf16 hex PDF text operators', async () => {
  const pdf = buildMinimalPdf(`BT
    (Davide Resume) Tj
    [(SQL) 120 (Python)] TJ
    <FEFF61555C3C9ED15DE54E1A59275B66> Tj
  ET`);

  const text = await extractPdfText(pdf);

  assert.match(text, /Davide Resume/);
  assert.match(text, /SQL Python/);
  assert.match(text, /慕尼黑工业大学/);
});

test('hashes and verifies passwords without storing plaintext', async () => {
  const first = await hashPassword('davide123', 'fixed-salt');
  const second = await hashPassword('davide123', 'fixed-salt');

  assert.equal(first, second);
  assert.notEqual(first, 'davide123');
  assert.equal(await verifyPassword('davide123', 'fixed-salt', first), true);
  assert.equal(await verifyPassword('wrong-password', 'fixed-salt', first), false);
});

test('parses cookie headers for session lookup', () => {
  assert.deepEqual(parseCookieHeader('theme=light; om_session=abc123; role=student'), {
    theme: 'light',
    om_session: 'abc123',
    role: 'student',
  });
});

test('defines application tables for auth, jobs, resumes, matches, and applications', () => {
  [
    'CREATE TABLE IF NOT EXISTS users',
    'CREATE TABLE IF NOT EXISTS sessions',
    'CREATE TABLE IF NOT EXISTS jobs',
    'CREATE TABLE IF NOT EXISTS resumes',
    'CREATE TABLE IF NOT EXISTS match_runs',
    'CREATE TABLE IF NOT EXISTS match_scores',
    'CREATE TABLE IF NOT EXISTS applications',
  ].forEach((snippet) => {
    assert.ok(APP_SCHEMA_SQL.includes(snippet), `${snippet} missing`);
  });
});

test('static shell uses login-driven routing and resume upload history', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.ok(html.includes('id="login-screen"'));
  assert.ok(html.includes('id="login-form"'));
  assert.ok(html.includes('id="app-shell"'));
  assert.ok(html.includes('id="logout-button"'));
  assert.ok(html.includes('id="resume-upload-form"'));
  assert.ok(html.includes('id="resume-history-list"'));
  assert.ok(!html.includes('class="mode-switch"'));
  assert.ok(!html.includes('id="student-mode"'));
  assert.ok(!html.includes('id="admin-mode"'));
});
