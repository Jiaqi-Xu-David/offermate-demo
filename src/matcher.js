export const COMPANY = {
  name: '星河科技',
  subtitle: '2026 校园招聘与实习岗位池',
};

export const SAMPLE_RESUME_TEXT = `陈雨桐
求职意向：数据分析 / 产品运营 / 商业分析实习
联系方式：yutong.chen@example.com · 138-0000-0000
城市偏好：上海 / 杭州 / 远程

教育背景
复旦大学 统计学 本科 2026届
主修课程：概率论、回归分析、数据库基础、商业数据分析

核心技能
SQL、Python、Excel、Tableau、A/B测试、数据清洗、转化漏斗、问卷调研、用户访谈

实习经历
星云零售 数据分析实习生
- 用 Python 清洗 10万+ 用户行为数据，搭建注册-激活-留存转化漏斗分析表
- 使用 SQL 分析会员留存和复购行为，制作 Tableau 周报看板
- 协助运营团队复盘新人优惠券活动，输出 3 条提升转化率的建议

项目经历
校园 App 新用户体验研究
- 设计并回收 80 份问卷，访谈 12 名同学，定位路径阻塞和内容吸引力问题
- 将反馈拆分为功能认知、使用路径、内容偏好三类，形成产品优化建议

校园经历
数据科学社团 运营负责人
- 组织 4 场数据分析工作坊，负责报名转化、用户访谈和活动数据复盘`;

const SKILL_DICTIONARY = [
  'SQL',
  'Python',
  'Excel',
  'Tableau',
  'A/B测试',
  '数据清洗',
  '转化漏斗',
  '问卷调研',
  '用户访谈',
  '用户分层',
  '活动复盘',
  '商业分析',
  '市场研究',
  '数据看板',
  '机器学习',
  '深度学习',
  'PyTorch',
  '推荐系统',
  '数学建模',
];

const INTEREST_DICTIONARY = ['互联网', '消费', '数据产品', '用户增长', '零售', '商业分析'];

const CITY_DICTIONARY = ['上海', '杭州', '北京', '深圳', '广州', '远程'];

const RESPONSIBILITY_RULES = [
  ['增长', '用户增长'],
  ['运营', '用户运营'],
  ['活动', '活动复盘'],
  ['转化', '用户转化诊断'],
  ['看板', '指标看板建设'],
  ['分析', '业务数据分析'],
  ['研究', '市场与用户研究'],
  ['模型', '模型训练'],
  ['推荐', '推荐策略优化'],
];

const KEYWORD_ALIASES = {
  问卷调研: ['问卷', '用户调研', '问卷反馈'],
  数据看板: ['Tableau 看板', '周报看板', '看板'],
  市场研究: ['用户调研', '问卷反馈'],
  活动复盘: ['活动数据复盘', '复盘新人优惠券活动'],
  用户分层: ['用户分群', '人群分层'],
};

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function extractKnownTerms(text, dictionary) {
  return dictionary.filter((term) => {
    const aliases = KEYWORD_ALIASES[term] ?? [];
    return [term, ...aliases].some((candidate) => text.includes(candidate));
  });
}

function extractBulletExperiences(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'))
    .map((line) => line.replace(/^-\s*/, ''));
}

