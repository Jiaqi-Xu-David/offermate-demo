export const COMPANY = {
  name: '星河科技',
  subtitle: '2026 校园招聘与实习岗位池',
};

export const SAMPLE_RESUME_TEXT = `陈雨桐
求职意向：数据分析 / 产品运营 / 商业分析实习
联系方式：yutong.chen@example.com · 138-0000-0000
个人信息：女 · 英语 CET-6 · 每周可实习 4 天
城市偏好：上海 / 杭州 / 远程

教育背景
复旦大学 统计学 本科 2026届
主修课程：概率论、回归分析、数据库基础、商业数据分析

核心技能
SQL、Python、Excel、Tableau、A/B测试、数据清洗、转化漏斗、问卷调研、用户访谈
技能熟练度：Python（高级）、SQL（中级）、Tableau（项目熟练）、Excel（熟练）

语言与软技能
英语 CET-6，可阅读英文产品文档与数据工具文档
跨部门沟通、结构化表达、主动学习、项目推进

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
  '推荐算法',
  '数学建模',
];

const SOFT_SKILL_DICTIONARY = [
  '跨部门沟通',
  '结构化表达',
  '主动学习',
  '项目推进',
  '业务敏感度',
  '逻辑分析',
  '沟通协作',
  '结果导向',
  '汇报表达',
  '自驱力',
];

const SOFT_SKILL_EVIDENCE_RULES = {
  跨部门沟通: ['跨部门沟通', '协助运营团队', '产品与运营团队', '产品经理'],
  结构化表达: ['结构化表达', '拆分为', '形成产品优化建议', '输出', '汇报材料'],
  主动学习: ['主动学习', '工作坊', '社团', '查阅', '学习'],
  项目推进: ['项目推进', '组织 4 场数据分析工作坊', '运营负责人', '推动', '负责报名转化'],
  业务敏感度: ['业务敏感度', '转化率', '复购', '业务指标', '策略判断'],
  逻辑分析: ['逻辑分析', '归因', '拆解', '定位'],
  沟通协作: ['沟通协作', '协助', '团队'],
  结果导向: ['结果导向', '提升转化率', '优化建议'],
  汇报表达: ['汇报表达', '汇报材料', '报告'],
  自驱力: ['自驱力', '负责人', '主动学习'],
};

const LANGUAGE_RULES = [
  { name: '英语 CET-6', aliases: ['英语 CET-6', 'CET-6', '大学英语六级', '英语六级'] },
  { name: '英语 CET-4', aliases: ['英语 CET-4', 'CET-4', '大学英语四级', '英语四级'] },
  { name: '英文文档阅读', aliases: ['英文文档', '英文产品文档', '英文技术文档'] },
  { name: '英语口语沟通', aliases: ['英语口语', '英文会议', '英语沟通'] },
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
  转化漏斗: ['注册-激活-留存转化漏斗', '漏斗分析', '转化链路'],
  'A/B测试': ['AB测试', 'A/B test', '实验分析'],
};

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractKnownTerms(text, dictionary) {
  return dictionary.filter((term) => {
    const aliases = KEYWORD_ALIASES[term] ?? [];
    return [term, ...aliases].some((candidate) => text.includes(candidate));
  });
}

function extractAliasTerms(text, rules) {
  return rules
    .filter((rule) => rule.aliases.some((alias) => text.includes(alias)))
    .map((rule) => rule.name);
}

function countTermOccurrences(text, term) {
  const aliases = [term, ...(KEYWORD_ALIASES[term] ?? [])];
  return aliases.reduce((sum, candidate) => {
    const matches = text.match(new RegExp(escapeRegExp(candidate), 'gi'));
    return sum + (matches?.length ?? 0);
  }, 0);
}

function findTermWindows(text, term, radius = 18) {
  const aliases = [term, ...(KEYWORD_ALIASES[term] ?? [])];
  return aliases.flatMap((candidate) => {
    const windows = [];
    const pattern = new RegExp(escapeRegExp(candidate), 'gi');
    let match = pattern.exec(text);
    while (match) {
      const start = Math.max(0, match.index - radius);
      const end = Math.min(text.length, match.index + candidate.length + radius);
      windows.push(text.slice(start, end));
      match = pattern.exec(text);
    }
    return windows;
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

function extractExplicitSkillLevel(text, skill) {
  const levels = '高级|项目熟练|熟练|中级|基础|初级|了解';
  const afterPattern = new RegExp(`${escapeRegExp(skill)}\\s*[（(]?\\s*(${levels})\\s*[）)]?`, 'i');
  const afterMatch = text.match(afterPattern);
  if (afterMatch) return afterMatch[1];

  const beforePattern = new RegExp(`(${levels})\\s*${escapeRegExp(skill)}`, 'i');
  const beforeMatch = text.match(beforePattern);
  return beforeMatch?.[1] ?? '';
}

function inferResumeSkillLevel(text, skill, count) {
  const explicitLevel = extractExplicitSkillLevel(text, skill);
  if (explicitLevel) return explicitLevel === '初级' ? '基础' : explicitLevel;

  const windows = findTermWindows(text, skill, 8).join(' ');
  if (/高级|精通|熟练掌握/.test(windows)) return '高级';
  if (/项目熟练|熟练/.test(windows)) return '熟练';
  if (/中级|较熟悉/.test(windows)) return '中级';
  if (/初级|基础|了解/.test(windows)) return '基础';
  if (count >= 4) return '高级';
  if (count >= 2) return '中级';
  if (count >= 1) return '基础';
  return '未体现';
}

function buildSkillEvidence(text, skills = SKILL_DICTIONARY) {
  return Object.fromEntries(
    skills
      .map((skill) => {
        const count = countTermOccurrences(text, skill);
        if (count === 0) return null;
        const appearsInSkillSection = new RegExp(`核心技能[\\s\\S]{0,120}${escapeRegExp(skill)}`, 'i').test(text);
        const appearsInProject = new RegExp(`(实习经历|项目经历|校园经历)[\\s\\S]*${escapeRegExp(skill)}`, 'i').test(text);
        return [
          skill,
          {
            count,
            level: inferResumeSkillLevel(text, skill, count),
            sources: unique([
              appearsInSkillSection ? '技能区' : '',
              appearsInProject ? '项目/经历' : '',
            ]),
          },
        ];
      })
      .filter(Boolean),
  );
}

function extractGender(text) {
  const explicitGender = text.match(/(?:性别|个人信息)[：:\s·]*(男|女|非二元|不便透露)/);
  if (explicitGender) return explicitGender[1];
  return '未填写';
}

export function parseResumeText(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const name = lines[0] ?? '求职者';
  const educationLine = lines.find((line) => line.includes('本科') || line.includes('硕士')) ?? '学生';
  const targetLine = lines.find((line) => line.startsWith('求职意向')) ?? '求职意向：数据分析相关实习';
  const target = targetLine.replace('求职意向：', '');
  const skills = extractKnownTerms(text, SKILL_DICTIONARY);
  const skillEvidence = buildSkillEvidence(text, skills);
  const interests = unique([...extractKnownTerms(text, INTEREST_DICTIONARY), ...target.split(/[ /、]+/).filter(Boolean)]);
  const cityPreferences = extractKnownTerms(text, CITY_DICTIONARY);
  const languages = extractAliasTerms(text, LANGUAGE_RULES);
  const softSkills = extractKnownTerms(text, SOFT_SKILL_DICTIONARY);
  const experiences = extractBulletExperiences(text);

  return {
    name,
    gender: extractGender(text),
    headline: educationLine.replace('教育背景', '').trim(),
    target,
    cityPreferences,
    skills,
    languages,
    softSkills,
    skillEvidence,
    interests,
    experiences,
    rawResume: text,
  };
}

export const STUDENT_PROFILE = parseResumeText(SAMPLE_RESUME_TEXT);

function detectRequirementLevel(text, skill) {
  const windows = findTermWindows(text, skill, 12).join(' ');
  if (/高级|精通|复杂/.test(windows)) return '高级';
  if (/必须|必备|必要|硬性/.test(windows)) return '必须';
  if (/熟练|熟练掌握/.test(windows)) return '熟练';
  if (/中级|较熟悉/.test(windows)) return '中级';
  if (/熟悉|理解|掌握/.test(windows)) return '熟悉';
  if (/了解/.test(windows)) return '了解';
  return '需具备';
}

export function parseJobDescription(description) {
  const salaryMatch = description.match(/薪资[：:\s]*([0-9]+(?:\s*-\s*[0-9]+)?\s*(?:元\/天|元\/日|\/天|k\/月|K\/月|K|k))/);
  const hardSkillRequirements = extractKnownTerms(description, SKILL_DICTIONARY).map((name) => ({
    name,
    requiredLevel: detectRequirementLevel(description, name),
  }));

  return {
    salary: salaryMatch ? salaryMatch[1].replace(/\s+/g, '') : '',
    hardSkillRequirements,
    softSkills: extractKnownTerms(description, SOFT_SKILL_DICTIONARY),
    languageRequirements: extractAliasTerms(description, LANGUAGE_RULES),
  };
}

export function enrichJob(job) {
  const parsed = parseJobDescription(job.description ?? '');
  return {
    ...job,
    salary: job.salary || parsed.salary || '待补充',
    hardSkillRequirements: job.hardSkillRequirements ?? parsed.hardSkillRequirements,
    softSkills: unique([...(job.softSkills ?? []), ...parsed.softSkills]),
    languageRequirements: unique([...(job.languageRequirements ?? []), ...parsed.languageRequirements]),
  };
}

const JOB_SEEDS = [
  {
    id: 'data-analyst-intern',
    title: '数据分析实习生',
    company: COMPANY.name,
    city: '上海',
    description:
      '薪资：220-280元/天。参与星河科技用户增长与交易业务的数据分析工作，要求高级 SQL、高级 Python，必须会 Tableau 搭建指标看板，理解转化漏斗和 A/B测试结果分析，向产品与运营团队输出可执行的数据洞察。软技能要求跨部门沟通、结构化表达、业务敏感度；语言要求英语 CET-6，可阅读英文数据工具文档。',
    tags: ['SQL', 'Python', 'Tableau', '转化漏斗', 'A/B测试'],
    responsibilities: ['业务数据分析', '指标看板建设', '用户转化诊断'],
    niceToHave: ['互联网', '数据产品', '用户增长'],
  },
  {
    id: 'product-ops-intern',
    title: '产品运营实习生',
    company: COMPANY.name,
    city: '上海',
    description:
      '薪资：180-220元/天。支持星河科技校园产品的新用户运营，熟练使用 SQL 做用户分层和转化漏斗诊断，参与活动复盘、问卷调研和内容触达策略优化，协助产品经理定位用户路径问题。软技能要求跨部门沟通、项目推进、结果导向；语言要求英语 CET-4，能阅读基础英文产品资料。',
    tags: ['SQL', '用户分层', '活动复盘', '问卷调研', '转化漏斗'],
    responsibilities: ['用户运营', '活动数据复盘', '需求洞察'],
    niceToHave: ['消费', '互联网', '用户增长'],
  },
  {
    id: 'business-analyst-intern',
    title: '商业分析实习生',
    company: COMPANY.name,
    city: '杭州',
    description:
      '薪资：200-260元/天。参与星河科技商业化团队的经营分析与市场研究，要求熟练 Excel、SQL 和数据看板整理业务指标，完成商业分析、市场研究、竞品观察和管理层汇报材料，支持业务策略判断。软技能要求结构化表达、业务敏感度、汇报表达；语言要求英语 CET-6，能整理英文行业资料。',
    tags: ['Excel', 'SQL', '商业分析', '市场研究', '数据看板'],
    responsibilities: ['行业研究', '经营数据分析', '报告撰写'],
    niceToHave: ['消费', '数据产品'],
  },
  {
    id: 'algorithm-intern',
    title: '算法工程实习生',
    company: COMPANY.name,
    city: '上海',
    description:
      '薪资：260-320元/天。参与星河科技推荐算法和智能匹配实验，要求高级 Python，熟悉机器学习、深度学习和 PyTorch，完成样本处理、模型训练、数学建模和离线评估，协助优化推荐效果。软技能要求逻辑分析、主动学习、结构化表达；语言要求英文文档阅读，能查阅英文技术文档。',
    tags: ['机器学习', '深度学习', 'PyTorch', '推荐算法', '数学建模'],
    responsibilities: ['模型训练', '推荐策略优化', '实验评估'],
    niceToHave: ['科研论文', '算法竞赛'],
  },
];

export const JOBS = JOB_SEEDS.map(enrichJob);

export function findJobById(jobId, jobs = JOBS) {
  return jobs.find((job) => job.id === jobId) ?? null;
}

export const CANDIDATES = [
  {
    id: 'chen-yutong',
    name: '陈雨桐',
    school: '复旦大学',
    major: '统计学',
    submittedJobIds: ['data-analyst-intern', 'product-ops-intern'],
    profile: STUDENT_PROFILE,
  },
  {
    id: 'wang-ziang',
    name: '王子昂',
    school: '上海交通大学',
    major: '计算机科学',
    submittedJobIds: ['algorithm-intern'],
    profile: {
      name: '王子昂',
      gender: '男',
      headline: '上海交通大学 计算机科学 本科 2026届',
      target: '算法工程 / 推荐算法实习',
      cityPreferences: ['上海', '北京'],
      skills: ['Python', '机器学习', '深度学习', 'PyTorch', '推荐算法', '数学建模'],
      languages: ['英文文档阅读'],
      softSkills: ['逻辑分析', '主动学习'],
      interests: ['算法竞赛', '数据产品'],
      experiences: [
        '使用 PyTorch 训练点击率预估模型，完成样本清洗、特征构造和离线 AUC 评估',
        '参与课程推荐算法项目，实现召回和排序模块并进行实验评估',
      ],
    },
  },
  {
    id: 'li-ruohan',
    name: '李若涵',
    school: '浙江大学',
    major: '工商管理',
    submittedJobIds: ['business-analyst-intern'],
    profile: {
      name: '李若涵',
      gender: '女',
      headline: '浙江大学 工商管理 本科 2026届',
      target: '商业分析 / 产品运营实习',
      cityPreferences: ['杭州', '上海'],
      skills: ['Excel', 'SQL', '商业分析', '市场研究', '数据看板', '问卷调研'],
      languages: ['英语 CET-6'],
      softSkills: ['结构化表达', '汇报表达'],
      interests: ['消费', '互联网', '商业分析'],
      experiences: [
        '使用 Excel 和 SQL 整理消费行业经营数据，制作数据看板并输出月度分析报告',
        '完成 3 个竞品市场研究案例，拆解用户画像、定价策略和增长渠道',
      ],
    },
  },
];

const hasTextMatch = (items, keyword) => {
  const terms = [keyword, ...(KEYWORD_ALIASES[keyword] ?? [])];
  return items.some((item) => terms.some((term) => item.includes(term)));
};

const clampScore = (score) => Math.max(0, Math.min(100, score));

function profileToSearchText(profile) {
  return [
    ...(profile.skills ?? []),
    ...(profile.interests ?? []),
    ...(profile.experiences ?? []),
    ...(profile.cityPreferences ?? []),
    ...(profile.softSkills ?? []),
    ...(profile.languages ?? []),
    profile.rawResume ?? '',
  ].join('\n');
}

function getProfileSkillEvidence(profile, skill) {
  const existingEvidence = profile.skillEvidence?.[skill];
  if (existingEvidence) return existingEvidence;

  const profileText = profileToSearchText(profile);
  const count = countTermOccurrences(profileText, skill);
  return {
    count,
    level: count > 0 ? inferResumeSkillLevel(profileText, skill, count) : '未体现',
    sources: count > 0 ? ['技能/经历'] : [],
  };
}

function getJobRequirement(job, skill) {
  const requirements = job.hardSkillRequirements ?? parseJobDescription(job.description ?? '').hardSkillRequirements;
  return requirements.find((item) => item.name === skill)?.requiredLevel ?? '需具备';
}

function scoreSkillDetail(jdRequirement, resumeLevel, count) {
  if (count === 0 || resumeLevel === '未体现') return 0;
  if (jdRequirement === '高级') {
    if (resumeLevel === '高级') return 10;
    if (resumeLevel === '中级' || resumeLevel === '熟练' || resumeLevel === '项目熟练') return 8;
    return 6;
  }
  if (jdRequirement === '必须') return 10;
  if (resumeLevel === '高级') return 10;
  if (resumeLevel === '熟练' || resumeLevel === '项目熟练' || resumeLevel === '中级') return 9;
  return 7;
}

export function getSkillMatchDetails(profile, job) {
  return (job.tags ?? []).map((skill) => {
    const evidence = getProfileSkillEvidence(profile, skill);
    const jdRequirement = getJobRequirement(job, skill);
    const resumeEvidence =
      evidence.count > 0
        ? `项目/技能区出现 ${evidence.count} 次${evidence.sources?.length ? `，来源：${evidence.sources.join('、')}` : ''}`
        : '未在简历中出现';

    return {
      name: skill,
      jdRequirement,
      resumeLevel: evidence.level,
      resumeEvidence,
      score: scoreSkillDetail(jdRequirement, evidence.level, evidence.count),
      max: 10,
    };
  });
}

function getSoftSkillEvidence(profile, skill) {
  const aliases = SOFT_SKILL_EVIDENCE_RULES[skill] ?? [skill];
  const explicit = (profile.softSkills ?? []).includes(skill);
  const experiences = profile.experiences ?? [];
  const matchedExperiences = experiences.filter((experience) =>
    aliases.some((alias) => experience.includes(alias)),
  );
  const evidence = [];

  if (explicit) evidence.push('软技能区出现');
  matchedExperiences.slice(0, 2).forEach((experience) => {
    const label = /组织|负责|社团|活动|推动/.test(experience) ? '活动经历加分' : '经历证据';
    evidence.push(`${label}：${experience}`);
  });

  return {
    explicit,
    matchedExperiences,
    resumeEvidence: evidence.length > 0 ? evidence.join('；') : '简历暂未体现',
  };
}

export function buildSoftSkillMatchDetails(profile, job) {
  return (job.softSkills ?? []).map((skill) => {
    const evidence = getSoftSkillEvidence(profile, skill);
    const matched = evidence.explicit || evidence.matchedExperiences.length > 0;

    return {
      name: skill,
      jdRequirement: '软技能要求',
      matched,
      resumeEvidence: evidence.resumeEvidence,
      score: evidence.explicit && evidence.matchedExperiences.length > 0 ? 10 : matched ? 8 : 0,
      max: 10,
    };
  });
}

function getMatchInputs(profile, job) {
  const profileText = [
    ...(profile.skills ?? []),
    ...(profile.interests ?? []),
    ...(profile.experiences ?? []),
    ...(profile.cityPreferences ?? []),
  ];
  const matchedTags = (job.tags ?? []).filter((tag) => hasTextMatch(profileText, tag));
  const matchedNiceToHave = (job.niceToHave ?? []).filter((tag) => hasTextMatch(profileText, tag));
  const cityMatch = (profile.cityPreferences ?? []).includes(job.city) || job.city === '远程';

  return {
    matchedTags,
    matchedNiceToHave,
    cityMatch,
  };
}

function scaleScore(points, max, weight) {
  if (max <= 0) return weight;
  return Math.round((points / max) * weight);
}

function scoreSoftSkillDimension(profile, job) {
  const details = buildSoftSkillMatchDetails(profile, job);
  if (details.length === 0) {
    return {
      points: 15,
      matchedSkills: [],
      detail: 'JD 未列出软技能硬性要求',
    };
  }

  const rawScore = details.reduce((sum, item) => sum + item.score, 0);
  const maxScore = details.length * 10;
  const matchedSkills = details.filter((item) => item.matched).map((item) => item.name);

  return {
    points: scaleScore(rawScore, maxScore, 15),
    matchedSkills,
    detail:
      matchedSkills.length > 0
        ? `${matchedSkills.length}/${details.length} 项软技能有简历或活动证据`
        : '软技能证据不足，需要补充活动或协作经历',
  };
}

function satisfiesLanguageRequirement(profileLanguages = [], requirement) {
  if (profileLanguages.includes(requirement)) return true;
  if (requirement === '英语 CET-4' && profileLanguages.includes('英语 CET-6')) return true;
  if (
    requirement === '英文文档阅读' &&
    profileLanguages.some((language) => ['英语 CET-6', '英语 CET-4', '英文文档阅读'].includes(language))
  ) {
    return true;
  }
  if (requirement === '英语口语沟通' && profileLanguages.includes('英语 CET-6')) return true;
  return false;
}

function scoreLanguageDimension(profile, job) {
  const requirements = job.languageRequirements ?? [];
  if (requirements.length === 0) {
    return {
      points: 5,
      matchedLanguages: [],
      detail: 'JD 未列出语言硬性要求',
    };
  }

  const matchedLanguages = requirements.filter((requirement) =>
    satisfiesLanguageRequirement(profile.languages ?? [], requirement),
  );

  return {
    points: matchedLanguages.length === requirements.length ? 5 : matchedLanguages.length > 0 ? 3 : 0,
    matchedLanguages,
    detail:
      matchedLanguages.length > 0
        ? `满足 ${matchedLanguages.join('、')}`
        : `简历未体现 ${requirements.join('、')}`,
  };
}

export function getScoreBreakdown(profile, job) {
  const { matchedTags, matchedNiceToHave, cityMatch } = getMatchInputs(profile, job);
  const skillDetails = getSkillMatchDetails(profile, job);
  const tagCount = Math.max((job.tags ?? []).length, 1);
  const skillRawScore = skillDetails.reduce((sum, item) => sum + item.score, 0);
  const skillMaxScore = Math.max(skillDetails.length * 10, 1);
  const skillScore = scaleScore(skillRawScore, skillMaxScore, 50);
  const softSkillScore = scoreSoftSkillDimension(profile, job);
  const languageScore = scoreLanguageDimension(profile, job);
  const interestScore = Math.round((matchedNiceToHave.length / Math.max((job.niceToHave ?? []).length, 1)) * 10);
  const cityScore = cityMatch ? 10 : 0;
  const evidenceScore = matchedTags.length >= 3 ? 10 : matchedTags.length >= 2 ? 6 : 2;

  return [
    {
      label: '硬技能匹配',
      points: skillScore,
      max: 50,
      detail: `${matchedTags.length}/${tagCount} 个核心能力覆盖，分项证据 ${skillRawScore}/${skillMaxScore}`,
    },
    {
      label: '软技能匹配',
      points: softSkillScore.points,
      max: 15,
      detail: softSkillScore.detail,
    },
    {
      label: '语言要求',
      points: languageScore.points,
      max: 5,
      detail: languageScore.detail,
    },
    {
      label: '经历证据',
      points: evidenceScore,
      max: 10,
      detail: matchedTags.length >= 3 ? '简历有多条相关经历支撑' : '需要补充更直接的经历证据',
    },
    {
      label: '地点匹配',
      points: cityScore,
      max: 10,
      detail: cityMatch ? `${job.city} 符合求职偏好` : `${job.city} 不在当前偏好中`,
    },
    {
      label: '兴趣方向',
      points: interestScore,
      max: 10,
      detail: matchedNiceToHave.length > 0 ? `关联 ${matchedNiceToHave.join('、')}` : '行业/方向兴趣证据较弱',
    },
  ];
}

export function buildScoreExplanation(profile, job) {
  const breakdown = getScoreBreakdown(profile, job);
  const total = breakdown.reduce((sum, item) => sum + item.points, 0);
  const formula = `总分 ${total} = ${breakdown
    .map((item) => `${item.label} ${item.points}/${item.max}`)
    .join(' + ')}`;

  return {
    total,
    formula,
    breakdown,
    skillDetails: getSkillMatchDetails(profile, job),
    softSkillDetails: buildSoftSkillMatchDetails(profile, job),
  };
}

export function analyzeJobFit(profile, job) {
  const { matchedTags, matchedNiceToHave, cityMatch } = getMatchInputs(profile, job);
  const score = clampScore(getScoreBreakdown(profile, job).reduce((sum, item) => sum + item.points, 0));

  let level = '暂缓';
  if (score >= 80) level = '优先投递';
  else if (score >= 65) level = '可投递';

  return {
    job,
    score,
    level,
    matchedTags,
    matchedNiceToHave,
    gaps: (job.tags ?? []).filter((tag) => !matchedTags.includes(tag)),
    reasons: [
      `${matchedTags.length}/${(job.tags ?? []).length} 个核心关键词已被简历证据覆盖`,
      scoreSoftSkillDimension(profile, job).detail,
      scoreLanguageDimension(profile, job).detail,
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

export function buildStudentWorkflowSummary(profile, jobs = JOBS) {
  const rankedJobs = rankJobs(profile, jobs);
  const best = rankedJobs[0];
  const parsedHardSkillCount = jobs.reduce((sum, job) => sum + (job.hardSkillRequirements?.length ?? 0), 0);
  const parsedSoftSkillCount = jobs.reduce((sum, job) => sum + (job.softSkills?.length ?? 0), 0);

  return {
    bestFit: best ? `${best.job.title} ${best.score}分` : '暂无岗位',
    steps: [
      {
        label: '简历解析',
        value: `${profile.skills.length} 技能 · ${profile.experiences.length} 经历 · ${(profile.softSkills ?? []).length} 软技能`,
      },
      {
        label: 'JD 解析',
        value: `${jobs.length} 个岗位 · ${parsedHardSkillCount} 硬技能要求 · ${parsedSoftSkillCount} 软技能要求`,
      },
      {
        label: '匹配解释',
        value: '硬技能分项 · 软技能证据 · 活动经历加分',
      },
    ],
  };
}

export function analyzeJobDescription({ title, city, description, company = COMPANY.name }) {
  const sourceText = `${title}\n${city}\n${description}`;
  const parsed = parseJobDescription(sourceText);
  const tags = parsed.hardSkillRequirements.map((item) => item.name);
  const responsibilities = unique(
    RESPONSIBILITY_RULES
      .filter(([keyword]) => sourceText.includes(keyword))
      .map(([, responsibility]) => responsibility),
  );
  const niceToHave = unique([...extractKnownTerms(sourceText, INTEREST_DICTIONARY), '互联网']);

  return enrichJob({
    id: `admin-${Math.abs(hashText(sourceText))}`,
    title: title.trim() || '新增实习岗位',
    company,
    city: city.trim() || '上海',
    tags: (tags.length > 0 ? tags : ['SQL', '用户调研', '数据看板']).slice(0, 6),
    responsibilities: (responsibilities.length > 0 ? responsibilities : ['岗位任务执行', '跨团队协作']).slice(0, 4),
    niceToHave: niceToHave.slice(0, 4),
    description,
    salary: parsed.salary,
    hardSkillRequirements: parsed.hardSkillRequirements,
    softSkills: parsed.softSkills,
    languageRequirements: parsed.languageRequirements,
    source: 'admin',
  });
}

export function buildAdminCandidateInsight(candidate, jobs = JOBS) {
  const rankedJobs = rankJobs(candidate.profile, jobs);
  const submittedJobs = candidate.submittedJobIds
    .map((jobId) => {
      const analysis = rankedJobs.find((item) => item.job.id === jobId);
      if (!analysis) return null;
      return {
        id: analysis.job.id,
        title: analysis.job.title,
        city: analysis.job.city,
        score: analysis.score,
        matchedTags: analysis.matchedTags,
        gaps: analysis.gaps,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  const submittedIds = new Set(candidate.submittedJobIds);
  const suggestedJobs = rankedJobs
    .filter((analysis) => !submittedIds.has(analysis.job.id) && analysis.score >= 60)
    .slice(0, 2)
    .map((analysis) => ({
      id: analysis.job.id,
      title: analysis.job.title,
      city: analysis.job.city,
      score: analysis.score,
      matchedTags: analysis.matchedTags,
    }));
  const bestSubmitted = submittedJobs[0];
  const bestSuggested = suggestedJobs[0];

  let screeningRecommendation = '建议人工复核：当前投递岗位证据不完整。';
  if (bestSubmitted?.score >= 75) {
    screeningRecommendation = `建议进入初筛：${candidate.name} 与 ${bestSubmitted.title} 匹配度 ${bestSubmitted.score} 分。`;
  } else if (bestSubmitted?.score < 60) {
    screeningRecommendation = `暂不建议进入初筛：当前投递岗位最高匹配度 ${bestSubmitted.score} 分。`;
  }

  const routingRecommendation =
    bestSuggested && (!bestSubmitted || bestSuggested.score > bestSubmitted.score + 5)
      ? `建议转推荐至 ${bestSuggested.title}：匹配度 ${bestSuggested.score} 分，高于当前投递岗位。`
      : '当前投递方向基本匹配，可按原岗位推进筛选。';

  return {
    candidate,
    submittedJobs,
    suggestedJobs,
    screeningRecommendation,
    routingRecommendation,
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

export function buildTailoredResumeSnippet(profile, job) {
  const dataExperience = profile.experiences.find((item) => item.includes('Python') || item.includes('SQL')) ?? profile.experiences[0];
  const researchExperience = profile.experiences.find((item) => item.includes('问卷')) ?? profile.experiences[1] ?? dataExperience;
  const activityExperience = profile.experiences.find((item) => item.includes('活动')) ?? profile.experiences[2] ?? dataExperience;
  const titleText = `${job.title} ${job.tags.join(' ')} ${job.responsibilities.join(' ')}`;

  if (titleText.includes('运营') || titleText.includes('增长') || titleText.includes('用户分层')) {
    return [
      '校园 App 新用户体验研究与活动复盘',
      `${researchExperience}；结合 ${activityExperience}，围绕用户分层、问卷洞察和活动复盘沉淀可执行优化建议，支撑增长运营岗位所需的用户理解与转化分析能力。`,
    ].join('：');
  }

  if (titleText.includes('商业分析') || titleText.includes('市场研究')) {
    return [
      '商业数据分析与用户研究项目',
      `${dataExperience}；结合问卷与访谈反馈，将业务问题拆解为数据指标、用户行为和市场机会三类，形成可复用的数据看板和分析结论。`,
    ].join('：');
  }

  return [
    '用户行为数据分析项目',
    `${dataExperience}；使用 SQL 与 Tableau 制作指标看板，围绕注册、激活、留存链路定位转化漏斗中的关键流失节点，并输出面向业务团队的优化建议。`,
  ].join('：');
}
