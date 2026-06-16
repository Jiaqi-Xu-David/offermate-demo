import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractPdfText } from '../src/backend/pdf.js';
import { parseResumeWithDeepSeek } from '../src/backend/deepseek.js';
import { hashPassword, parseCookieHeader, verifyPassword } from '../src/backend/auth.js';
import { APP_SCHEMA_SQL } from '../src/backend/schema.js';
import { parseResumeText } from '../src/matcher.js';

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

function buildPdfWithStreams(streams) {
  return new TextEncoder().encode(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 6 0 R >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${streams.content.length} >>
stream
${streams.content}
endstream
endobj
5 0 obj
<< /Length ${streams.toUnicode.length} >>
stream
${streams.toUnicode}
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type0 /BaseFont /ABCDEE+ResumeFont /ToUnicode 5 0 R >>
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

test('extracts text from PDFs that encode visible text through ToUnicode maps', async () => {
  const pdf = buildPdfWithStreams({
    content: `BT
      /F1 12 Tf
      <0102030405060708090A0B0C> Tj
    ET`,
    toUnicode: `/CIDInit /ProcSet findresource begin
12 dict begin
begincmap
1 begincodespacerange
<01> <0C>
endcodespacerange
12 beginbfchar
<01> <5927>
<02> <536B>
<03> <5FB7>
<04> <20>
<05> <0053>
<06> <0051>
<07> <004C>
<08> <20>
<09> <0050>
<0A> <0079>
<0B> <0074>
<0C> <0068>
endbfchar
endcmap
CMapName currentdict /CMap defineresource pop
end
end`,
  });

  const text = await extractPdfText(pdf);

  assert.match(text, /大卫德 SQL Pyth/);
});

test('normalizes glyph-by-glyph resume text into readable lines', async () => {
  const pdf = buildMinimalPdf(`BT
    [(个) 0 (人) 0 (简) 0 (历)] TJ
    [(姓) 0 (名) 0 (：) 0 (大) 0 (卫) 0 (德)] TJ
    [(S) 0 (Q) 0 (L)] TJ
  ET`);

  const text = await extractPdfText(pdf);

  assert.match(text, /个人简历/);
  assert.match(text, /姓名：大卫德/);
  assert.match(text, /SQL/);
});

test('infers the candidate name from labeled resume text instead of generic title', () => {
  const profile = parseResumeText(`个人简历
姓名：大卫德
学校：慕尼黑工业大学 统计学 本科 2026届
求职意向：数据分析实习
技能：SQL、Python、Tableau`);

  assert.equal(profile.name, '大卫德');
  assert.ok(profile.headline.includes('慕尼黑工业大学'));
  assert.equal(profile.target, '数据分析实习');
  assert.ok(profile.skills.includes('SQL'));
});

test('parses resume text with DeepSeek JSON mode when an API key is configured', async () => {
  const calls = [];
  const profile = await parseResumeWithDeepSeek(
    { DEEPSEEK_API_KEY: 'test-key' },
    '李雷\n慕尼黑工业大学 统计学 本科 2026届\n求职意向：数据分析实习\n使用 SQL 和 Python 分析留存。',
    {
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  name: '李雷',
                  gender: '男',
                  headline: '慕尼黑工业大学 统计学 本科 2026届',
                  target: '数据分析实习',
                  cityPreferences: ['上海'],
                  skills: ['SQL', 'Python'],
                  languages: ['英文文档阅读'],
                  softSkills: ['结构化表达'],
                  experiences: ['使用 SQL 和 Python 分析留存。'],
                  interests: ['数据分析'],
                }),
              },
            },
          ],
        });
      },
    },
  );

  assert.equal(profile.name, '李雷');
  assert.deepEqual(profile.skills, ['SQL', 'Python']);
  assert.equal(profile.rawResume.includes('SQL'), true);
  assert.equal(calls[0].url, 'https://api.deepseek.com/chat/completions');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-key');
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.model, 'deepseek-v4-pro');
  assert.deepEqual(body.response_format, { type: 'json_object' });
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

test('schema and HR APIs support original resume download', async () => {
  const databaseJs = await readFile(new URL('../src/backend/database.js', import.meta.url), 'utf8');
  const downloadApi = await readFile(new URL('../functions/api/hr/resume-download.js', import.meta.url), 'utf8');

  assert.ok(APP_SCHEMA_SQL.includes('file_data_base64 TEXT'));
  assert.ok(APP_SCHEMA_SQL.includes('mime_type TEXT'));
  assert.ok(databaseJs.includes('ensureResumeFileColumns'));
  assert.ok(databaseJs.includes('fileDataBase64'));
  assert.ok(databaseJs.includes('resumeDownloadUrl'));
  assert.ok(downloadApi.includes("requireUser(context, ['hr'])"));
  assert.ok(downloadApi.includes('Content-Disposition'));
});

test('supports account admin users and exposes raw parsed resume text', async () => {
  const databaseJs = await readFile(new URL('../src/backend/database.js', import.meta.url), 'utf8');
  const usersApi = await readFile(new URL('../functions/api/admin/users.js', import.meta.url), 'utf8');

  assert.ok(APP_SCHEMA_SQL.includes("role IN ('student', 'hr', 'admin')"));
  assert.ok(databaseJs.includes('admin@davide.tech'));
  assert.ok(databaseJs.includes('migrateUsersRoleCheck'));
  assert.ok(databaseJs.includes('users_with_admin'));
  assert.ok(!databaseJs.includes("user.role === 'admin' && String(error.message"));
  assert.ok(databaseJs.includes('rawText: row.raw_text'));
  assert.ok(databaseJs.includes('createAccountUser'));
  assert.ok(databaseJs.includes('deleteAccountUser'));
  assert.ok(usersApi.includes("requireUser(context, ['admin'])"));
  assert.ok(usersApi.includes('onRequestPost'));
  assert.ok(usersApi.includes('onRequestDelete'));
});

test('static shell uses login-driven routing and resume upload history', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.ok(html.includes('id="login-screen"'));
  assert.ok(html.includes('id="login-form"'));
  assert.ok(html.includes('id="app-shell"'));
  assert.ok(html.includes('id="logout-button"'));
  assert.ok(html.includes('id="resume-upload-form"'));
  assert.ok(html.includes('id="resume-history-list"'));
  assert.ok(html.includes('id="resume-picker-button"'));
  assert.ok(html.includes('id="sample-resume-button"'));
  assert.ok(html.includes('id="selected-file-name"'));
  assert.ok(html.includes('class="resume-empty-state"'));
  assert.ok(html.includes('id="account-admin-workspace"'));
  assert.ok(html.includes('id="account-user-list"'));
  assert.ok(!html.includes('class="mode-switch"'));
  assert.ok(!html.includes('id="student-mode"'));
  assert.ok(!html.includes('id="admin-mode"'));
  assert.ok(!html.includes('<p class="eyebrow">示例简历</p>'));
  assert.ok(!html.includes('aria-label="示例简历"'));
});