function hashText(text) {
  return [...text].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

export function parseResumeText(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const name = lines[0] ?? '求职者';
  const educationLine = lines.find((line) => line.includes('本科') || line.includes('硕士')) ?? '学生';
  const targetLine = lines.find((line) => line.startsWith('求职意向')) ?? '求职意向：数据分析相关实习';
  const target = targetLine.replace('求职意向：', '');
  const skills = extractKnownTerms(text, SKILL_DICTIONARY);
  const interests = unique([...extractKnownTerms(text, INTEREST_DICTIONARY), ...target.split(/[ /、]+/).filter(Boolean)]);
  const cityPreferences = extractKnownTerms(text, CITY_DICTIONARY);
  const experiences = extractBulletExperiences(text);

  return {
    name,
    headline: educationLine.replace('教育背景', '').trim(),
    target,
    cityPreferences,
    skills,
    interests,
    experiences,
    rawResume: text,
  };
}

export const STUDENT_PROFILE = parseResumeText(SAMPLE_RESUME_TEXT);

export const JOBS = [
  {
    id: 'data-analyst-intern',
    title: '数据分析实习生',
    company: COMPANY.name,
    city: '上海',
    tags: ['SQL', 'Python', 'Tableau', '转化漏斗', 'A/B测试'],
    responsibilities: ['业务数据分析', '指标看板建设', '用户转化诊断'],
    niceToHave: ['互联网', '数据产品', '用户增长'],
  },
  {
    id: 'product-ops-intern',
    title: '产品运营实习生',
    company: COMPANY.name,
    city: '上海',
    tags: ['SQL', '用户分层', '活动复盘', '问卷调研', '转化漏斗'],
    responsibilities: ['用户运营', '活动数据复盘', '需求洞察'],
    niceToHave: ['消费', '互联网', '用户增长'],
  },
  {
    id: 'business-analyst-intern',
    title: '商业分析实习生',
    company: COMPANY.name,
    city: '杭州',
    tags: ['Excel', 'SQL', '商业分析', '市场研究', '数据看板'],
    responsibilities: ['行业研究', '经营数据分析', '报告撰写'],
    niceToHave: ['消费', '数据产品'],
  },
  {
    id: 'algorithm-intern',
    title: '算法工程实习生',
    company: COMPANY.name,
    city: '上海',
    tags: ['机器学习', '深度学习', 'PyTorch', '推荐系统', '数学建模'],
    responsibilities: ['模型训练', '推荐策略优化', '实验评估'],
    niceToHave: ['科研论文', '算法竞赛'],
  },
];

const hasTextMatch = (items, keyword) => {
  const terms = [keyword, ...(KEYWORD_ALIASES[keyword] ?? [])];
  return items.some((item) => terms.some((term) => item.includes(term)));
};

const clampScore = (score) => Math.max(0, Math.min(100, score));

export function analyzeJobFit(profile, job) {
  const profileText = [
    ...profile.skills,
    ...profile.interests,
    ...profile.experiences,
    ...profile.cityPreferences,
  ];
  const matchedTags = job.tags.filter((tag) => hasTextMatch(profileText, tag));
  const matchedNiceToHave = job.niceToHave.filter((tag) => hasTextMatch(profileText, tag));
  const cityMatch = profile.cityPreferences.includes(job.city) || job.city === '远程';
  const skillScore = Math.round((matchedTags.length / job.tags.length) * 60);
  const interestScore = Math.round((matchedNiceToHave.length / Math.max(job.niceToHave.length, 1)) * 20);
  const cityScore = cityMatch ? 10 : 0;
  const evidenceScore = matchedTags.length >= 3 ? 10 : matchedTags.length >= 2 ? 6 : 2;
  const score = clampScore(skillScore + interestScore + cityScore + evidenceScore);

  let level = '暂缓';
  if (score >= 80) level = '优先投递';
  else if (score >= 65) level = '可投递';

  return {
    job,
    score,
    level,
    matchedTags,
    matchedNiceToHave,
    gaps: job.tags.filter((tag) => !matchedTags.includes(tag)),
    reasons: [
      `${matchedTags.length}/${job.tags.length} 个核心关键词已被简历证据覆盖`,
      cityMatch ? `地点偏好包含 ${job.city}` : `地点 ${job.city} 不在当前偏好中`,
      matchedNiceToHave.length > 0
        ? `兴趣方向与 ${matchedNiceToHave.join('、')} 有交集`
        : '行业兴趣证据较弱',
    ],
  };
}

export function rankJobs(profile, jobs = JOBS) {
  return jobs
    .map((job) => analyzeJobFit(profile, job))
    .sort((a, b) => b.score - a.score);
}

export function analyzeJobDescription({ title, city, description, company = COMPANY.name }) {
  const sourceText = `${title}\n${city}\n${description}`;
  const tags = extractKnownTerms(sourceText, SKILL_DICTIONARY);
  const responsibilities = unique(
    RESPONSIBILITY_RULES
      .filter(([keyword]) => sourceText.includes(keyword))
      .map(([, responsibility]) => responsibility),
  );
  const niceToHave = unique([...extractKnownTerms(sourceText, INTEREST_DICTIONARY), '互联网']);

  return {
    id: `admin-${Math.abs(hashText(sourceText))}`,
    title: title.trim() || '新增实习岗位',
    company,
    city: city.trim() || '上海',
    tags: (tags.length > 0 ? tags : ['沟通协作', '学习能力', '数据敏感度']).slice(0, 6),
    responsibilities: (responsibilities.length > 0 ? responsibilities : ['岗位任务执行', '跨团队协作']).slice(0, 4),
    niceToHave: niceToHave.slice(0, 4),
    description,
    source: 'admin',
  };
}

export function buildResumeAdvice(profile, job) {
  const analysis = analyzeJobFit(profile, job);
  const firstGap = analysis.gaps[0] ?? job.tags[0];
  const primaryExperience = profile.experiences[0] ?? '参与数据分析项目';
  const researchExperience = profile.experiences.find((item) => item.includes('问卷')) ?? profile.experiences[1] ?? primaryExperience;

  return {
    coveredKeywords: analysis.matchedTags,
    missingKeywords: analysis.gaps,
    screeningSignal:
      analysis.score >= 80 ? '中高：建议优化后优先投递' : analysis.score >= 65 ? '中：可补强关键词后投递' : '偏低：建议先补项目证据',
    rewrites: [
      {
        before: primaryExperience,
        after:
          '基于 SQL 与 Python 清洗 10万+ 用户行为数据，搭建注册-激活-留存转化漏斗，定位关键流失节点并输出看板洞察。',
      },
      {
        before: researchExperience,
        after:
          '围绕校园 App 新用户体验设计问卷，回收并整理 80 份反馈，将问题归因到功能认知、路径阻塞和内容吸引力三类。',
      },
    ],
    nextActions: [
      `在简历技能区补充 ${firstGap} 的真实使用场景`,
      '把最相关项目放到简历第一页上半部分',
      '每段经历补充动作、工具、规模、结果四个要素',
      '投递前准备 30 秒岗位匹配自我介绍',
    ],
  };
}
