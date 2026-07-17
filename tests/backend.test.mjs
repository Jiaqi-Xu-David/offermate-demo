import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { extractPdfText } from '../src/backend/pdf.js';
import { parseResumeProfile, parseResumeWithDeepSeek } from '../src/backend/deepseek.js';
import { extractResumeTextFromPdf, extractResumeTextWithOpenAI, shouldUseOcrTextExtraction } from '../src/backend/ocr.js';
import { clearSessionCookie, createSessionCookie, hashPassword, parseCookieHeader, verifyPassword } from '../src/backend/auth.js';
import { decryptText, encryptText, hashLookup, isEncryptedText } from '../src/backend/secure-data.js';
import { APP_SCHEMA_SQL } from '../src/backend/schema.js';
import {
  ensureAppData,
  listHrCandidates,
  listStudentApplications,
  normalizeStudentRegistrationInput,
  submitApplication,
  withdrawApplication,
} from '../src/backend/database.js';
import { parseResumeText } from '../src/matcher.js';
import { buildDownloadContentDisposition } from '../functions/api/hr/resume-download.js';
import { ensureSupportedResumeUpload } from '../functions/api/resumes.js';

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

function createD1TestDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  return {
    sqlite,
    d1: {
      prepare(sql) {
        const statement = sqlite.prepare(sql);
        let values = [];
        const prepared = {
          bind(...nextValues) {
            values = nextValues;
            return prepared;
          },
          run() {
            return statement.run(...values);
          },
          all() {
            return { results: statement.all(...values) };
          },
          first() {
            return statement.get(...values) ?? null;
          },
        };
        return prepared;
      },
    },
  };
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

test('keeps usable PDF text when a later compressed stream is damaged', async () => {
  const pdf = new TextEncoder().encode(`%PDF-1.4
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
<< /Length 24 >>
stream
BT (景萍 行政简历) Tj ET
endstream
endobj
5 0 obj
<< /Length 6 /Filter /FlateDecode >>
stream
broken
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`);

  const text = await extractPdfText(pdf);

  assert.match(text, /景萍 行政简历/);
});

test('extracts text from ASCIIHexDecode PDF streams', async () => {
  const pdf = new TextEncoder().encode(`%PDF-1.4
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
<< /Length 44 /Filter /ASCIIHexDecode >>
stream
42542028457863656C20E7AE80E58E862920546A204554>
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`);

  const text = await extractPdfText(pdf);

  assert.match(text, /Excel 简历/);
});

test('extracts text from PDF streams that use AHx and Fl filter abbreviations', async () => {
  const pdf = new TextEncoder().encode(`%PDF-1.4
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
<< /Length 75 /Filter [/AHx /Fl] >>
stream
789C730A51D00828CACF2D285170CD4BCFCC4B4D2DCACC4BD75408C952700D010091CD09AC>
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`);

  const text = await extractPdfText(pdf);

  assert.match(text, /Prompt Engineering/);
});

test('extracts text from PDF streams that use ASCII85 and A85 filters', async () => {
  const pdf = new TextEncoder().encode(`%PDF-1.4
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
<< /Length 42 /Filter [/A85] >>
stream
6<":?6t(7QA7Zl]ATN!2ALSa$C'nNiA,lT0~>
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`);

  const text = await extractPdfText(pdf);

  assert.match(text, /Davide Resume/);
});

