import { parseResumeText } from '../matcher.js';

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-v4-pro';
const OPENAI_RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';
const OPENAI_PROFILE_MODEL = 'gpt-4o-mini';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return unique(value.map(cleanText).filter(Boolean));
}

function parseJsonObject(content) {
  const raw = cleanText(content);
  if (!raw) throw new Error('DeepSeek returned empty content');
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('DeepSeek response did not contain JSON');
    return JSON.parse(match[0]);
  }
}

function mergeProfile(rawText, parsed, parser = DEEPSEEK_MODEL) {
  const fallback = parseResumeText(rawText);
  const skills = unique([...normalizeArray(parsed.skills), ...(fallback.skills ?? [])]);
  const languages = unique([...normalizeArray(parsed.languages), ...(fallback.languages ?? [])]);
  const softSkills = unique([...normalizeArray(parsed.softSkills), ...(fallback.softSkills ?? [])]);
  const experiences = normalizeArray(parsed.experiences).length ? normalizeArray(parsed.experiences) : fallback.experiences;
  const cityPreferences = normalizeArray(parsed.cityPreferences).length ? normalizeArray(parsed.cityPreferences) : fallback.cityPreferences;
  const interests = unique([...normalizeArray(parsed.interests), ...(fallback.interests ?? [])]);

  return {
    ...fallback,
    name: cleanText(parsed.name) || fallback.name,
    gender: cleanText(parsed.gender) || fallback.gender,
    headline: cleanText(parsed.headline) || fallback.headline,
    target: cleanText(parsed.target) || fallback.target,
    cityPreferences,
    skills,
    languages,
    softSkills,
    interests,
    experiences,
    rawResume: rawText,
    parser,
  };
}

function buildResumeExtractionPrompt(rawText) {
  return [
    {
      role: 'system',
      content: `你是专业招聘数据分析助手。请把用户提供的简历文本解析成严格 JSON，不要输出解释。

JSON 字段：
{
  "name": "姓名",
  "gender": "男/女/未填写",
  "headline": "学校 专业 学历 年级",
  "target": "求职意向",
  "cityPreferences": ["城市"],
  "skills": ["硬技能或工具"],
  "languages": ["语言能力"],
  "softSkills": ["软技能"],
  "experiences": ["可作为岗位匹配证据的经历句子"],
  "interests": ["职业兴趣或行业方向"]
}

要求：只基于简历文本，不要编造；字段缺失时用空数组或“未填写”。`,
    },
    {
      role: 'user',
      content: `请输出 json。\n\n简历文本：\n${rawText.slice(0, 12000)}`,
    },
  ];
}

export async function parseResumeWithDeepSeek(env, rawText, options = {}) {
  const apiKey = cleanText(env?.DEEPSEEK_API_KEY);
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured');

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: buildResumeExtractionPrompt(rawText),
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1800,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`DeepSeek resume parsing failed: ${response.status} ${errorText.slice(0, 160)}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  return mergeProfile(rawText, parseJsonObject(content));
}

function getOpenAIProfileApiKey(env = {}) {
  return cleanText(env.OPENAI_PROFILE_API_KEY ?? env.OPENAI_API_KEY);
}

function getOpenAIProfileModel(env = {}) {
  return cleanText(env.OPENAI_PROFILE_MODEL) || OPENAI_PROFILE_MODEL;
}

function extractOpenAIOutputText(payload) {
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

function buildOpenAIProfilePrompt(rawText) {
  return `你是专业招聘数据分析助手。请把下面的 OCR/简历文本解析成严格 JSON，不要输出解释，不要 Markdown。

JSON 字段：
{
  "name": "姓名",
  "gender": "男/女/未填写",
  "headline": "学校 专业 学历 年级",
  "target": "求职意向",
  "cityPreferences": ["城市"],
  "skills": ["硬技能或工具"],
  "languages": ["语言能力"],
  "softSkills": ["软技能"],
  "experiences": ["可作为岗位匹配证据的经历句子"],
  "interests": ["职业兴趣或行业方向"]
}

要求：
1. 只基于简历文本，不要编造。
2. 姓名不要取“个人简历”“专业赛事”“基本资料”等栏目标题。
3. experiences 只保留能支撑岗位匹配的经历，不要塞入电话、邮箱、自荐信或大段课程介绍。
4. 字段缺失时用空数组或“未填写”。

简历文本：
${rawText.slice(0, 12000)}`;
}

export async function parseResumeWithOpenAI(env, rawText, options = {}) {
  const apiKey = getOpenAIProfileApiKey(env);
  if (!apiKey) throw new Error('OPENAI_API_KEY or OPENAI_PROFILE_API_KEY is not configured');

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(OPENAI_RESPONSES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getOpenAIProfileModel(env),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildOpenAIProfilePrompt(rawText),
            },
          ],
        },
      ],
      max_output_tokens: 1800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI resume parsing failed: ${response.status} ${errorText.slice(0, 160)}`);
  }

  const payload = await response.json();
  return mergeProfile(rawText, parseJsonObject(extractOpenAIOutputText(payload)), 'openai-responses');
}

export async function parseResumeProfile(env, rawText, options = {}) {
  const fallback = { ...parseResumeText(rawText), parser: 'rules' };
  const warnings = [];

  if (cleanText(env?.DEEPSEEK_API_KEY)) {
    try {
      return await parseResumeWithDeepSeek(env, rawText, options);
    } catch (error) {
      warnings.push(error.message);
    }
  }

  if (getOpenAIProfileApiKey(env)) {
    try {
      return await parseResumeWithOpenAI(env, rawText, options);
    } catch (error) {
      warnings.push(error.message);
    }
  }

  return warnings.length ? { ...fallback, parserWarning: warnings.join('；') } : fallback;
}
