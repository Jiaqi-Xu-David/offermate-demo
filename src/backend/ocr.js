import { extractPdfText } from './pdf.js';

const OPENAI_RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';
const DEFAULT_OCR_MODEL = 'gpt-4o-mini';
const DEFAULT_MAX_OCR_FILE_BYTES = 8_000_000;

function cleanText(value) {
  return String(value ?? '').trim();
}

function isPageMarkerLine(line) {
  const normalized = cleanText(line).replace(/\s+/g, ' ');
  if (!normalized) return false;
  return [
    /^第\s*\d+\s*页(?:\s*[\/／]\s*共?\s*\d+\s*页?)?$/i,
    /^第\s*\d+\s*\/\s*\d+\s*页$/i,
    /^第\s*\d+\s*页\s*[,，]\s*共?\s*\d+\s*页?$/i,
    /^页码\s*[:：]?\s*\d+(?:\s*[\/／]\s*\d+)?$/i,
    /^page\s*(?:no\.?\s*)?\d+(?:\s*(?:of|\/)\s*\d+)?$/i,
    /^page\s*\d+(?:\s*(?:of|\/)\s*\d+)?$/i,
    /^page\s*\d+\s*[,，-]\s*(?:of\s*)?\d+$/i,
    /^pg\.?\s*\d+(?:\s*(?:of|\/)\s*\d+)?$/i,
    /^p(?:age)?[.:]?\s*\d+(?:\s*[\/／]\s*\d+)?$/i,
    /^\d+\s*[\/／]\s*\d+$/,
    /^[\-–—_~·•]+\s*\d+\s*[\-–—_~·•]+$/,
  ].some((pattern) => pattern.test(normalized));
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
    .replace(/^\*\*(.*?)\*\*$/gm, '$1')
    .replace(/\u00AD/g, '')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  const lines = normalized.split('\n');
  const cleanedLine = (line) => line.trim().replace(/^[-*•\d.)\s]+/, '');
  const normalizedLine = (line) => cleanedLine(line).replace(/[’']/g, "'");
  const normalizedWrapperLine = (line) =>
    normalizedLine(line).replace(/\s*[（(][^()（）]{1,80}[)）]\s*(?=[：:]?$)/g, '');
  const isWrapperLine = (line) =>
    /^(?:(?:当然可以|好的)[，,:：]?\s*)?(?:(?:以下|这|下面)(?:里|是)?(?:为|提供|整理|提取)?\s*)?(?:(?:识别后|提取后|整理后|按原文(?:换行)?整理后|清理格式后)(?:的)?\s*)?(?:简历(?:(?:原文|文本)(?:整理后)?(?:的)?(?:纯文本)?)?|OCR\s*(?:识别)?\s*结果|识别结果|提取结果|文本内容|纯文本(?:结果)?)\s*(?:如下)?\s*[：:]?\s*$/i.test(
      normalizedWrapperLine(line),
    ) || /^(?:(?:sure|certainly|of course)[,:\s-]*)?(?:here is|below is|here's|the following is)\s+the\s+(?:extracted\s+)?(?:attached\s+)?(?:resume\s+)?(?:text|ocr\s+result)\s*[：:]?\s*$/i.test(
      normalizedWrapperLine(line),
    ) || /^ocr\s+output\s+is\s+as\s+follows\s*[：:]?\s*$/i.test(
      normalizedWrapperLine(line),
    );
  const isPrefaceLine = (line) =>
    /^(?:(?:当然可以|好的)[，,:：]?\s*)?(?:(?:以下|这|下面)(?:里|是)?(?:(?:从|为|对)\s*){0,2})?(?:这份|该)?\s*(?:(?:简历|PDF|图片)\s*){0,2}(?:中)?\s*(?:识别|提取|整理)(?:出|后)?(?:的)?\s*(?:简历)?\s*(?:原文|文本|纯文本)(?:内容|结果)?(?:\s*[（(](?:已按原文(?:换行)?整理|清理格式)[)）])?\s*(?:如下)?\s*[：:]?\s*$/i.test(
      normalizedWrapperLine(line),
    ) || /^(?:(?:sure|certainly|of course)[,:\s-]*)?(?:here is|below is|here's|the following is|please find)\s+(?:the\s+)?(?:(?:extracted|parsed)\s+)?(?:(?:resume\s+)?text|plain[\s-]+text)(?:\s+resume\s+content)?(?:\s+(?:is\s+)?(?:extracted|parsed))?(?:\s+\((?:cleaned|formatted|cleaned formatting|kept in original layout)\))?\s*(?:from\s+(?:this\s+|the\s+attached\s+)?(?:resume(?:\s+pdf)?|pdf|image))?\s*(?:below\s*)?\s*[：:]?\s*$/i.test(
      normalizedWrapperLine(line),
    ) || /^(?:below\s+is\s+)?the\s+extracted\s+text\s+from\s+the\s+resume(?:\s+attached\s+below)?\s*[：:]?\s*$/i.test(
      normalizedWrapperLine(line),
    ) || /^resume\s+text\s+(?:is\s+)?(?:extracted|parsed)\s+from\s+(?:this\s+|the\s+attached\s+)?(?:resume(?:\s+pdf)?|pdf|image)(?:\s+below)?\s*[：:]?\s*$/i.test(
      normalizedWrapperLine(line),
    ) || /^attached\s+below\s+is\s+the\s+(?:(?:extracted|parsed)\s+)?(?:resume\s+text|plain[\s-]+text)(?:\s+resume\s+content)?\s*(?:(?:(?:is\s+)?(?:extracted|parsed)\s+)?from\s+(?:this\s+|the\s+attached\s+)?(?:resume(?:\s+pdf)?|pdf|image))?\s*[：:]?\s*$/i.test(
      normalizedWrapperLine(line),
    ) || /^the\s+resume\s+text\s+is\s+(?:extracted|parsed)\s+below\s*[：:]?\s*$/i.test(
      normalizedWrapperLine(line),
    );
  while (
    lines.length > 0 &&
    (isWrapperLine(lines[0]) || isPrefaceLine(lines[0]))
  ) {
    lines.shift();
  }
  return lines.filter((line) => !isPageMarkerLine(line)).join('\n').trim();
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
    /(姓名|求职意向|教育|学校|院校|专业|性别|邮箱|电子邮箱|电话|手机号|联系电话|联系方式|微信|实习|项目|技能|工作经历|教育经历|\bName\b|\bProfile\b|\bProfile Details\b|\bPersonal (?:Information|Details)\b|\bSummary\b|\bProfile Summary\b|\bProfessional Summary\b|\bSummary of Qualifications\b|\bContact(?: Information| Details)?\b|\bContact\b|\bLocation\b|\bCurrent City\b|\bCurrent Location\b|\bCurrent Address\b|\bPreferred City\b|\bPresent Location\b|\bAddress\b|\bTarget Role\b|\bObjective\b|\bEducation(?: Background)?\b|\bEducation & Training\b|\bUniversity\b|\bSchool\b|\bMajor\b|\bGender\b|\bDate of Birth\b|\bE-?mail(?: Address)?\b|\bEmail ID\b|\bPhone(?: Number| No\.?)?\b|\bMobile\b|\bCell\b|\bTel\b|\bTelephone\b|\bWeChat\b|\bExperience\b|\bProfessional Experience\b|\bWork Experience\b|\bEmployment History\b|\bRelevant Experience\b|\bInternships?\b|\bInternship Experience\b|\bProjects?\b|\bProject Experience\b|\bRelevant Projects\b|\bSelected Projects\b|\bAcademic Projects\b|\bTechnical Skills\b|\bTechnical Proficiencies\b|\bKey Skills\b|\bSkill Set\b|\bSkills?(?: & Tools)?\b|\bLinkedIn(?: URL)?\b|\bPortfolio(?: URL)?\b|\bWebsite(?: URL)?\b|\bGitHub(?: URL)?\b|\bCore Competencies\b|\bCareer Highlights\b|\bCertifications\b|\bAwards\b|\bLeadership(?: Experience)?\b|\bActivities\b|\bRelevant Coursework\b|\bCoursework\b|\bTools\b|\bLanguages?\b|\bAvailability(?: to Join)?\b|\bAvailable to Join\b|\bCurrent Availability\b|\bAvailable From\b|\bAvailable to Start\b|\bExpected Graduation\b|\bCitizenship\b|\bNationality\b|\bVisa Status\b|\bWork Authorization\b|\bNotice(?: Period)?\b)/gi,
  ) ?? [];
  const hasIdentitySignal = identityLabelMatches.length > 0;
  const hasStructuredIdentityFields = identityLabelMatches.length >= 4 && lineCount >= 3;
  const hasConciseStructuredHeader =
    identityLabelMatches.length >= 3 &&
    lineCount >= 3 &&
    compact.length >= 32 &&
    /(姓名|邮箱|电子邮箱|电话|手机号|联系电话|联系方式|微信|\bName\b|\bAddress\b|\bCurrent City\b|\bCurrent Location\b|\bCurrent Address\b|\bPreferred City\b|\bPresent Location\b|\bDate of Birth\b|\bE-?mail(?: Address)?\b|\bEmail ID\b|\bPhone(?: Number| No\.?)?\b|\bMobile\b|\bCell\b|\bTel\b|\bTelephone\b|\bWeChat\b|\bContact(?: Information| Details)?\b|\bContact\b|\bLinkedIn\b|\bPortfolio\b|\bWebsite\b|\bPersonal (?:Information|Details)\b|\bProfile Details\b|\bProfile Summary\b)/i.test(normalized) &&
    /(技能|项目|实习|教育|求职意向|\bSkill Set\b|\bSkills?(?: & Tools)?\b|\bTechnical Skills\b|\bTechnical Proficiencies\b|\bProjects?\b|\bExperience\b|\bEducation(?: Background)?\b|\bObjective\b|\bTarget Role\b|\bTools\b|\bLanguages?\b|\bAvailability(?: to Join)?\b|\bAvailable to Join\b|\bCurrent Availability\b|\bAvailable From\b|\bAvailable to Start\b)/i.test(normalized);
  const hasConciseContactLinkHeader =
    identityLabelMatches.length >= 3 &&
    lineCount >= 3 &&
    compact.length >= 24 &&
    /(?:\bName\b|\bAddress\b|\bCurrent Address\b|\bE-?mail(?: Address)?\b|\bEmail ID\b|\bPhone(?: Number| No\.?)?\b|\bMobile\b|\bCell\b|\bTel\b|\bTelephone\b|\bContact(?: Information| Details)?\b|\bPersonal (?:Information|Details)\b|\bProfile Details\b)/i.test(normalized) &&
    /(?:\bLinkedIn(?: URL)?\b|\bPortfolio(?: URL)?\b|\bWebsite(?: URL)?\b|\bGitHub(?: URL)?\b)/i.test(normalized);
  const corruptGlyphs = /个亲简历|教育背施|籍设|特话|迎箱|与业|姓后|Werf基本资料/.test(compact);
  const denseSingleLine = compact.length > 360 && lineCount <= 3;
  const tooShortForResume = compact.length < 80;
  if (corruptGlyphs || denseSingleLine || !hasIdentitySignal) return true;
  if (hasStructuredIdentityFields || hasConciseStructuredHeader || hasConciseContactLinkHeader) return false;
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
      store: false,
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