test('extracts text from PDF streams with nested stream dictionaries', async () => {
  const pdf = new TextEncoder().encode(`%PDF-1.4
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
<< /Length 42 /DecodeParms << /Columns 1 /Predictor 12 >> /Filter /ASCIIHexDecode >>
stream
425420284E6573746564205064662053747265616D2920546A204554>
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`);

  const text = await extractPdfText(pdf);

  assert.match(text, /Nested Pdf Stream/);
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

test('extracts and structures one-line Chinese resume PDF text into profile tags', async () => {
  const pdf = buildMinimalPdf(`BT
    (Werf基本资料实习经历电话：13800000000邮箱：student@example.com邓聖喆求职意向：影视媒体类方向姓后：邓聖喆籍贯：江西九江学历：专科性别：男院校：江西生物科技职业学院专业：助漫媒体制作技术湖口县融媒体|实习记者2025年7月——9月|九江主导多部短片/微电影创作，负责创意策划、脚本撰写、现场拍摄和后期剪辑调色。设计软件：熟练使用 PR、PS、AE、达芬奇、剪映。团队与执行：具有团队协作意识和项目推进能力。) Tj
  ET`);

  const text = await extractPdfText(pdf);
  const profile = parseResumeText(text);

  assert.equal(profile.name, '邓聖喆');
  assert.equal(profile.gender, '男');
  assert.equal(profile.target, '影视媒体类方向');
  assert.ok(profile.headline.includes('江西生物科技职业学院'));
  assert.ok(profile.headline.includes('动漫媒体制作技术'));
  assert.ok(profile.skills.includes('PR'));
  assert.ok(profile.skills.includes('剪映'));
  assert.ok(profile.softSkills.includes('团队协作'));
  assert.ok(profile.experiences.some((item) => item.includes('实习记者')));
  assert.ok(!profile.headline.includes('电话'));
  assert.ok(!profile.headline.includes('邮箱'));
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

test('parses OCR resume text with OpenAI structured output when DeepSeek is absent', async () => {
  const calls = [];
  const profile = await parseResumeProfile(
    { OPENAI_API_KEY: 'openai-test-key', OPENAI_PROFILE_MODEL: 'gpt-4o-mini' },
    '姓名：蒋纯\n性别：男\n学校：慕尼黑工业大学\n专业：电气工程及其自动化\n求职意向：设备运维实习\n技能：PLC、电气调试、AutoCAD',
    {
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return Response.json({
          output_text: JSON.stringify({
            name: '蒋纯',
            gender: '男',
            headline: '慕尼黑工业大学 电气工程及其自动化 本科',
            target: '设备运维实习',
            cityPreferences: ['上海'],
            skills: ['PLC', '电气调试', 'AutoCAD'],
            languages: [],
            softSkills: ['现场沟通'],
            experiences: ['负责生产设备日常巡检与维护，检查低压配电箱、变压器、电机运行状态。'],
            interests: ['设备运维'],
          }),
        });
      },
    },
  );

  assert.equal(profile.name, '蒋纯');
  assert.equal(profile.parser, 'openai-responses');
  assert.deepEqual(profile.skills.slice(0, 3), ['PLC', '电气调试', 'AutoCAD']);
  assert.equal(calls[0].url, 'https://api.openai.com/v1/responses');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer openai-test-key');
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.model, 'gpt-4o-mini');
  assert.match(body.input[0].content[0].text, /严格 JSON/);
});

test('keeps parser fallback warnings when model-based resume parsing fails', async () => {
  const profile = await parseResumeProfile(
    { DEEPSEEK_API_KEY: 'deepseek-test-key', OPENAI_API_KEY: 'openai-test-key' },
    '姓名：景萍\n求职意向：行政\n技能：Office、招聘',
    {
      fetchImpl: async (url) => {
        if (url.includes('deepseek')) {
          return new Response('upstream timeout', { status: 504 });
        }
        return new Response('bad gateway', { status: 502 });
      },
    },
  );

  assert.equal(profile.parser, 'rules');
  assert.match(profile.parserWarning, /DeepSeek resume parsing failed: 504/);
  assert.match(profile.parserWarning, /OpenAI resume parsing failed: 502/);
  assert.ok(profile.skills.includes('Office'));
});

test('decides when PDF text extraction should fall back to OCR', () => {
  assert.equal(shouldUseOcrTextExtraction(''), true);
  assert.equal(shouldUseOcrTextExtraction('个亲简历 特话 迎箱 与业'), true);
  assert.equal(
    shouldUseOcrTextExtraction('姓名：大卫德\n学校：慕尼黑工业大学\n专业：统计学\n技能：SQL、Python、Tableau\n求职意向：数据分析实习\n实习经历：使用 SQL 分析用户留存，并用 Python 清洗数据生成看板。'),
    false,
  );
  assert.equal(
    shouldUseOcrTextExtraction('Name: Davide\nUniversity: Technical University of Munich\nMajor: Statistics\nSkills: SQL, Python, Tableau\nTarget Role: Data Analyst Intern\nExperience: Used SQL to analyze retention and Python to clean user data.'),
    false,
  );
  assert.equal(
    shouldUseOcrTextExtraction('姓名：大卫德 学校：慕尼黑工业大学 专业：统计学 技能：SQL Python Tableau 实习经历：'.repeat(12)),
    true,
  );
});

test('keeps concise but clearly structured resume text on the PDF path', () => {
  assert.equal(
    shouldUseOcrTextExtraction('姓名：林清\n学校：西华大学\n求职意向：行政实习\n技能：Office、文档写作'),
    false,
  );
  assert.equal(
    shouldUseOcrTextExtraction('Name: Lina\nUniversity: Xihua University\nTarget Role: HR Intern\nSkills: Office, Recruiting'),
    false,
  );
});

test('keeps common English resume section labels on the PDF path', () => {
  assert.equal(
    shouldUseOcrTextExtraction(
      'Profile: Lina Chen\nContact: lina@example.com\nObjective: HR Intern\nProjects: Campus recruiting coordination',
    ),
    false,
  );
  assert.equal(
    shouldUseOcrTextExtraction(
      'Summary: Data-focused student\nLocation: Munich\nTechnical Skills: SQL, Python, Tableau\nEmployment History: Built weekly KPI dashboards',
    ),
    false,
  );
});

test('keeps modern English resume labels on the PDF path', () => {
  assert.equal(
    shouldUseOcrTextExtraction(
      'LinkedIn: linkedin.com/in/lina\nPortfolio: lina.dev\nCertifications: Google Data Analytics\nAwards: Dean list',
    ),
    false,
  );
  assert.equal(
    shouldUseOcrTextExtraction(
      'Website: lina.dev\nGitHub: github.com/lina\nCore Competencies: SQL, Python\nCareer Highlights: Built KPI dashboards',
    ),
    false,
  );
});

test('keeps leadership and coursework style English resume labels on the PDF path', () => {
  assert.equal(
    shouldUseOcrTextExtraction(
      'Leadership: Data club lead\nActivities: Recruiting fair\nCoursework: Statistics\nTools: SQL',
    ),
    false,
  );
});

test('keeps concise English resumes with professional experience headings on the PDF path', () => {
  assert.equal(
    shouldUseOcrTextExtraction(
      'Professional Experience: Data analyst intern\nSelected Projects: Funnel dashboard\nKey Skills: SQL, Python\nWork Authorization: EU student visa',
    ),
    false,
  );
  assert.equal(
    shouldUseOcrTextExtraction(
      'Education & Training: Technical University of Munich\nAcademic Projects: Retention model\nWork Authorization: Germany student permit\nKey Skills: Tableau, GA4',
    ),
    false,
  );
});

test('keeps structured English resumes with visa and graduation headings on the PDF path', () => {
  assert.equal(
    shouldUseOcrTextExtraction(
      'Expected Graduation: 2027\nAvailability: 4 days per week\nLanguages: English, Mandarin\nVisa Status: Germany student residence permit',
    ),
    false,
  );
  assert.equal(
    shouldUseOcrTextExtraction(
      'Citizenship: China\nExpected Graduation: June 2027\nLanguages: English, German\nAvailability: Immediate',
    ),
    false,
  );
});

test('accepts PDF resume uploads and rejects unsupported file types early', () => {
  assert.doesNotThrow(() => ensureSupportedResumeUpload({ name: 'resume.pdf', type: 'application/pdf', size: 1024 }));
  assert.doesNotThrow(() => ensureSupportedResumeUpload({ name: 'resume.pdf', type: 'application/x-pdf', size: 1024 }));
  assert.doesNotThrow(() => ensureSupportedResumeUpload({ name: 'resume.pdf', type: 'application/acrobat', size: 1024 }));
  assert.doesNotThrow(() => ensureSupportedResumeUpload({ name: 'resume.PDF', type: '', size: 2048 }));
  assert.throws(
    () => ensureSupportedResumeUpload({ name: 'resume.png', type: 'image/png', size: 1024 }),
    /仅支持 PDF 简历上传/,
  );
  assert.throws(
    () => ensureSupportedResumeUpload({ name: 'resume.pdf', type: 'application/pdf', size: 0 }),
    /上传的 PDF 为空/,
  );
});

test('extracts resume text through OpenAI PDF OCR when configured', async () => {
  const calls = [];
  const text = await extractResumeTextWithOpenAI(
    { OPENAI_API_KEY: 'openai-test-key', OPENAI_OCR_MODEL: 'gpt-4o-mini' },
    {
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      fileName: 'resume.pdf',
      mimeType: 'application/pdf',
      localText: '个亲简历',
    },
    {
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return Response.json({
          output: [
            {
              content: [
                {
                  text: '姓名：蒋纯\n性别：男\n学校：慕尼黑工业大学\n专业：电气工程及其自动化\n技能：PLC、电气调试',
                },
              ],
            },
          ],
        });
      },
    },
  );

  assert.equal(text.includes('姓名：蒋纯'), true);
  assert.equal(calls[0].url, 'https://api.openai.com/v1/responses');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer openai-test-key');
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.model, 'gpt-4o-mini');
  assert.equal(body.input[0].content[0].type, 'input_file');
  assert.equal(body.input[0].content[0].filename, 'resume.pdf');
  assert.match(body.input[0].content[0].file_data, /^data:application\/pdf;base64,/);
  assert.equal(body.input[0].content[1].type, 'input_text');
  assert.match(body.input[0].content[1].text, /OCR\/文本抽取/);
});

