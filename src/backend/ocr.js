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
  return cleanText(text)
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ');
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
  const hasIdentitySignal = /(姓名|求职意向|教育|学校|院校|专业|性别|邮箱|电话|实习|项目|技能|工作经历|教育经历)/.test(normalized);
  const corruptGlyphs = /个亲简历|教育背施|籍设|特话|迎箱|与业|姓后|Werf基本资料/.test(compact);
  const denseSingleLine = compact.length > 360 && lineCount <= 3;
  const tooShortForResume = compact.length < 80;
  return corruptGlyphs || denseSingleLine || tooShortForResume || !hasIdentitySignal;
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
