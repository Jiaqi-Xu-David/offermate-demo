import { extractPdfText } from './pdf.js';

const OPENAI_RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';
const DEFAULT_OCR_MODEL = 'gpt-4o-mini';
const DEFAULT_MAX_OCR_FILE_BYTES = 8_000_000;

function cleanText(value) {
  return String(value ?? '').trim();
}

function getOcrApiKey(env = {}) {
  return cleanText(env.OPENAI_API_KEY ?? env.OCR_OPENAI_API_KEY ?? env.OFFERMATE_OCR_API_KEY);
}

function getOcrModel(env = {}) {
  return cleanText(env.OPENAI_OCR_MODEL) || DEFAULT_OCR_MODEL;
}

function getOcrMode(env = {}) {
  return cleanText(env.OCR_MODE ?? env.OFFERMATE_OCR_MODE).toLowerCase();
}

function bytesToBase64(bytes) {
  if (typeof btoa === 'function') {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function normalizeOcrText(text) {
  const normalized = cleanText(text)
    .replace(/^```[a-z0-9_-]*\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/\u00AD/g, '')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  const lines = normalized.split('\n');
  const isWrapperLine = (line) =>
    /^(?:当然可以[，,:：]?\s*)?(?:(?:以下|这|下面)(?:里|是)?(?:为|提供|整理|提取)?\s*)?(?:(?:识别后|提取后|整理后|按原文(?:换行)?整理后)(?:的)?\s*)?(?:简历(?:(?:原文|文本)(?:整理后)?(?:的)?(?:纯文本)?)?|OCR\s*(?:识别)?\s*结果|提取结果|文本内容|纯文本(?:结果)?)\s*(?:如下)?\s*[：:]?\s*$/i.test(
      line.trim().replace(/^[-*•\d.)\s]+/, ''),
    );
  while (
    lines.length > 0 &&
    isWrapperLine(lines[0])
  ) {
    lines.shift();
  }
  return lines.join('\n').trim();
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  const chunks = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') chunks.push(content.text);
      if (typeof content?.value === 'string') chunks.push(content.value);
    }
  }
  return chunks.join('\n');
}

export function shouldUseOcrTextExtraction(text) {
  const normalized = cleanText(text);
  if (!normalized) return true;
  const compact = normalized.replace(/\s+/g, '');
  const lineCount = normalized.split('\n').filter((line) => line.trim()).length;
  const identityLabelMatches = normalized.match(
    /(姓名|求职意向|教育|学校|院校|专业|性别|邮箱|电话|实习|项目|技能|工作经历|教育经历|\bName\b|\bProfile\b|\bSummary\b|\bContact\b|\bLocation\b|\bTarget Role\b|\bObjective\b|\bEducation(?: Background)?\b|\bEducation & Training\b|\bUniversity\b|\bSchool\b|\bMajor\b|\bGender\b|\bEmail\b|\bPhone\b|\bExperience\b|\bProfessional Experience\b|\bWork Experience\b|\bEmployment History\b|\bInternships?\b|\bInternship Experience\b|\bProjects?\b|\bSelected Projects\b|\bAcademic Projects\b|\bTechnical Skills\b|\bKey Skills\b|\bSkills?\b|\bLinkedIn\b|\bPortfolio\b|\bWebsite\b|\bGitHub\b|\bCore Competencies\b|\bCareer Highlights\b|\bCertifications\b|\bAwards\b|\bLeadership(?: Experience)?\b|\bActivities\b|\bRelevant Coursework\b|\bCoursework\b|\bTools\b|\bLanguages?\b|\bAvailability\b|\bExpected Graduation\b|\bCitizenship\b|\bVisa Status\b|\bWork Authorization\b)/gi,
  ) ?? [];
  const hasIdentitySignal = identityLabelMatches.length > 0;
  const hasStructuredIdentityFields = identityLabelMatches.length >= 4 && lineCount >= 3;
  const corruptGlyphs = /个亲简历|教育背施|籍设|特话|迎箱|与业|姓后|Werf基本资料/.test(compact);
  const denseSingleLine = compact.length > 360 && lineCount <= 3;
  const tooShortForResume = compact.length < 80;
  if (corruptGlyphs || denseSingleLine || !hasIdentitySignal) return true;
  if (hasStructuredIdentityFields) return false;
  return tooShortForResume;
}

function buildOcrPrompt(localText = '') {
  const localHint = cleanText(localText)
    ? `\n\n本地 PDF 文本提取结果可能有错，仅作参考，不要照抄乱码：\n${cleanText(localText).slice(0, 4000)}`
    : '';
  return `请对这份简历 PDF 做 OCR/文本抽取，并输出可继续做结构化解析的纯文本。

要求：
1. 保留姓名、性别、学校/院校、专业、学历、求职意向、城市、教育经历、实习/项目/工作经历、技能、语言、软技能。
2. 按简历自然版式分行，不要把整份简历挤成一段。
3. 不要总结、不要评价、不要编造，识别不到的内容直接省略。
4. 只输出简历原文整理后的纯文本，不要 Markdown 标题，不要 JSON。${localHint}`;
}

export async function extractResumeTextWithOpenAI(env, input, options = {}) {
  const apiKey = getOcrApiKey(env);
  if (!apiKey) throw new Error('OPENAI_API_KEY or OCR_OPENAI_API_KEY is not configured');

  const bytes = input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array(input.bytes ?? []);
  const maxBytes = Number(env?.OCR_MAX_FILE_BYTES ?? DEFAULT_MAX_OCR_FILE_BYTES);
  if (bytes.byteLength > maxBytes) {
    throw new Error(`PDF 文件过大，当前 OCR 上限为 ${Math.round(maxBytes / 1_000_000)}MB。`);
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const mimeType = input.mimeType || 'application/pdf';
  const fileName = input.fileName || 'resume.pdf';
  const response = await fetchImpl(OPENAI_RESPONSES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getOcrModel(env),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_file',
              filename: fileName,
              file_data: `data:${mimeType};base64,${bytesToBase64(bytes)}`,
            },
            {
              type: 'input_text',
              text: buildOcrPrompt(input.localText),
            },
          ],
        },
      ],
      max_output_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI OCR failed: ${response.status} ${errorText.slice(0, 180)}`);
  }

  const payload = await response.json();
  const text = normalizeOcrText(extractOutputText(payload));
  if (!text) throw new Error('OpenAI OCR returned empty text');
  return text;
}

export async function extractResumeTextFromPdf(env, buffer, options = {}) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const localText = normalizeOcrText(await (options.extractTextImpl ?? extractPdfText)(bytes));
  const ocrMode = getOcrMode(env);
  const shouldUseOcr = ocrMode !== 'off' && (options.forceOcr || ocrMode === 'always' || shouldUseOcrTextExtraction(localText));

  if (!shouldUseOcr) {
    return { text: localText, source: 'pdf-text' };
  }

  try {
    const ocrText = await extractResumeTextWithOpenAI(
      env,
      {
        bytes,
        fileName: options.fileName,
        mimeType: options.mimeType,
        localText,
      },
      options,
    );
    return { text: ocrText, source: 'openai-ocr', fallbackText: localText };
  } catch (error) {
    if (localText) {
      return { text: localText, source: 'pdf-text-fallback', warning: error.message };
    }
    throw error;
  }
}