test('normalizes fenced OCR output into plain resume text', async () => {
  const text = await extractResumeTextWithOpenAI(
    { OPENAI_API_KEY: 'openai-test-key' },
    {
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      fileName: 'resume.pdf',
      mimeType: 'application/pdf',
    },
    {
      fetchImpl: async () =>
        Response.json({
          output_text: '```text\n简历原文：\n姓名：大卫德\n学校：慕尼黑工业大学\n技能：SQL、Python\n```',
        }),
    },
  );

  assert.equal(text, '姓名：大卫德\n学校：慕尼黑工业大学\n技能：SQL、Python');
});

test('drops conversational OCR wrapper lines before resume parsing', async () => {
  const text = await extractResumeTextWithOpenAI(
    { OPENAI_API_KEY: 'openai-test-key' },
    {
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      fileName: 'resume.pdf',
      mimeType: 'application/pdf',
    },
    {
      fetchImpl: async () =>
        Response.json({
          output_text: '以下是简历原文整理后的纯文本：\nOCR 结果如下：\n姓名：林可\n学校：慕尼黑工业大学\n技能：SQL、Python',
        }),
    },
  );

  assert.equal(text, '姓名：林可\n学校：慕尼黑工业大学\n技能：SQL、Python');
});

test('routes low-quality PDF extraction through OCR before matching', async () => {
  const calls = [];
  const result = await extractResumeTextFromPdf(
    { OPENAI_API_KEY: 'openai-test-key' },
    new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    {
      fileName: 'scan.pdf',
      mimeType: 'application/pdf',
      extractTextImpl: async () => '',
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return Response.json({ output_text: '姓名：景萍\n求职意向：行政实习\n技能：Office、招聘协助' });
      },
    },
  );

  assert.equal(result.source, 'openai-ocr');
  assert.equal(result.text.includes('行政实习'), true);
  assert.equal(calls.length, 1);
});

test('normalizes legacy PDF mime types before OCR extraction', async () => {
  const resumeApi = await readFile(new URL('../functions/api/resumes.js', import.meta.url), 'utf8');

  assert.ok(resumeApi.includes("const PDF_MIME_TYPES = new Set(['application/pdf', 'application/x-pdf', 'application/acrobat'])"));
  assert.ok(resumeApi.includes("mimeType: normalizedMimeType"));
  assert.ok(resumeApi.includes("storedMimeType: normalizeResumeMimeType('', mimeType) || 'application/pdf'"));
});

test('can force all uploaded PDFs through OCR for demo mode', async () => {
  const result = await extractResumeTextFromPdf(
    { OPENAI_API_KEY: 'openai-test-key', OCR_MODE: 'always' },
    new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    {
      fileName: 'clean.pdf',
      extractTextImpl: async () => '姓名：大卫德\n学校：慕尼黑工业大学\n专业：统计学\n技能：SQL、Python\n实习经历：使用 SQL 分析用户留存。',
      fetchImpl: async () => Response.json({ output_text: '姓名：大卫德\n学校：慕尼黑工业大学\n专业：统计学\n技能：SQL、Python、Tableau' }),
    },
  );

  assert.equal(result.source, 'openai-ocr');
  assert.match(result.text, /Tableau/);
});

test('falls back to local PDF text if OCR is unavailable but text exists', async () => {
  const result = await extractResumeTextFromPdf(
    {},
    new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    {
      extractTextImpl: async () => '姓名：大卫德 学校：慕尼黑工业大学 专业：统计学 技能：SQL Python Tableau 实习经历：'.repeat(12),
      fetchImpl: async () => {
        throw new Error('should not be called');
      },
    },
  );

  assert.equal(result.source, 'pdf-text-fallback');
  assert.match(result.warning, /OPENAI_API_KEY/);
  assert.match(result.text, /慕尼黑工业大学/);
});

test('hashes and verifies passwords without storing plaintext', async () => {
  const first = await hashPassword('sample-password-123', 'fixed-salt');
  const second = await hashPassword('sample-password-123', 'fixed-salt');

  assert.equal(first, second);
  assert.notEqual(first, 'sample-password-123');
  assert.equal(await verifyPassword('sample-password-123', 'fixed-salt', first), true);
  assert.equal(await verifyPassword('wrong-password', 'fixed-salt', first), false);
});

test('encrypts personal fields before database storage', async () => {
  const env = { OFFERMATE_ENCRYPTION_KEY: 'unit-test-encryption-key' };
  const encrypted = await encryptText(env, '蒋纯 · jiangchun@example.com');

  assert.equal(isEncryptedText(encrypted), true);
  assert.notEqual(encrypted, '蒋纯 · jiangchun@example.com');
  assert.equal(await decryptText(env, encrypted), '蒋纯 · jiangchun@example.com');
  assert.equal(await hashLookup(' JiangChun@Example.COM '), await hashLookup('jiangchun@example.com'));
});

test('parses cookie headers for session lookup', () => {
  assert.deepEqual(parseCookieHeader('theme=light; om_session=abc123; role=student'), {
    theme: 'light',
    om_session: 'abc123',
    role: 'student',
  });
});

test('keeps session parsing resilient for malformed cookies and sets explicit expiry attributes', () => {
  assert.deepEqual(parseCookieHeader('theme=light; om_session=%E0%A4%A; role=student'), {
    theme: 'light',
    om_session: '%E0%A4%A',
    role: 'student',
  });
  assert.deepEqual(parseCookieHeader('theme=light; om_session=\"abc%20123\"; role=student'), {
    theme: 'light',
    om_session: 'abc 123',
    role: 'student',
  });
  assert.deepEqual(parseCookieHeader('theme=light; om_session= "abc%20123" ; role=student'), {
    theme: 'light',
    om_session: 'abc 123',
    role: 'student',
  });
  assert.deepEqual(parseCookieHeader('theme=light; om_session="abc;123=="; =ignored; role=student'), {
    theme: 'light',
    om_session: 'abc;123==',
    role: 'student',
  });
  assert.deepEqual(parseCookieHeader('theme=light; om_session="abc\\"123"; role=student'), {
    theme: 'light',
    om_session: 'abc"123',
    role: 'student',
  });

  const secureCookie = createSessionCookie('abc123', 'https://offermate.example.com/login', 3600.8);
  assert.match(secureCookie, /om_session=abc123/);
  assert.match(secureCookie, /HttpOnly/);
  assert.match(secureCookie, /SameSite=Lax/);
  assert.match(secureCookie, /Max-Age=3600/);
  assert.match(secureCookie, /Expires=/);
  assert.match(secureCookie, /Priority=High/);
  assert.match(secureCookie, /Secure/);

  const localCookie = createSessionCookie('abc123', 'http://127.0.0.1:4173/login', 3600);
  assert.doesNotMatch(localCookie, /Secure/);

  const clearedCookie = clearSessionCookie('https://offermate.example.com/logout');
  assert.match(clearedCookie, /Max-Age=0/);
  assert.match(clearedCookie, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
  assert.match(clearedCookie, /Priority=High/);
});

test('keeps the first session cookie when duplicate names appear in the header', () => {
  assert.deepEqual(parseCookieHeader('om_session=trusted-token; theme=dark; om_session=shadow-token'), {
    om_session: 'trusted-token',
    theme: 'dark',
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
  assert.ok(APP_SCHEMA_SQL.includes('idx_applications_user_job'));
});

test('creates idempotent student applications and lets students withdraw them', async (t) => {
  const { sqlite, d1 } = createD1TestDatabase();
  t.after(() => sqlite.close());
  const env = { APP_DB: d1, OFFERMATE_ENCRYPTION_KEY: 'application-test-key' };
  const user = { id: 'user-application-test', role: 'student' };

  await ensureAppData(env);
  sqlite
    .prepare(
      `INSERT INTO users (id, email, name, role, password_salt, password_hash, created_at)
       VALUES (?, ?, ?, 'student', 'salt', 'hash', ?)`,
    )
    .run(user.id, 'application@example.com', '投递测试同学', new Date().toISOString());

  await assert.rejects(
    submitApplication(env, user, 'data-analyst-intern'),
    /先上传并解析一份 PDF 简历/,
  );

  sqlite
    .prepare(
      `INSERT INTO resumes (id, user_id, file_name, raw_text, profile_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      'resume-application-test',
      user.id,
      'resume.pdf',
      '姓名：投递测试同学 技能：SQL、Python',
      '{}',
      new Date().toISOString(),
    );

  const first = await submitApplication(env, user, 'data-analyst-intern');
  const duplicate = await submitApplication(env, user, 'data-analyst-intern');
  const listed = await listStudentApplications(env, user);

  assert.equal(first.created, true);
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.application.id, first.application.id);
  assert.equal(listed.applications.length, 1);
  assert.equal(listed.applications[0].job.title, '数据分析实习生');
  assert.equal(listed.applications[0].resumeId, 'resume-application-test');

  await withdrawApplication(env, user, 'data-analyst-intern');
  assert.deepEqual((await listStudentApplications(env, user)).applications, []);
});

test('student applications API is role-guarded and supports list, submit, and withdraw', async () => {
  const applicationsApi = await readFile(new URL('../functions/api/applications.js', import.meta.url), 'utf8');

  assert.ok(applicationsApi.includes("requireUser(context, ['student'])"));
  assert.ok(applicationsApi.includes('onRequestGet'));
  assert.ok(applicationsApi.includes('onRequestPost'));
  assert.ok(applicationsApi.includes('onRequestDelete'));
  assert.ok(applicationsApi.includes('submitApplication'));
  assert.ok(applicationsApi.includes('withdrawApplication'));
});

test('schema and HR APIs support original resume download', async () => {
  const databaseJs = await readFile(new URL('../src/backend/database.js', import.meta.url), 'utf8');
  const downloadApi = await readFile(new URL('../functions/api/hr/resume-download.js', import.meta.url), 'utf8');
  const resumesApi = await readFile(new URL('../functions/api/resumes.js', import.meta.url), 'utf8');

  assert.ok(APP_SCHEMA_SQL.includes('file_data_base64 TEXT'));
  assert.ok(APP_SCHEMA_SQL.includes('mime_type TEXT'));
  assert.ok(databaseJs.includes('ensureResumeFileColumns'));
  assert.ok(databaseJs.includes('fileDataBase64'));
  assert.ok(databaseJs.includes('resumeDownloadUrl'));
  assert.ok(downloadApi.includes("requireUser(context, ['hr'])"));
  assert.ok(downloadApi.includes('Content-Disposition'));
  assert.ok(resumesApi.includes('MAX_STORED_RESUME_FILE_BYTES'));
  assert.ok(resumesApi.includes('createStoredResumeFilePayload'));
  assert.ok(resumesApi.includes('fileDataBase64: storedFileDataBase64'));
  assert.ok(resumesApi.includes('extractResumeTextFromPdf(env, buffer'));
  assert.ok(resumesApi.includes('textSource: extraction.source'));
});

test('HR candidate listing preserves extraction source and OCR fallback warnings', async (t) => {
  const { sqlite, d1 } = createD1TestDatabase();
  t.after(() => sqlite.close());
  const env = { APP_DB: d1, OFFERMATE_ENCRYPTION_KEY: 'hr-candidate-test-key' };

  await ensureAppData(env);
  sqlite
    .prepare(
      `INSERT INTO users (id, email, name, role, password_salt, password_hash, created_at)
       VALUES (?, ?, ?, 'student', 'salt', 'hash', ?)`,
    )
    .run('student-ocr-test', 'candidate@example.com', '候选人同学', new Date().toISOString());
  sqlite
    .prepare(
      `INSERT INTO resumes (
        id, user_id, file_name, raw_text, profile_json, text_source, extraction_warning, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      'resume-ocr-test',
      'student-ocr-test',
      'candidate.pdf',
      '姓名：候选人同学\n技能：SQL、Python',
      JSON.stringify({ name: '候选人同学', skills: ['SQL', 'Python'] }),
      'pdf-text-fallback',
      'OpenAI OCR failed: 502 upstream timeout',
      new Date().toISOString(),
    );

  const payload = await listHrCandidates(env);

  assert.equal(payload.uploadedCandidates.length, 1);
  assert.equal(payload.uploadedCandidates[0].textSource, 'pdf-text-fallback');
  assert.equal(payload.uploadedCandidates[0].extractionWarning, 'OpenAI OCR failed: 502 upstream timeout');
  assert.equal(payload.uploadedCandidates[0].resumeDownloadUrl, '/api/hr/resume-download?id=resume-ocr-test');
});

test('builds resume download headers with ascii fallback and utf-8 filename encoding', () => {
  const header = buildDownloadContentDisposition('大卫德 简历 2026".pdf');

  assert.match(header, /^attachment; filename="[_A-Za-z0-9 .'-]+"/);
  assert.match(header, /filename="___ __ 2026-\.pdf"/);
  assert.match(header, /filename\*=UTF-8''/);
  assert.match(header, /%E5%A4%A7%E5%8D%AB%E5%BE%B7/);
});

test('supports account admin users and exposes raw parsed resume text', async () => {
  const databaseJs = await readFile(new URL('../src/backend/database.js', import.meta.url), 'utf8');
  const usersApi = await readFile(new URL('../functions/api/admin/users.js', import.meta.url), 'utf8');

  assert.ok(APP_SCHEMA_SQL.includes("role IN ('student', 'hr', 'admin')"));
  assert.ok(databaseJs.includes('seedAdminUser'));
  assert.ok(databaseJs.includes('migrateUsersRoleCheck'));
  assert.ok(databaseJs.includes('users_with_admin'));
  assert.ok(!databaseJs.includes("user.role === 'admin' && String(error.message"));
  assert.ok(databaseJs.includes('rawText: await decryptResumeRawText'));
  assert.ok(databaseJs.includes('createAccountUser'));
  assert.ok(databaseJs.includes('deleteAccountUser'));
  assert.ok(databaseJs.includes('DELETE FROM sessions WHERE user_id = ?'));
  assert.ok(usersApi.includes("requireUser(context, ['admin'])"));
  assert.ok(usersApi.includes('onRequestPost'));
  assert.ok(usersApi.includes('onRequestDelete'));
});

test('uses environment-specific administrator password salt and hash', async (t) => {
  const { sqlite, d1 } = createD1TestDatabase();
  t.after(() => sqlite.close());
  const env = {
    APP_DB: d1,
    OFFERMATE_ENCRYPTION_KEY: 'admin-config-test-key',
    OFFERMATE_ADMIN_EMAIL: 'owner@example.com',
    OFFERMATE_ADMIN_NAME: '项目管理员',
    OFFERMATE_ADMIN_PASSWORD_SALT: 'deployment-specific-salt',
    OFFERMATE_ADMIN_PASSWORD_HASH: 'deployment-specific-hash',
  };

  await ensureAppData(env);
  const admin = sqlite.prepare("SELECT password_salt, password_hash FROM users WHERE role = 'admin'").get();

  assert.equal(admin.password_salt, env.OFFERMATE_ADMIN_PASSWORD_SALT);
  assert.equal(admin.password_hash, env.OFFERMATE_ADMIN_PASSWORD_HASH);
});

test('stores resume and user personal data through encrypted columns', async () => {
  const databaseJs = await readFile(new URL('../src/backend/database.js', import.meta.url), 'utf8');

  assert.ok(APP_SCHEMA_SQL.includes('email_lookup TEXT UNIQUE'));
  assert.ok(APP_SCHEMA_SQL.includes('email_cipher TEXT'));
  assert.ok(APP_SCHEMA_SQL.includes('name_cipher TEXT'));
  assert.ok(APP_SCHEMA_SQL.includes('raw_text_cipher TEXT'));
  assert.ok(APP_SCHEMA_SQL.includes('profile_json_cipher TEXT'));
  assert.match(databaseJs, /raw_text,\s*raw_text_cipher,\s*file_data_base64,\s*file_data_cipher,\s*mime_type,\s*text_source,\s*extraction_warning,\s*profile_json,\s*profile_json_cipher/);
  assert.ok(databaseJs.includes("raw_text = '[encrypted]'"));
  assert.ok(databaseJs.includes("profile_json = '{}'"));
  assert.ok(databaseJs.includes('findUserByEmail'));
  assert.ok(databaseJs.includes('email_lookup = ?'));
  assert.ok(!databaseJs.includes('davide123'));
  assert.ok(!databaseJs.includes('hr123'));
});

test('public registration is student-only and validates basic account fields', () => {
  const normalized = normalizeStudentRegistrationInput({
    name: '新同学',
    email: 'New.Student@Example.COM ',
    password: 'student123',
    confirmPassword: 'student123',
    role: 'admin',
  });

  assert.deepEqual(normalized, {
    name: '新同学',
    email: 'new.student@example.com',
    password: 'student123',
    role: 'student',
  });
  assert.throws(
    () => normalizeStudentRegistrationInput({ name: '新同学', email: 'broken', password: 'student123' }),
    /邮箱格式/,
  );
  assert.throws(
    () => normalizeStudentRegistrationInput({ name: '新同学', email: 'a@example.com', password: '123' }),
    /至少 6 位/,
  );
  assert.throws(
    () => normalizeStudentRegistrationInput({
      name: '新同学',
      email: 'a@example.com',
      password: 'student123',
      confirmPassword: 'student456',
    }),
    /两次密码/,
  );
});

test('registration API creates a student session without exposing role selection', async () => {
  const registerApi = await readFile(new URL('../functions/api/register.js', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.ok(registerApi.includes('createStudentRegistration'));
  assert.ok(registerApi.includes('createSessionCookie'));
  assert.ok(registerApi.includes('Set-Cookie'));
  assert.ok(!html.includes('id="register-role"'));
  assert.ok(html.includes('id="register-form"'));
  assert.ok(html.includes('id="open-register-modal"'));
  assert.ok(appJs.includes("apiRequest('/api/register'"));
  assert.ok(appJs.includes('await enterApp(payload.user)'));
});

test('login lookup normalizes email casing before session creation', async () => {
  const loginApi = await readFile(new URL('../functions/api/login.js', import.meta.url), 'utf8');
  const databaseJs = await readFile(new URL('../src/backend/database.js', import.meta.url), 'utf8');

  assert.ok(loginApi.includes("String(body.email ?? '').trim().toLowerCase()"));
  assert.ok(databaseJs.includes("hashLookup(String(email ?? '').trim().toLowerCase())"));
});

test('student-specific resume state is reset when switching accounts', async () => {
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.ok(appJs.includes('function resetStudentWorkspaceState'));
  assert.ok(appJs.includes('resetStudentWorkspaceState(user.name)'));
  assert.ok(appJs.includes('resetStudentWorkspaceState()'));
  assert.ok(appJs.includes("state.parseStatus = '等待上传 PDF 简历。解析完成后会提取技能、经历证据、语言与求职偏好。';"));
});

test('static shell uses login-driven routing and resume upload history', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.ok(html.includes('id="login-screen"'));
  assert.ok(html.includes('id="login-form"'));
  assert.ok(html.includes('id="register-dialog"'));
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
  assert.ok(!html.includes('demo-account-grid'));
  assert.ok(!html.includes('data-demo-email'));
  assert.ok(!html.includes('davide@example.com'));
  assert.ok(!html.includes('davide123'));
  assert.ok(!html.includes('hr@davide.tech'));
  assert.ok(!html.includes('hr123'));
  assert.ok(!appJs.includes('demo-account-button'));
  assert.ok(!html.includes('<p class="eyebrow">示例简历</p>'));
  assert.ok(!html.includes('aria-label="示例简历"'));
});

test('resume upload keeps extraction and parser warnings visible in the client status copy', async () => {
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const resumesApi = await readFile(new URL('../functions/api/resumes.js', import.meta.url), 'utf8');
  const databaseJs = await readFile(new URL('../src/backend/database.js', import.meta.url), 'utf8');

  assert.ok(appJs.includes('payload.resume.extractionWarning'));
  assert.ok(appJs.includes('profile.parserWarning'));
  assert.ok(appJs.includes("warnings.join('；')"));
  assert.ok(resumesApi.includes('extractionWarning: resume.extractionWarning'));
  assert.ok(databaseJs.includes('extractionWarning'));
});

test('resume history preserves extraction metadata for reload status copy', async () => {
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const databaseJs = await readFile(new URL('../src/backend/database.js', import.meta.url), 'utf8');

  assert.ok(APP_SCHEMA_SQL.includes('text_source TEXT'));
  assert.ok(APP_SCHEMA_SQL.includes('extraction_warning TEXT'));
  assert.match(databaseJs, /text_source,\s*extraction_warning,\s*profile_json,\s*profile_json_cipher,\s*created_at/);
  assert.ok(databaseJs.includes('textSource: row.text_source'));
  assert.ok(databaseJs.includes('extractionWarning: row.extraction_warning'));
  assert.ok(appJs.includes('buildResumeParseStatus(latestResume, state.profile'));
  assert.ok(appJs.includes('payload.resume.extractionWarning'));
});
