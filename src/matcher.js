export const COMPANY = {
  name: '大卫德科技',
  subtitle: '2026 校园招聘与实习岗位池',
};

export const SAMPLE_RESUME_TEXT = `大卫德
求职意向：数据分析 / 产品运营 / 商业分析实习
联系方式：已隐藏
个人信息：男 · 英语 CET-6 · 每周可实习 4 天
城市偏好：上海 / 杭州 / 远程

教育背景
慕尼黑工业大学 统计学 本科 2026届
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
  'Power BI',
  'Looker',
  'Metabase',
  'Google Analytics',
  'Amplitude',
  'Mixpanel',
  'Superset',
  'Redash',
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
  'GitHub',
  '推荐算法',
  '数学建模',
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Vue',
  'Tailwind CSS',
  'Node.js',
  '大语言模型',
  'RAG',
  'LangChain',
  'OpenAI API',
  'Prompt Engineering',
  'Vercel',
  'PostHog',
  'Sentry',
  'Supabase',
  'Stripe',
  'Neon',
  'Canva',
  'Figma',
  'Linear',
  'Notion',
  'Jira',
  'Slack',
  'Microsoft Teams',
  'SharePoint',
  'ClickUp',
  'Monday.com',
  'Confluence',
  'Asana',
  'Trello',
  'Illustrator',
  'InDesign',
  'Lightroom',
  'Final Cut Pro',
  'Miro',
  'Airtable',
  'Apollo.io',
  'Zapier',
  'Make',
  'n8n',
  'HubSpot',
  'Salesforce',
  'Dify',
  'Coze',
  'PR',
  'PS',
  'AE',
  '达芬奇',
  '剪映',
  'Office',
  '文档写作',
  '影视制作',
  '短视频',
  '剪映',
  '摄影',
  '后期',
  '脚本撰写',
  '平面设计',
  '行政管理',
  '人事',
  '招聘',
  '培训',
  '考勤',
  '教案撰写',
  '电气工程',
  '自动化',
  'PLC',
  '设备巡检',
  '低压配电',
  '变压器',
  '电机',
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
  '沟通协调',
  '组织协调',
  '服务意识',
  '抗压能力',
  '团队协作',
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
  沟通协调: ['沟通协调', '沟通', '协调', '交流沟通'],
  组织协调: ['组织协调', '组织半日活动', '活动组织', '组织策划'],
  服务意识: ['服务意识', '行政后勤', '办公室日常管理'],
  抗压能力: ['抗压能力', '承受较大的工作压力', '抗压'],
  团队协作: ['团队协作', '同学协作', '团队精神', '合作策划'],
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

const COMPOSITE_CAPABILITY_RULES = [
  {
    name: '数据驱动增长',
    jdSignals: ['增长', '转化', '漏斗', 'A/B测试', '用户分层'],
    profileSignals: ['转化漏斗', 'A/B测试', '用户分层', '活动复盘'],
    description: '把数据分析、用户增长和实验复盘组合成可执行增长判断',
  },
  {
    name: '洞察到行动',
    jdSignals: ['洞察', '建议', '复盘', '策略', '输出'],
    profileSignals: ['输出', '形成产品优化建议', '提升转化率', '活动复盘'],
    description: '不只做分析，还能把结论转成业务动作或优化建议',
  },
  {
    name: '跨团队推进',
    jdSignals: ['产品', '运营', '团队', '跨部门', '协助'],
    profileSignals: ['跨部门沟通', '协助运营团队', '项目推进', '组织'],
    description: '能在产品、运营、数据之间推进问题闭环',
  },
  {
    name: '研究到策略',
    jdSignals: ['研究', '调研', '问卷', '市场', '竞品'],
    profileSignals: ['问卷调研', '用户访谈', '市场研究', '竞品'],
    description: '能把用户或市场研究转化为策略输入',
  },
  {
    name: '实验建模闭环',
    jdSignals: ['模型', '实验', '评估', '推荐', 'PyTorch'],
    profileSignals: ['机器学习', '深度学习', 'PyTorch', '推荐算法', '数学建模'],
    description: '能完成样本处理、模型训练和效果评估',
  },
];

const TEAM_CAPABILITY_GAPS = ['用户研究', '商业分析', '数据看板', '跨部门沟通', '模型评估'];

const KEYWORD_ALIASES = {
  问卷调研: ['问卷', '用户调研', '问卷反馈'],
  SQL: ['MySQL', 'mysql', 'PostgreSQL', 'postgresql', 'Postgres', 'postgres', 'SQLite', 'sqlite'],
  Python: ['Pandas', 'pandas', 'NumPy', 'numpy'],
  数据看板: ['Tableau 看板', '周报看板', '看板'],
  'Power BI': ['PowerBI', 'power bi', 'powerbi'],
  Looker: ['looker', 'Looker Studio', 'looker studio', 'Google Looker Studio', 'google looker studio'],
  Metabase: ['metabase'],
  'Google Analytics': ['google analytics', 'Google Analytics 4', 'google analytics 4', 'GA4', 'ga4'],
  Amplitude: ['amplitude', 'Am plitude', 'am plitude'],
  Mixpanel: ['mixpanel', 'Mix Panel', 'mix panel'],
  Superset: ['superset', 'Super set', 'super set', 'Apache Superset', 'apache superset'],
  Redash: ['redash', 'Re dash', 're dash'],
  Excel: [
    'excel',
    'ms excel',
    'MS Excel',
    'micro soft excel',
    'Micro Soft Excel',
    'Power Query',
    'power query',
    'Power Pivot',
    'power pivot',
    'VLOOKUP',
    'vlookup',
    'XLOOKUP',
    'xlookup',
    '数据透视表',
  ],
  市场研究: ['用户调研', '问卷反馈'],
  活动复盘: ['活动数据复盘', '复盘新人优惠券活动'],
  用户分层: ['用户分群', '人群分层'],
  转化漏斗: ['注册-激活-留存转化漏斗', '漏斗分析', '转化链路'],
  'A/B测试': ['AB测试', 'A/B test', '实验分析', 'A B测试', 'A/B 测试'],
  JavaScript: ['JS', 'Javascript', 'javascript', 'ECMAScript', 'Java Script', 'java script'],
  TypeScript: ['TS', 'Typescript', 'typescript', 'Type Script', 'type script'],
  React: ['React.js', 'ReactJS', 'react'],
  'Next.js': ['Next', 'NextJS', 'next.js', 'nextjs', 'Next js', 'next js'],
  Vue: ['Vue.js', 'Vue3', 'vue', 'vue3'],
  'Tailwind CSS': ['Tailwind', 'TailwindCSS', 'tailwind', 'tailwindcss'],
  'Node.js': ['Node', 'NodeJS', 'node.js', 'node', 'Node js', 'node js'],
  大语言模型: ['LLM', '大模型', '生成式 AI', '生成式AI'],
  RAG: ['检索增强生成', '知识库问答', '向量检索', 'Retrieval Augmented Generation', 'retrieval augmented generation'],
  LangChain: ['langchain', 'Lang Chain', 'lang chain'],
  'OpenAI API': ['OpenAI', 'openai api', 'OpenAI SDK', 'Open AI API', 'open ai api', 'OpenAIAPI'],
  'Prompt Engineering': ['Prompt', '提示词工程', 'Prompting', 'PromptOps', 'promptops'],
  Vercel: ['vercel'],
  PostHog: ['posthog', 'Post Hog', 'post hog', 'PostHog Analytics', 'posthog analytics'],
  Sentry: ['sentry', 'Sen try', 'sen try'],
  Supabase: ['supabase', 'Supa base', 'supa base'],
  Stripe: ['stripe', 'Stri pe', 'stri pe'],
  Neon: ['neon', 'Neon Postgres', 'neon postgres'],
  Canva: ['canva', 'Can va', 'can va'],
  Figma: ['figma', 'Fi gma', 'fi gma'],
  Linear: ['linear', 'Li near', 'li near'],
  Notion: ['notion', 'No tion', 'no tion'],
  Jira: ['JIRA', 'jira', 'Jira Software', 'jira software', 'Ji ra', 'ji ra'],
  Slack: ['slack', 'S lack', 's lack', 'Sla ck', 'sla ck', 'Lark', 'lark', '飞书'],
  'Microsoft Teams': ['microsoft teams', 'Microsoft Teams', 'MS Teams', 'ms teams', 'Teams', 'teams', 'Mi cro soft Teams'],
  SharePoint: ['sharepoint', 'Share Point', 'share point', 'Microsoft SharePoint', 'microsoft sharepoint'],
  ClickUp: ['clickup', 'Click Up', 'click up', 'Click-up', 'click-up'],
  'Monday.com': ['monday.com', 'Monday.com', 'monday', 'Monday', 'monday com', 'Monday com'],
  Confluence: ['confluence', 'Con fluence', 'con fluence'],
  Asana: ['asana', 'Asa na', 'asa na'],
  Trello: ['trello', 'Trel lo', 'trel lo'],
  Miro: ['miro', 'Mi ro', 'mi ro'],
  Airtable: ['airtable', 'Air table', 'air table'],
  'Apollo.io': ['apollo', 'Apollo', 'apollo.io', 'Apollo.io', 'Apollo IO', 'apollo io', 'Apo llo', 'apo llo', 'Apo llo.io', 'apo llo.io'],
  Zapier: ['zapier', 'Za pier', 'za pier'],
  Make: ['make', 'Integromat', 'integromat'],
  n8n: ['n8n', 'N8N', 'N 8 N', 'n 8 n'],
  HubSpot: ['hubspot', 'Hub Spot', 'hub spot', 'Hu bSpot', 'hu bspot'],
  Salesforce: ['salesforce', 'Sales Force', 'sales force', 'SFDC', 'sfdc'],
  Dify: ['dify', 'Di fy', 'di fy'],
  Coze: ['coze', 'Co ze', 'co ze', '扣子'],
  PR: ['PR', 'Premiere', 'premiere', 'Premiere Pro', 'premiere pro', 'Pre miere', 'pre miere', 'PremierePro', 'pr'],
  PS: ['PS', 'Photoshop', 'photoshop', 'Photo shop', 'photo shop', 'Adobe Photoshop', 'adobe photoshop'],
  AE: ['AE', 'After Effects', 'AfterEffects', 'after effects', 'aftereffects'],
  Illustrator: ['Illustrator', 'illustrator', 'Adobe Illustrator', 'adobe illustrator', 'Illu strator', 'illu strator'],
  InDesign: ['InDesign', 'indesign', 'Adobe InDesign', 'adobe indesign', 'In Design', 'in design'],
  Lightroom: ['Lightroom', 'lightroom', 'Adobe Lightroom', 'adobe lightroom', 'Light room', 'light room'],
  'Final Cut Pro': ['Final Cut', 'final cut', 'Final Cut Pro', 'final cut pro', 'FCP', 'fcp'],
  GitHub: ['Github', 'github', 'Git Hub', 'git hub'],
  Office: [
    'Office',
    'OFFICE',
    'M365',
    'm365',
    'MS365',
    'ms365',
    'Microsoft 365',
    'microsoft 365',
    'Microsoft Office',
    'microsoft office',
    'MS Office',
    'ms office',
    'Micro Soft Office',
    'micro soft office',
    'Office365',
    'office365',
    '办公软件',
    'Word',
    'word',
    'W ord',
    'w ord',
    'Microsoft Word',
    'PowerPoint',
    'powerpoint',
    'Power Point',
    'power point',
    'PPT',
    'ppt',
    'Outlook',
    'outlook',
    'Microsoft Outlook',
    'microsoft outlook',
    'Out look',
    'out look',
    'Outlook Calendar',
    'outlook calendar',
    'Exchange',
    'exchange',
    'Microsoft Exchange',
    'microsoft exchange',
    '邮箱管理',
    '邮件排期',
    '邮件日程协调',
    '日历排期',
    '会议排期',
    'Google Workspace',
    'google workspace',
    'Google Work space',
    'google work space',
    'Google Docs',
    'google docs',
    'Google Doc s',
    'google doc s',
    'Google Sheets',
    'google sheets',
    'Google Sheet s',
    'google sheet s',
    'Google Slides',
    'google slides',
    'Google Slide s',
    'google slide s',
    'G Suite',
    'g suite',
    '谷歌文档',
    '谷歌表格',
    '谷歌幻灯片',
    '飞书文档',
    '飞书表格',
    'Lark Docs',
    'lark docs',
    'Lark Sheets',
    'lark sheets',
    '腾讯文档',
    '腾讯表格',
    '石墨文档',
    '石墨表格',
    '金山文档',
    'WPS',
    'wps',
    'W P S',
    'w p s',
  ],
  文档写作: ['文档写作', '文件编写', '稿件编写'],
  影视制作: ['影视制作', '视频制作', '短片', '微电影'],
  短视频: ['短视频', '抖音账号', '视频内容'],
  剪映: ['CapCut', 'capcut', 'Cap Cut', 'cap cut'],
  摄影: ['摄影', '拍摄', '跟拍'],
  后期: ['后期', '剪辑', '调色', '修图'],
  脚本撰写: ['脚本撰写', '脚本'],
  平面设计: ['平面设计', '海报', 'logo'],
  行政管理: ['行政管理', '行政人员', '行政后勤', '综合管理'],
  人事: ['人事', '人力资源', '薪资', '福利管理'],
  招聘: [
    '招聘',
    '招聘配置',
    'Greenhouse',
    'greenhouse',
    'Green house',
    'green house',
    'Lever',
    'lever',
    'Le ver',
    'le ver',
    'Moka',
    'moka',
  ],
  培训: ['培训'],
  考勤: ['考勤'],
  远程: ['线上', '可远程', '远程办公', '全国远程', 'Remote', 'remote', '居家办公', '在家办公', 'WFH', 'wfh', 'work from home', 'home office'],
  教案撰写: ['教案', '撰写教案'],
  电气工程: ['电气工程', '电气工程及其自动化'],
  自动化: ['自动化'],
  机器学习: ['Machine Learning', 'machine learning', 'ML', 'ml', 'Scikit-learn', 'scikit-learn', 'sklearn'],
  深度学习: ['Deep Learning', 'deep learning', 'DL', 'dl', 'TensorFlow', 'tensorflow', 'Tensor Flow', 'tensor flow'],
  PyTorch: ['Py Torch', 'py torch', 'pytorch'],
  PLC: ['PLC', 'plc'],
  设备巡检: ['设备巡检', '日常巡检', '巡检与维护'],
  低压配电: ['低压配电', '配电箱'],
  变压器: ['变压器'],
  电机: ['电机'],
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

function extractCompositeCapabilities(text, signalKey = 'jdSignals') {
  return COMPOSITE_CAPABILITY_RULES.filter((rule) =>
    rule[signalKey].some((signal) => text.includes(signal)),
  ).map((rule) => ({
    name: rule.name,
    description: rule.description,
    signals: rule[signalKey].filter((signal) => text.includes(signal)),
  }));
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
  const standaloneGender = text.match(/(?:^|\n)\s*(男|女)\s*[·\s]/);
  if (standaloneGender) return standaloneGender[1];
  return '未填写';
}

const GENERIC_RESUME_TITLES = new Set(['个人简历', '求职简历', '简历', '我的简历', 'Resume', 'CV']);

const RESUME_FIELD_BOUNDARIES = [
  '个人简历',
  '基本资料',
  '教育背景',
  '教育经历',
  '毕业院校｜Education',
  '毕业院校',
  '实习经历',
  '工作经历',
  '校园经历',
  '项目经历',
  '掌握技能',
  '技能证书｜Skills',
  '技能证书',
  '自我评价｜About me',
  '自我评价',
  '求职意向',
  '姓名',
  '姓 名',
  '姓后',
  '性别',
  '院校',
  '院 校',
  '学校',
  '专业',
  '专 业',
  '学历',
  '学 历',
  '电话',
  '邮箱',
  '工作职责',
  '实习成果',
  '影视制作',
  '摄影与后期',
  '设计软件',
  '团队与执行',
];

function normalizeResumeLabels(text) {
  return String(text ?? '')
    .replace(/姓\s*后/g, '姓名')
    .replace(/姓\s*名/g, '姓名')
    .replace(/院\s*校/g, '院校')
    .replace(/专\s*业/g, '专业')
    .replace(/学\s*历/g, '学历')
    .replace(/特话/g, '电话')
    .replace(/迎箱/g, '邮箱')
    .replace(/籍设/g, '籍贯')
    .replace(/与业/g, '专业')
    .replace(/助漫媒体/g, '动漫媒体')
    .replace(/秀图/g, '修图')
    .replace(/搞笑落实/g, '高效落实');
}

function addResumeBoundaries(text) {
  const boundaryPattern = new RegExp(`(?<!^)(?<!\\n)(${RESUME_FIELD_BOUNDARIES.map(escapeRegExp).join('|')})\\s*([：:])?`, 'g');
  return text.replace(boundaryPattern, (match, label, punctuation = '') => {
    if (match.startsWith('\n')) return match;
    return `\n${label}${punctuation}`;
  });
}

function normalizeResumeSourceText(text) {
  return addResumeBoundaries(normalizeResumeLabels(text))
    .replace(/\u0000/g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function cleanCandidateName(value) {
  return String(value ?? '')
    .replace(/^(姓名|Name)\s*[：:\s]*/i, '')
    .replace(/[，,；;|].*$/, '')
    .replace(/\s+/g, '')
    .trim();
}

function isGenericResumeTitle(line) {
  return GENERIC_RESUME_TITLES.has(line.trim());
}

function isPlausibleCandidateName(value) {
  const clean = cleanCandidateName(value);
  if (!clean || isGenericResumeTitle(clean)) return false;
  if (/求职|意向|电话|邮箱|学校|教育|经历|技能|项目|个人信息|专业|赛事|课程|招聘|选拔|职责|范围|管理/.test(clean)) return false;
  return /^[\u4e00-\u9fa5A-Za-z·]{2,24}$/.test(clean);
}

function stripAfterResumeLabels(value) {
  const stopPattern = /(籍贯|出生年月|学历|性别|政治面貌|院校|学校|专业|电话|联系方式|邮箱|求职意向|现居|微信|生日)[：:]|[\u4e00-\u9fa5]{2,}(?:有限公司|融媒体|幼儿园)\s*[|｜]/;
  return String(value ?? '').split(stopPattern)[0].trim();
}

function extractFieldValue(text, labels) {
  return stripAfterResumeLabels(extractRawFieldValue(text, labels));
}

function extractRawFieldValue(text, labels) {
  const labelPattern = labels.map(escapeRegExp).join('|');
  const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:${labelPattern})\\s*[：:]\\s*([^\\n]+)`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function cleanMajorValue(value) {
  const clean = String(value ?? '').trim();
  const knownMajor = clean.match(/^[\u4e00-\u9fa5A-Za-z0-9（）()]{2,32}?(?:制作技术|媒体制作技术|学前教育|统计学|汉语言文学|计算机科学|工商管理|技术|教育|管理|文学|科学)/);
  if (knownMajor) return knownMajor[0];
  return stripAfterResumeLabels(clean).slice(0, 24);
}

const DEGREE_RANK = {
  博士: 4,
  硕士: 3,
  研究生: 3,
  本科: 2,
  学士: 2,
  专科: 1,
  大专: 1,
};

function normalizeDegreeValue(value) {
  const degree = String(value ?? '').match(/博士|硕士|研究生|本科|学士|专科|大专/)?.[0] ?? '';
  return degree === '大专' ? '专科' : degree;
}

function cleanSchoolValue(value) {
  const clean = stripAfterResumeLabels(value);
  const school = clean.match(/^[\u4e00-\u9fa5A-Za-z（）()·]{2,40}?(?:大学|学院|学校)/);
  return school?.[0] ?? clean.slice(0, 24);
}

function pushEducationRecord(records, { school = '', major = '', degree = '', year = 0 }) {
  const cleanSchool = cleanSchoolValue(school);
  const cleanMajor = cleanMajorValue(major);
  const cleanDegree = normalizeDegreeValue(degree);
  if (!cleanSchool && !cleanMajor && !cleanDegree) return;
  records.push({
    school: cleanSchool,
    major: cleanMajor,
    degree: cleanDegree,
    year: Number(year) || 0,
    rank: DEGREE_RANK[cleanDegree] ?? 0,
  });
}

function extractEducationRecords(text) {
  const records = [];
  pushEducationRecord(records, {
    school: extractRawFieldValue(text, ['学校', '院校', '毕业院校']),
    major: extractRawFieldValue(text, ['专业']),
    degree: extractRawFieldValue(text, ['学历']),
  });

  const datedPattern =
    /(20\d{2})[.\/]\d{1,2}\s*[-—－~]\s*(?:20\d{2}[.\/]\d{1,2}|至今)\s*([^\d\n]{2,45}?(?:大学|学院|学校))\s*([\u4e00-\u9fa5A-Za-z0-9（）()]{2,28}?)?（?\s*(博士|硕士|研究生|本科|学士|专科|大专)\s*）?/g;
  for (const match of text.matchAll(datedPattern)) {
    pushEducationRecord(records, {
      year: match[1],
      school: match[2],
      major: match[3],
      degree: match[4],
    });
  }

  const directPattern =
    /([\u4e00-\u9fa5A-Za-z（）()·]{2,40}?(?:大学|学院|学校))\s+([\u4e00-\u9fa5A-Za-z0-9（）()]{2,24})\s+(博士|硕士|研究生|本科|学士|专科|大专)/g;
  for (const match of text.matchAll(directPattern)) {
    pushEducationRecord(records, {
      school: match[1],
      major: match[2],
      degree: match[3],
    });
  }

  return unique(records.map((record) => JSON.stringify(record))).map((record) => JSON.parse(record));
}

function selectBestEducationRecord(records) {
  return [...records].sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank;
    if (b.year !== a.year) return b.year - a.year;
    return Number(Boolean(b.school)) - Number(Boolean(a.school));
  })[0];
}

function extractResumeName(lines, text) {
  const explicit = text.match(/(?:^|\n)\s*(?:姓名|Name)\s*[：:\s]*([^\n，,；;|]+)/i);
  const explicitName = cleanCandidateName(stripAfterResumeLabels(explicit?.[1] ?? ''));
  if (isPlausibleCandidateName(explicitName)) return explicitName;

  const beforeTarget = text.match(/([\u4e00-\u9fa5A-Za-z·]{2,12})\s*求职(?:意向|目标|偏好)\s*[：:]/);
  if (isPlausibleCandidateName(beforeTarget?.[1] ?? '')) return cleanCandidateName(beforeTarget[1]);

  const firstNameLine = lines.find((line) => isPlausibleCandidateName(line));
  return firstNameLine ? cleanCandidateName(firstNameLine) : '求职者';
}

function inferDegree(text) {
  const explicit = extractFieldValue(text, ['学历']);
  if (explicit) return explicit;
  if (/本科/.test(text)) return '本科';
  if (/专科/.test(text)) return '专科';
  if (/硕士/.test(text)) return '硕士';
  if (/博士/.test(text)) return '博士';
  return '';
}

function extractEducationHeadline(lines, text) {
  const bestRecord = selectBestEducationRecord(extractEducationRecords(text));
  if (bestRecord) return unique([bestRecord.school, bestRecord.major, bestRecord.degree]).join(' ');

  const direct = lines.find((line) => /(本科|硕士|博士|大学|学院).*(届|专业|本科|硕士|博士)|学校[：:]/.test(line));
  if (!direct) return '学生';
  return direct
    .replace(/^学校[：:\s]*/, '')
    .replace(/^教育背景[：:\s]*/, '')
    .trim();
}

function extractTarget(text) {
  const match = text.match(/(?:^|\n|[^\u4e00-\u9fa5])求职(?:意向|目标|偏好)\s*[：:]\s*([^\n]+)/);
  const target = stripAfterResumeLabels(match?.[1] ?? '');
  return target || '求职意向待补充';
}

function normalizeExperienceLine(line) {
  return line
    .replace(/^(工作职责|实习成果)\s*[：:；;]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const EXPERIENCE_MARKERS = [
  '短视频内容编导助理',
  '数据分析实习生',
  '产品运营实习生',
  '商业分析实习生',
  '算法工程实习生',
  '行政人员',
  '人事实习生',
  '幼儿教师',
  '实习记者',
  '主导',
  '独立负责',
  '负责',
  '协助',
  '组织',
  '撰写',
  '拍摄',
  '剪辑',
  '管理制度',
  '招聘',
  '培训',
  '考勤',
];

function splitExperienceFragments(line) {
  return line
    .replace(/(20\d{2}[.\/]\d{1,2}\s*[-—－~]\s*(?:20\d{2}[.\/]\d{1,2}|至今))/g, '\n$1')
    .replace(
      /([\u4e00-\u9fa5A-Za-z（）()·]{2,45}(?:有限公司|集团|幼儿园|融媒体|传媒)[^\n。；;]{0,28}(?:实习记者|短视频内容编导助理|行政人员|人事实习生|幼儿教师))/g,
      '\n$1',
    )
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function findFirstExperienceMarker(text) {
  return EXPERIENCE_MARKERS.reduce((best, marker) => {
    const index = text.indexOf(marker);
    if (index === -1) return best;
    return best === -1 ? index : Math.min(best, index);
  }, -1);
}

function truncateExperienceEvidence(text, maxLength = 112) {
  const clean = text
    .replace(/(?:主修课程|技能证书|自我评价|自荐信|尊敬的领导|我有信心|掌握技能|个人简历)[\s\S]*$/, '')
    .replace(/\s*[|｜]\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= maxLength) return clean;

  const preview = clean.slice(0, maxLength);
  const boundary = Math.max(
    preview.lastIndexOf('。'),
    preview.lastIndexOf('；'),
    preview.lastIndexOf(';'),
    preview.lastIndexOf('，'),
    preview.lastIndexOf(','),
  );
  const clipped = boundary > 32 ? preview.slice(0, boundary) : preview;
  return `${clipped.trim()}...`;
}

function compactExperienceEvidence(line) {
  const normalized = normalizeExperienceLine(line)
    .replace(/^(专业|学校|院校|毕业院校)\s*[：:]\s*/, '')
    .trim();
  const markerIndex = findFirstExperienceMarker(normalized);
  const companyMatch = normalized.match(/[\u4e00-\u9fa5A-Za-z（）()·]{2,50}(?:有限公司|集团|幼儿园|融媒体|传媒)/);
  const companyIndex = companyMatch?.index ?? -1;
  let startIndex = markerIndex >= 0 ? markerIndex : 0;
  if (companyIndex >= 0 && (markerIndex < 0 || markerIndex - companyIndex <= 90)) {
    startIndex = companyIndex;
  }
  let compact = normalized
    .slice(startIndex)
    .replace(/^(?:20\d{2}[.\/]\d{1,2}\s*[-—－~]\s*)?(?:20\d{2}[.\/]\d{1,2}|至今)?/, '')
    .trim();
  const localMediaSuffix = compact.match(/[县市区]融媒体/);
  if (localMediaSuffix && localMediaSuffix.index > 2) compact = compact.slice(localMediaSuffix.index - 2);
  return truncateExperienceEvidence(compact);
}

function removeRedundantExperiences(items) {
  const rolePattern = /(实习|行政人员|教师|记者|编导|工程师|分析师|运营|项目|主导|负责)/;
  return items.filter((item, index, list) => {
    const isContained = list.some((other, otherIndex) =>
      otherIndex !== index && other.length > item.length && other.includes(item),
    );
    if (isContained) return false;
    if (!rolePattern.test(item)) {
      return !list.some((other, otherIndex) =>
        otherIndex !== index && rolePattern.test(other) && other.includes(item.slice(0, 18)),
      );
    }
    return true;
  });
}

function extractExperienceEvidence(text) {
  const bulletExperiences = extractBulletExperiences(text).map(compactExperienceEvidence);
  const fragments = text
    .split('\n')
    .flatMap((line) => splitExperienceFragments(normalizeExperienceLine(line)))
    .filter(Boolean);
  const evidenceLines = fragments.filter((line) => {
    if (line.length < 12) return false;
    if (/^(电话|邮箱|微信|生日|政治面貌|主修课程|个人简历)/.test(line)) return false;
    if (/^(组织[、,，]|沟通协调|服务意识|性格|具有|能够|有人事|熟悉|了解各项)/.test(line)) return false;
    if (/(自荐信|尊敬的领导|我有信心|机会留给|诚挚的谢意|求职请求)/.test(line)) return false;
    if (/(主修|核心课程|组织行为学|劳动法|招聘与选拔)/.test(line) && !/(实习|工作职责|负责|协助|独立完成)/.test(line)) return false;
    return /(实习|工作职责|行政人员|教师|记者|编导|负责|协助|主导|组织|撰写|拍摄|剪辑|管理制度|招聘|培训|考勤)/.test(line);
  }).map(compactExperienceEvidence).filter((line) =>
    line.length >= 8 &&
    !/(自荐信|我有信心|尊敬的领导)/.test(line) &&
    !/^(组织[、,，]|沟通协调|服务意识|性格|具有|能够|有人事|熟悉|了解各项)/.test(line),
  );
  return removeRedundantExperiences(unique([...bulletExperiences, ...evidenceLines])).slice(0, 8);
}

export function parseResumeText(text) {
  const normalizedText = normalizeResumeSourceText(text);
  const lines = normalizedText.split('\n').map((line) => line.trim()).filter(Boolean);
  const name = extractResumeName(lines, normalizedText);
  const educationLine = extractEducationHeadline(lines, normalizedText);
  const target = extractTarget(normalizedText);
  const skills = extractKnownTerms(normalizedText, SKILL_DICTIONARY);
  const skillEvidence = buildSkillEvidence(normalizedText, skills);
  const interests = unique([...extractKnownTerms(normalizedText, INTEREST_DICTIONARY), ...target.split(/[ /、]+/).filter(Boolean)]);
  const cityPreferences = extractKnownTerms(normalizedText, CITY_DICTIONARY);
  const languages = extractAliasTerms(normalizedText, LANGUAGE_RULES);
  const softSkills = extractKnownTerms(normalizedText, SOFT_SKILL_DICTIONARY);
  const experiences = extractExperienceEvidence(normalizedText);

  return {
    name,
    gender: extractGender(normalizedText),
    headline: educationLine.replace('教育背景', '').trim(),
    target,
    cityPreferences,
    skills,
    languages,
    softSkills,
    skillEvidence,
    interests,
    experiences,
    rawResume: normalizedText,
  };
}

export const STUDENT_PROFILE = parseResumeText(SAMPLE_RESUME_TEXT);

function splitTargetTags(target) {
  if (!target || target === '求职意向待补充') return [];
  return unique(
    String(target ?? '')
      .split(/[、/,，|]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  ).slice(0, 4);
}

function parseHeadlineParts(headline) {
  const tokens = String(headline ?? '')
    .replace(/20\d{2}届/g, '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const school = tokens.find((item) => /大学|学院|学校/.test(item)) ?? '';
  const major = tokens.find((item) => item !== school && !/本科|专科|硕士|博士|学生/.test(item)) ?? '';
  return { school, major };
}

function selectResumeSummaryExperiences(experiences = []) {
  const experiencePattern = /(实习|行政人员|教师|记者|编导|工程师|分析师|运营|主导|独立负责|使用|设计并|组织 \d|组织\d)/;
  const excludedPattern = /(证书|自荐信|我有信心|尊敬的领导|求职请求|SYB)/i;
  const preferred = experiences.filter((item) => experiencePattern.test(item) && !excludedPattern.test(item));
  return (preferred.length ? preferred : experiences.filter((item) => !excludedPattern.test(item)))
    .slice(0, 2)
    .map((item) => truncateExperienceEvidence(item, 96));
}

export function buildResumeSummary(profile, submittedJobTitles = []) {
  const { school, major } = parseHeadlineParts(profile.headline);
  const metaItems = unique([
    profile.gender && profile.gender !== '未填写' ? profile.gender : '',
    school,
    major,
  ]);
  const targetTags = splitTargetTags(profile.target);
  const tagGroups = [
    { label: '求职意向', tags: targetTags },
    { label: '核心技能', tags: (profile.skills ?? []).slice(0, 10) },
    { label: '语言能力', tags: (profile.languages ?? []).slice(0, 4) },
    { label: '软技能', tags: (profile.softSkills ?? []).slice(0, 6) },
  ].filter((group) => group.tags.length > 0);

  return {
    name: profile.name || '求职者',
    metaText: metaItems.join(' · ') || profile.headline || '简历信息待完善',
    submittedText: submittedJobTitles.length
      ? `已提交：${submittedJobTitles.join('、')}`
      : targetTags.length
        ? `求职意向：${targetTags.join('、')}`
        : '求职意向待补充',
    tagGroups,
    experiences: selectResumeSummaryExperiences(profile.experiences ?? []),
  };
}

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

function getRequirementClauses(text, skill) {
  const terms = [skill, ...(KEYWORD_ALIASES[skill] ?? [])]
    .map((item) => String(item).toLocaleLowerCase('zh-CN'));
  return String(text ?? '')
    .split(/[。；;\n]/)
    .map((item) => item.trim())
    .filter((clause) => {
      const normalized = clause.toLocaleLowerCase('zh-CN');
      return terms.some((term) => normalized.includes(term));
    });
}

function detectRequirementPriority(text, skill) {
  const source = String(text ?? '');
  const terms = [skill, ...(KEYWORD_ALIASES[skill] ?? [])];
  const markers = [
    { priority: 'required', pattern: /必须|必备|硬性|最低要求|任职要求|岗位要求|要求|required|must|minimum/gi },
    { priority: 'preferred', pattern: /优先|加分|preferred|nice to have|a plus|bonus/gi },
  ];
  const positions = terms.flatMap((term) => {
    const indexes = [];
    const escaped = String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const expression = new RegExp(escaped, 'gi');
    let match;
    while ((match = expression.exec(source))) indexes.push(match.index);
    return indexes;
  });
  for (const position of positions) {
    const beforeStart = Math.max(0, position - 32);
    const before = source.slice(beforeStart, position);
    const beforeMarkers = markers
      .flatMap(({ priority, pattern }) => {
        pattern.lastIndex = 0;
        return [...before.matchAll(pattern)].map((match) => ({ priority, distance: before.length - match.index }));
      })
      .sort((left, right) => left.distance - right.distance);
    if (beforeMarkers[0]?.distance <= 28) return beforeMarkers[0].priority;

    const after = source.slice(position + String(skill).length, position + String(skill).length + 14);
    const afterMarkers = markers
      .flatMap(({ priority, pattern }) => {
        pattern.lastIndex = 0;
        return [...after.matchAll(pattern)].map((match) => ({ priority, distance: match.index }));
      })
      .sort((left, right) => left.distance - right.distance);
    if (afterMarkers[0]?.distance <= 12) return afterMarkers[0].priority;
  }
  const clauses = getRequirementClauses(text, skill).join(' ');
  if (/必须|必备|硬性|最低要求|任职要求|岗位要求|要求|required|must|minimum/i.test(clauses)) return 'required';
  if (/优先|加分|preferred|nice to have|a plus|bonus/i.test(clauses)) return 'preferred';
  return 'unclear';
}

function normalizeSalaryText(value) {
  return String(value ?? '')
    .replace(/[￥¥]/g, '')
    .replace(/\s*([·•])\s*/g, '$1')
    .replace(/\s*([×xX*])\s*(\d{1,2}\s*薪)/g, '·$2')
    .replace(/(\d+(?:\.\d+)?)\s*([Kk千]|万)\s*([~-])\s*(\d+(?:\.\d+)?)\s*\2(?=(?:\/月|\/年|$))/g, '$1$2$3$4$2')
    .replace(/\s*([~\-])\s*/g, '$1')
    .replace(/\s+/g, '')
    .trim();
}

export function parseJobDescription(description) {
  const salaryMatch = description.match(
    /(?:薪资|薪酬|月薪|日薪|综合薪资|薪资待遇)[：:\s]*([￥¥]?\s*[0-9]+(?:\.\d+)?(?:\s*(?:[Kk千]|万))?(?:\s*[-~]\s*[￥¥]?\s*[0-9]+(?:\.\d+)?(?:\s*(?:[Kk千]|万))?)?\s*(?:元\/天|元\/日|元\/月|\/天|K\/月|k\/月|千\/月|万\/月|万\/年|[Kk千万])(?:\s*(?:[·•]|[×xX*])\s*\d{1,2}\s*薪)?)/,
  );
  const hardSkillRequirements = extractKnownTerms(description, SKILL_DICTIONARY).map((name) => ({
    name,
    requiredLevel: detectRequirementLevel(description, name),
    priority: detectRequirementPriority(description, name),
  }));
  const redLines = hardSkillRequirements.filter((skill) => skill.priority === 'required');
  const compositeCapabilities = extractCompositeCapabilities(description, 'jdSignals');

  return {
    salary: salaryMatch ? normalizeSalaryText(salaryMatch[1]) : '',
    hardSkillRequirements,
    redLines,
    compositeCapabilities,
    implicitRequirements: compositeCapabilities.map((item) => item.name),
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
    redLines: job.redLines ?? parsed.redLines,
    compositeCapabilities: job.compositeCapabilities ?? parsed.compositeCapabilities,
    implicitRequirements: job.implicitRequirements ?? parsed.implicitRequirements,
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
      '薪资：220-280元/天。参与大卫德科技用户增长与交易业务的数据分析工作，要求高级 SQL、高级 Python，必须会 Tableau 搭建指标看板，理解转化漏斗和 A/B测试结果分析，向产品与运营团队输出可执行的数据洞察。软技能要求跨部门沟通、结构化表达、业务敏感度；语言要求英语 CET-6，可阅读英文数据工具文档。',
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
      '薪资：180-220元/天。支持大卫德科技校园产品的新用户运营，熟练使用 SQL 做用户分层和转化漏斗诊断，参与活动复盘、问卷调研和内容触达策略优化，协助产品经理定位用户路径问题。软技能要求跨部门沟通、项目推进、结果导向；语言要求英语 CET-4，能阅读基础英文产品资料。',
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
      '薪资：200-260元/天。参与大卫德科技商业化团队的经营分析与市场研究，要求熟练 Excel、SQL 和数据看板整理业务指标，完成商业分析、市场研究、竞品观察和管理层汇报材料，支持业务策略判断。软技能要求结构化表达、业务敏感度、汇报表达；语言要求英语 CET-6，能整理英文行业资料。',
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
      '薪资：260-320元/天。参与大卫德科技推荐算法和智能匹配实验，要求高级 Python，熟悉机器学习、深度学习和 PyTorch，完成样本处理、模型训练、数学建模和离线评估，协助优化推荐效果。软技能要求逻辑分析、主动学习、结构化表达；语言要求英文文档阅读，能查阅英文技术文档。',
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
    id: 'davide',
    name: '大卫德',
    school: '慕尼黑工业大学',
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

function isRemoteLocation(value) {
  return /远程|线上|remote|居家办公|在家办公|wfh|work from home|home office/i.test(String(value ?? ''));
}

function getLocationSignals(value) {
  const text = String(value ?? '');
  const cities = CITY_DICTIONARY.filter((city) => city !== '远程' && text.includes(city));
  return {
    cities,
    remote: isRemoteLocation(text),
  };
}

function normalizeJobCityLabel(value) {
  const signals = getLocationSignals(value);
  if (signals.cities.length && signals.remote) return `${signals.cities[0]}/远程`;
  if (signals.cities.length) return signals.cities[0];
  if (signals.remote) return '远程';
  return String(value ?? '').trim();
}

function isCityMatch(profileCities = [], jobCity = '') {
  const jobSignals = getLocationSignals(jobCity);
  if (!jobSignals.cities.length && !jobSignals.remote) return jobCity === '远程';

  const profileSignals = profileCities.reduce((summary, city) => {
    const next = getLocationSignals(city);
    next.cities.forEach((item) => summary.cities.add(item));
    if (next.remote) summary.remote = true;
    return summary;
  }, { cities: new Set(), remote: false });

  if (jobSignals.cities.some((city) => profileSignals.cities.has(city))) return true;
  return jobSignals.remote && profileSignals.remote;
}

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
  const appearsInSkillList = (profile.skills ?? []).some((item) => item === skill);
  const appearsInExperience = hasTextMatch(profile.experiences ?? [], skill);
  return {
    count,
    level: count > 0 ? inferResumeSkillLevel(profileText, skill, count) : '未体现',
    sources: count > 0
      ? unique([
          appearsInSkillList ? '核心技能' : '',
          appearsInExperience ? '项目/经历' : '',
          !appearsInSkillList && !appearsInExperience ? '简历文本' : '',
        ])
      : [],
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

function scoreEvidenceConfidence(evidence) {
  const sources = evidence.sources ?? [];
  if (evidence.count === 0) {
    return {
      confidence: 0,
      confidenceLabel: '未验证',
      confidenceReason: '简历中未找到该能力的可定位证据',
      adjusted: true,
    };
  }
  if (sources.includes('项目/经历') && evidence.count >= 2) {
    return {
      confidence: 1,
      confidenceLabel: '证据充分',
      confidenceReason: '核心技能和项目经历能够相互印证',
      adjusted: false,
    };
  }
  if (sources.includes('项目/经历')) {
    return {
      confidence: 0.9,
      confidenceLabel: '有经历支撑',
      confidenceReason: '已有项目经历支撑，建议进一步补充量化结果',
      adjusted: true,
    };
  }
  if (sources.includes('技能区') || sources.includes('核心技能')) {
    return {
      confidence: 0.72,
      confidenceLabel: '需补充项目证据',
      confidenceReason: '目前主要来自核心技能表述，建议补充具体项目场景；该项评分已适度下调',
      adjusted: true,
    };
  }
  return {
    confidence: 0.6,
    confidenceLabel: '证据有限',
    confidenceReason: '简历中缺少可定位的项目场景，建议补充任务和结果',
    adjusted: true,
  };
}

export function getSkillMatchDetails(profile, job) {
  return (job.tags ?? []).map((skill) => {
    const evidence = getProfileSkillEvidence(profile, skill);
    const jdRequirement = getJobRequirement(job, skill);
    const baseScore = scoreSkillDetail(jdRequirement, evidence.level, evidence.count);
    const confidence = scoreEvidenceConfidence(evidence);
    const score = Math.round(baseScore * confidence.confidence);
    const resumeEvidence =
      evidence.count > 0
        ? `简历中定位到 ${evidence.count} 处相关证据`
        : '未在简历中出现';
    const sourceText = evidence.sources?.length ? evidence.sources.join('、') : '暂无明确来源';

    return {
      name: skill,
      jdRequirement,
      resumeLevel: evidence.level,
      resumeEvidence,
      sourceText,
      baseScore,
      score,
      max: 10,
      ...confidence,
    };
  });
}

export function buildRequirementLedger(profile, job) {
  const requirements = job.hardSkillRequirements ?? parseJobDescription(job.description ?? '').hardSkillRequirements;

  return requirements.map((requirement) => {
    const detail = getSkillMatchDetails(profile, {
      ...job,
      tags: [requirement.name],
      hardSkillRequirements: [requirement],
    })[0];
    const status = detail.score === 0
      ? 'not_evidenced'
      : detail.score >= 8 && detail.confidence >= 0.9
        ? 'met'
        : 'partial';
    const jdEvidence = getRequirementClauses(job.description ?? '', requirement.name)[0]
      ?? `${requirement.name}（${requirement.requiredLevel}）`;

    return {
      name: requirement.name,
      kind: 'hard_skill',
      priority: requirement.priority ?? 'unclear',
      requiredLevel: requirement.requiredLevel,
      status,
      score: detail.score,
      max: detail.max ?? 10,
      jdEvidence,
      resumeEvidence: detail.resumeEvidence,
      sourceText: detail.sourceText,
      explanation: status === 'met'
        ? '简历中有可定位的经历证据。'
        : status === 'partial'
          ? '简历提到了该能力，但经历证据或熟练度仍不足。'
          : '简历中未找到证据；这不等同于断言候选人不具备该能力。',
    };
  });
}

function applyRequiredQualificationCap(rawScore, profile, job) {
  const required = buildRequirementLedger(profile, job).filter((item) => item.priority === 'required');
  if (required.length === 0) return { score: rawScore, cap: null };

  const missing = required.filter((item) => item.status === 'not_evidenced');
  const coveredUnits = required.reduce(
    (sum, item) => sum + (item.status === 'met' ? 1 : item.status === 'partial' ? 0.5 : 0),
    0,
  );
  const coverage = coveredUnits / required.length;
  let limit = 100;
  if (coverage < 0.5) limit = 59;
  else if (missing.length > 0) limit = 74;
  else if (coverage < 0.8) limit = 84;
  if (limit === 100) return { score: rawScore, cap: null };

  const missingLabel = missing.length > 0 ? missing.map((item) => item.name).join('、') : '部分必备要求';
  const adjusted = rawScore > limit;
  return {
    score: adjusted ? limit : rawScore,
    cap: {
      limit,
      coverage: Math.round(coverage * 100),
      missing: missing.map((item) => item.name),
      adjusted,
      reason: adjusted
        ? `必备要求证据不足（${missingLabel}），总分由 ${rawScore} 调整为 ${limit}。`
        : `必备要求证据不足（${missingLabel}），评分上限为 ${limit}；当前原始分 ${rawScore} 未触及上限。`,
    },
  };
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
  const cityMatch = isCityMatch(profile.cityPreferences ?? [], job.city);

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
        ? `${matchedSkills.length}/${details.length} 项软技能可由简历经历支撑`
        : '建议补充协作、表达或项目推进相关经历',
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
      detail: '岗位未设置语言硬性门槛',
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
        ? '语言能力满足 JD 要求'
        : '语言能力与 JD 要求仍有差距',
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
  const experienceEvidenceCount = skillDetails.filter(
    (item) => item.score > 0 && item.sourceText.split('、').includes('项目/经历'),
  ).length;
  const evidenceScore = experienceEvidenceCount >= 3 ? 10 : experienceEvidenceCount >= 2 ? 6 : experienceEvidenceCount === 1 ? 3 : 0;

  return [
    {
      label: '硬技能匹配',
      points: skillScore,
      max: 50,
      detail: `${matchedTags.length}/${tagCount} 个核心能力被简历覆盖；技能分项得分 ${skillRawScore}`,
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
      detail: experienceEvidenceCount > 0
        ? `${experienceEvidenceCount}/${skillDetails.length} 项核心能力有项目或经历支撑`
        : '核心能力仅出现在技能列表或尚未出现，需要补充真实经历证据',
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
      detail: matchedNiceToHave.length > 0 ? `关联 ${matchedNiceToHave.join('、')}` : '加分方向尚未在求职偏好中体现',
    },
  ];
}

export function buildScoreExplanation(profile, job) {
  const breakdown = getScoreBreakdown(profile, job);
  const rawTotal = breakdown.reduce((sum, item) => sum + item.points, 0);
  const capped = applyRequiredQualificationCap(rawTotal, profile, job);
  const formulaBase = `${breakdown.map((item) => `${item.label} ${item.points}`).join(' + ')}`;
  const formula = capped.cap?.adjusted
    ? `原始分 ${rawTotal} = ${formulaBase}；${capped.cap.reason}`
    : capped.cap
      ? `总分 ${capped.score} = ${formulaBase}；${capped.cap.reason}`
      : `总分 ${capped.score} = ${formulaBase}`;

  return {
    total: capped.score,
    rawTotal,
    formula,
    breakdown,
    scoreCap: capped.cap,
    requirementLedger: buildRequirementLedger(profile, job),
    skillDetails: getSkillMatchDetails(profile, job),
    softSkillDetails: buildSoftSkillMatchDetails(profile, job),
  };
}

export function buildEvidenceConfidenceSummary(profile, job) {
  const details = getSkillMatchDetails(profile, job);
  const adjustedItems = details.filter((item) => item.adjusted);
  const highConfidence = details.filter((item) => item.confidence >= 0.9);
  const averageConfidence =
    details.length > 0
      ? Math.round((details.reduce((sum, item) => sum + item.confidence, 0) / details.length) * 100)
      : 100;

  return {
    averageConfidence,
    summary:
      adjustedItems.length > 0
        ? `${adjustedItems.length} 项能力主要来自概括表述，已降低该项评分权重`
        : '核心能力均有多点证据链支撑',
    highConfidenceCount: highConfidence.length,
    adjustedItems,
    details,
  };
}

export function buildPotentialAnalysis(profile) {
  const experiences = profile.experiences ?? [];
  const complexityTerms = ['SQL', 'Python', 'Tableau', 'A/B', '模型', '看板', '漏斗', '复盘', '访谈', '问卷'];
  const scoredExperiences = experiences.map((experience, index) => {
    const toolCount = complexityTerms.filter((term) => experience.includes(term)).length;
    const numberBonus = /\d/.test(experience) ? 2 : 0;
    const ownershipBonus = /负责|组织|输出|形成|定位|搭建/.test(experience) ? 2 : 0;
    return {
      stage: index + 1,
      score: 4 + toolCount * 2 + numberBonus + ownershipBonus,
      text: experience,
    };
  });
  const early = scoredExperiences.slice(0, Math.ceil(scoredExperiences.length / 2));
  const late = scoredExperiences.slice(Math.ceil(scoredExperiences.length / 2));
  const earlyAverage = early.length ? early.reduce((sum, item) => sum + item.score, 0) / early.length : 0;
  const lateAverage = late.length ? late.reduce((sum, item) => sum + item.score, 0) / late.length : earlyAverage;
  const skillBreadth = Math.min((profile.skills ?? []).length, 10);
  const score = Math.min(100, Math.round(55 + skillBreadth * 3 + Math.max(0, lateAverage - earlyAverage) * 3));

  return {
    score,
    label: score >= 82 ? '成长潜力高' : score >= 68 ? '成长潜力稳定' : '需要补充进阶证据',
    trend: lateAverage >= earlyAverage ? '经历复杂度呈上升或稳定趋势' : '后段经历复杂度略低，建议补充更强项目',
    signals: [
      `${profile.skills?.length ?? 0} 项核心技能形成能力广度`,
      `${experiences.length} 条经历可用于支撑岗位匹配`,
      lateAverage >= earlyAverage ? '后续经历包含更多任务闭环' : '需要让最近经历更突出工具和结果',
    ],
    stages: scoredExperiences,
  };
}

export function buildCompositeCapabilityDetails(profile, job) {
  const profileText = profileToSearchText(profile);
  const jobCapabilities = job.compositeCapabilities ?? parseJobDescription(job.description ?? '').compositeCapabilities;

  return jobCapabilities.map((capability) => {
    const rule = COMPOSITE_CAPABILITY_RULES.find((item) => item.name === capability.name);
    const profileSignals = rule?.profileSignals.filter((signal) => profileText.includes(signal)) ?? [];

    return {
      name: capability.name,
      description: capability.description,
      jdSignals: capability.signals,
      profileSignals,
      matched: profileSignals.length > 0,
      conclusion:
        profileSignals.length > 0
          ? `简历体现 ${profileSignals.join('、')}`
          : '简历中尚未形成直接的复合能力证据',
    };
  });
}

export function buildMatchHeatmap(profile, job) {
  return getScoreBreakdown(profile, job).map((item) => {
    const ratio = item.max > 0 ? item.points / item.max : 1;
    return {
      label: item.label,
      points: item.points,
      max: item.max,
      intensity: Math.round(ratio * 100),
      level: ratio >= 0.85 ? '高匹配' : ratio >= 0.6 ? '中等匹配' : '需补充',
      levelKey: ratio >= 0.85 ? 'high' : ratio >= 0.6 ? 'medium' : 'low',
      detail: item.detail,
    };
  });
}

export function buildTeamComplement(candidate) {
  const profileText = profileToSearchText(candidate.profile);
  const matchedGaps = TEAM_CAPABILITY_GAPS.filter((gap) => {
    if (gap === '用户研究') return /问卷|访谈|用户/.test(profileText);
    if (gap === '模型评估') return /模型|评估|PyTorch|推荐/.test(profileText);
    return profileText.includes(gap);
  });
  const score = Math.round((matchedGaps.length / TEAM_CAPABILITY_GAPS.length) * 100);

  return {
    score,
    matchedGaps,
    teamGaps: TEAM_CAPABILITY_GAPS,
    summary:
      matchedGaps.length > 0
        ? `${candidate.name} 可补强团队的 ${matchedGaps.join('、')} 能力`
        : '当前候选人与团队短板交集有限，可优先看岗位匹配',
  };
}

export function buildCrossRoleRecommendations(candidate, jobs = JOBS) {
  const submittedIds = new Set(candidate.submittedJobIds);
  const profileText = profileToSearchText(candidate.profile);

  return rankJobs(candidate.profile, jobs)
    .filter((analysis) => !submittedIds.has(analysis.job.id))
    .map((analysis) => {
      const compositeMatches = buildCompositeCapabilityDetails(candidate.profile, analysis.job).filter((item) => item.matched);
      const transferSignals = unique([
        ...analysis.matchedTags,
        ...compositeMatches.map((item) => item.name),
        /问卷|访谈|用户/.test(profileText) && analysis.job.title.includes('运营') ? '用户研究可迁移' : '',
        /SQL|看板|商业分析/.test(profileText) && analysis.job.title.includes('商业') ? '数据分析可迁移' : '',
      ]);

      return {
        id: analysis.job.id,
        title: analysis.job.title,
        city: analysis.job.city,
        score: analysis.score,
        matchedTags: analysis.matchedTags,
        transferSignals,
        reason: transferSignals.length > 0
          ? `跨界依据：${transferSignals.slice(0, 3).join('、')}`
          : '跨界依据较少，仅作为备选方向',
      };
    })
    .filter((item) => item.transferSignals.length > 0 || item.score >= 60)
    .slice(0, 2);
}

export function buildInterviewQuestions(candidate, job) {
  const skillDetails = getSkillMatchDetails(candidate.profile, job);
  const compositeDetails = buildCompositeCapabilityDetails(candidate.profile, job);
  const weakSkills = skillDetails.filter((item) => item.score < item.max || item.confidence < 0.9).slice(0, 3);
  const questions = weakSkills.map((item) => ({
    focus: item.name,
    question: `请具体讲一个你在项目中使用 ${item.name} 的场景：当时目标、输入数据、你的动作和结果分别是什么？`,
    reason: item.confidenceReason,
  }));
  compositeDetails
    .filter((item) => !item.matched)
    .slice(0, Math.max(0, 4 - questions.length))
    .forEach((item) => {
      questions.push({
        focus: item.name,
        question: `这个岗位需要${item.name}，请举例说明你如何把分析结论推进成实际业务动作。`,
        reason: '复合能力在简历中体现不够直接',
      });
    });

  if (questions.length === 0) {
    questions.push({
      focus: '项目复盘',
      question: '请选一个最相关项目，说明你如何判断项目成功，以及下一步会如何优化。',
      reason: '用于确认候选人是否具备复盘和业务判断能力',
    });
  }

  return questions;
}

export function buildEvidenceTrace(profile, job, focus) {
  const profileTextItems = profile.experiences ?? [];
  const matchedExperiences = profileTextItems.filter((item) => hasTextMatch([item], focus));
  const normalizedFocus = focus.toLowerCase();
  const skillRequirement = job.hardSkillRequirements?.find((item) => item.name.toLowerCase() === normalizedFocus);
  const softRequirement = job.softSkills?.find((item) => item === focus);
  const languageRequirement = job.languageRequirements?.find((item) => item.includes(focus) || focus.includes(item));
  const breakdownDetail = getScoreBreakdown(profile, job).find((item) => item.label === focus)?.detail;
  let jdText = breakdownDetail ? `评分维度：${focus}。${breakdownDetail}` : `${focus} 与 ${job.title} 的岗位匹配相关。`;

  if (skillRequirement) {
    jdText = `JD 核心技能：${skillRequirement.name}，要求 ${skillRequirement.requiredLevel}。`;
  } else if (softRequirement) {
    jdText = `JD 软技能：需要体现 ${softRequirement}。`;
  } else if (languageRequirement) {
    jdText = `JD 语言要求：${languageRequirement}。`;
  } else if (job.description.includes(focus)) {
    jdText = `JD 描述中明确出现：${focus}。`;
  }

  return {
    focus,
    jdText,
    resumeText:
      matchedExperiences.length > 0
        ? matchedExperiences.slice(0, 2).join('；')
        : getProfileSkillEvidence(profile, focus).count > 0
          ? `${focus} 出现在核心技能或简历文本中，但项目上下文较少`
          : '简历中暂未定位到直接对应文本',
  };
}

export function analyzeJobFit(profile, job) {
  const { matchedTags, matchedNiceToHave, cityMatch } = getMatchInputs(profile, job);
  const explanation = buildScoreExplanation(profile, job);
  const score = clampScore(explanation.total);

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
    scoreCap: explanation.scoreCap,
    requirementLedger: explanation.requirementLedger,
    reasons: [
      `${matchedTags.length}/${(job.tags ?? []).length} 个核心能力已被简历证据覆盖`,
      scoreSoftSkillDimension(profile, job).detail,
      scoreLanguageDimension(profile, job).detail,
      cityMatch ? `地点偏好包含 ${job.city}` : `地点 ${job.city} 不在当前偏好中`,
      matchedNiceToHave.length > 0
        ? `兴趣方向与 ${matchedNiceToHave.join('、')} 有交集`
        : '加分方向尚未在求职偏好中体现',
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

function inferJobCityFromText(text) {
  const source = String(text ?? '');
  const explicit = source.match(/(?:工作地点|办公地点|地点|城市|base|Base)\s*[：:\s]*([^\n。；;]+)/);
  const fieldText = explicit?.[1] ?? source;
  return normalizeJobCityLabel(fieldText);
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
    city: normalizeJobCityLabel(city) || inferJobCityFromText(sourceText) || '上海',
    tags: (tags.length > 0 ? tags : ['SQL', '用户调研', '数据看板']).slice(0, 8),
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
  const suggestedJobs = buildCrossRoleRecommendations(candidate, jobs)
    .filter((item) => !submittedIds.has(item.id));
  const bestSubmitted = submittedJobs[0];
  const bestSuggested = suggestedJobs[0];

  let screeningRecommendation = '建议人工复核：当前投递岗位证据不完整。';
  if (bestSubmitted?.score >= 75) {
    screeningRecommendation = `建议进入初筛：${candidate.name} 与 ${bestSubmitted.title} 匹配度 ${bestSubmitted.score} 分。`;
  } else if (bestSubmitted?.score < 60) {
    screeningRecommendation = `暂不建议进入初筛：当前投递岗位最高匹配度 ${bestSubmitted.score} 分。`;
  } else if (!bestSubmitted && bestSuggested?.score >= 75) {
    screeningRecommendation = `建议联系候选人补投递 ${bestSuggested.title}：当前简历匹配度 ${bestSuggested.score} 分。`;
  }

  const routingRecommendation =
    bestSuggested && (!bestSubmitted || bestSuggested.score > bestSubmitted.score + 5)
      ? `建议转推荐至 ${bestSuggested.title}：匹配度 ${bestSuggested.score} 分，${bestSuggested.reason}。`
      : '当前投递方向基本匹配，可按原岗位推进筛选。';

  return {
    candidate,
    submittedJobs,
    suggestedJobs,
    screeningRecommendation,
    routingRecommendation,
  };
}

export function buildCandidateMatchSummary(candidate, jobs = JOBS) {
  const insight = buildAdminCandidateInsight(candidate, jobs);
  const bestSubmitted = insight.submittedJobs[0];
  if (bestSubmitted) {
    const strongestSignal = bestSubmitted.matchedTags?.[0];
    const topGap = bestSubmitted.gaps?.[0];
    const focus = strongestSignal ? `强项：${strongestSignal}` : topGap ? `待补：${topGap}` : '可按当前岗位推进';
    return `最佳已投：${bestSubmitted.title} ${bestSubmitted.score}分 · ${focus}`;
  }

  const bestSuggested = insight.suggestedJobs[0];
  if (bestSuggested) return `推荐转看：${bestSuggested.title} ${bestSuggested.score}分 · ${bestSuggested.reason}`;
  return '已解析简历，等待岗位匹配';
}

export function buildHrCandidateQueueSummary(candidates = [], jobs = JOBS) {
  const submittedCount = candidates.filter((candidate) => (candidate.submittedJobIds?.length ?? 0) > 0).length;
  const uploadOnlyCount = candidates.length - submittedCount;
  const strongMatchCount = candidates.filter((candidate) => {
    if ((candidate.submittedJobIds?.length ?? 0) === 0) return false;
    const bestSubmitted = buildAdminCandidateInsight(candidate, jobs).submittedJobs[0];
    return (bestSubmitted?.score ?? 0) >= 80;
  }).length;
  const uploadOnlyHighPotentialCount = candidates.filter((candidate) => {
    if ((candidate.submittedJobIds?.length ?? 0) > 0) return false;
    const bestSuggested = buildAdminCandidateInsight(candidate, jobs).suggestedJobs[0];
    return (bestSuggested?.score ?? 0) >= 80;
  }).length;
  if (!candidates.length) return '0 人';
  if (submittedCount === 0) {
    const highPotentialLabel = uploadOnlyHighPotentialCount > 0 ? ` · 高潜 ${uploadOnlyHighPotentialCount}` : '';
    return `${candidates.length} 人 · 待分流 ${uploadOnlyCount}${highPotentialLabel}`;
  }
  const strongMatchLabel = strongMatchCount > 0 ? ` · 高匹配 ${strongMatchCount}` : '';
  const uploadOnlyHighPotentialLabel = uploadOnlyHighPotentialCount > 0 ? ` · 高潜待分流 ${uploadOnlyHighPotentialCount}` : '';
  return uploadOnlyCount > 0
    ? `${candidates.length} 人 · 已投递 ${submittedCount}${strongMatchLabel} · 待分流 ${uploadOnlyCount}${uploadOnlyHighPotentialLabel}`
    : `${candidates.length} 人 · 已投递 ${submittedCount}${strongMatchLabel}`;
}

function getHrCandidateExtractionSearchTerms(candidate) {
  const textSource = candidate.textSource ?? 'pdf-text';
  const humanReadableLabel =
    textSource === 'openai-ocr'
      ? 'OpenAI OCR 提取'
      : textSource === 'pdf-text-fallback'
        ? 'PDF 文本提取保底'
        : '原生 PDF 文本';
  const labels = [
    textSource,
    humanReadableLabel,
    humanReadableLabel === '原生 PDF 文本' ? 'PDF 文本提取' : '',
  ];
  if (candidate.extractionWarning) labels.push('OCR 回退');
  return labels;
}

function normalizeHrCandidateStage(stage) {
  const normalized = String(stage ?? '')
    .trim()
    .toLocaleLowerCase('zh-CN')
    .replace(/[_\s]+/g, '-');
  const aliasMap = {
    '': 'all',
    all: 'all',
    submitted: 'submitted',
    '已投递': 'submitted',
    unsubmitted: 'unsubmitted',
    'upload-only': 'unsubmitted',
    'uploaded-only': 'unsubmitted',
    '待分流': 'unsubmitted',
    'high-potential-unsubmitted': 'high-potential-unsubmitted',
    'high-potential': 'high-potential-unsubmitted',
    'high-potential-upload-only': 'high-potential-unsubmitted',
    '高潜待分流': 'high-potential-unsubmitted',
    strong: 'strong',
    'strong-match': 'strong',
    'high-match': 'strong',
    '高匹配': 'strong',
    'native-pdf': 'native-pdf',
    'native-pdf-text': 'native-pdf',
    'pdf-text': 'native-pdf',
    '原生pdf': 'native-pdf',
    '原生-pdf': 'native-pdf',
    '原生-pdf-文本': 'native-pdf',
    'openai-ocr': 'openai-ocr',
    'openaiocr': 'openai-ocr',
    ocr: 'openai-ocr',
    'ocr-fallback': 'ocr-fallback',
    'ocr-warning': 'ocr-fallback',
    'ocr-review': 'ocr-fallback',
    'ocr-回退': 'ocr-fallback',
  };
  return aliasMap[normalized] ?? 'all';
}

export function filterHrCandidatesForReview(candidates = [], jobs = JOBS, filters = {}) {
  const query = String(filters.query ?? '').trim().toLocaleLowerCase('zh-CN');
  const stage = normalizeHrCandidateStage(filters.stage);

  return candidates.filter((candidate) => {
    const submittedJobIds = candidate.submittedJobIds ?? [];
    const insight = buildAdminCandidateInsight(candidate, jobs);
    const bestMatch = insight.submittedJobs[0] ?? insight.suggestedJobs[0];
    const bestSuggestedScore = insight.suggestedJobs[0]?.score ?? 0;
    const textSource = candidate.textSource ?? 'pdf-text';
    if (stage === 'submitted' && submittedJobIds.length === 0) return false;
    if (stage === 'unsubmitted' && submittedJobIds.length > 0) return false;
    if (stage === 'high-potential-unsubmitted' && (submittedJobIds.length > 0 || bestSuggestedScore < 80)) return false;
    if (stage === 'strong' && (bestMatch?.score ?? 0) < 80) return false;
    if (stage === 'native-pdf' && textSource !== 'pdf-text') return false;
    if (stage === 'openai-ocr' && textSource !== 'openai-ocr') return false;
    if (stage === 'ocr-fallback' && !candidate.extractionWarning) return false;
    if (!query) return true;

    const profile = candidate.profile ?? {};
    const submittedTitles = submittedJobIds
      .map((jobId) => jobs.find((job) => job.id === jobId)?.title)
      .filter(Boolean);
    const fitHighlights = buildCandidateFitHighlights(candidate, jobs).map((item) => item.label);
    const matchSummary = buildCandidateMatchSummary(candidate, jobs);
    const searchable = [
      candidate.name,
      candidate.email,
      candidate.school,
      candidate.major,
      candidate.fileName,
      profile.headline,
      profile.target,
      ...(profile.cityPreferences ?? []),
      ...(profile.interests ?? []),
      ...(profile.experiences ?? []),
      matchSummary,
      insight.screeningRecommendation,
      insight.routingRecommendation,
      ...getHrCandidateExtractionSearchTerms(candidate),
      candidate.extractionWarning,
      ...(profile.skills ?? []),
      ...(profile.languages ?? []),
      ...(profile.softSkills ?? []),
      ...submittedTitles,
      ...fitHighlights,
      ...(insight.suggestedJobs ?? []).slice(0, 2).map((job) => job.title),
      profile.rawResume,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-CN');
    return searchable.includes(query);
  });
}

export function resolveHrCandidateSelection(candidates = [], previousSelectedId = '') {
  if (previousSelectedId && candidates.some((candidate) => candidate.id === previousSelectedId)) {
    return previousSelectedId;
  }
  return candidates[0]?.id ?? '';
}

export function sortHrCandidatesForReview(candidates = [], jobs = JOBS) {
  return [...candidates].sort((left, right) => {
    const leftSubmittedCount = left.submittedJobIds?.length ?? 0;
    const rightSubmittedCount = right.submittedJobIds?.length ?? 0;
    const leftHasSubmittedJobs = leftSubmittedCount > 0;
    const rightHasSubmittedJobs = rightSubmittedCount > 0;
    if (leftHasSubmittedJobs !== rightHasSubmittedJobs) return leftHasSubmittedJobs ? -1 : 1;

    const leftInsight = buildAdminCandidateInsight(left, jobs);
    const rightInsight = buildAdminCandidateInsight(right, jobs);
    const leftSubmittedScore = leftInsight.submittedJobs[0]?.score ?? -1;
    const rightSubmittedScore = rightInsight.submittedJobs[0]?.score ?? -1;
    if (leftSubmittedScore !== rightSubmittedScore) return rightSubmittedScore - leftSubmittedScore;

    const leftSuggestedScore = leftInsight.suggestedJobs[0]?.score ?? -1;
    const rightSuggestedScore = rightInsight.suggestedJobs[0]?.score ?? -1;
    if (leftSuggestedScore !== rightSuggestedScore) return rightSuggestedScore - leftSuggestedScore;

    if (leftSubmittedCount !== rightSubmittedCount) return rightSubmittedCount - leftSubmittedCount;

    return String(left.name ?? '').localeCompare(String(right.name ?? ''), 'zh-Hans-CN');
  });
}

export function buildCandidateFitHighlights(candidate, jobs = JOBS) {
  const insight = buildAdminCandidateInsight(candidate, jobs);
  const anchorJob = insight.submittedJobs[0] ?? insight.suggestedJobs[0];
  if (!anchorJob) return [];

  const primaryGap =
    anchorJob.gaps?.[0] ??
    insight.submittedJobs.find((job) => job.gaps?.length)?.gaps?.[0] ??
    insight.suggestedJobs.find((job) => job.gaps?.length)?.gaps?.[0] ??
    '';
  const hasGap = Boolean(primaryGap);
  const matched = (anchorJob.matchedTags ?? [])
    .slice(0, hasGap ? 2 : 3)
    .map((tag) => ({ type: 'match', label: `强项：${tag}` }));
  const gap = primaryGap ? [{ type: 'gap', label: `待补：${primaryGap}` }] : [];
  return [...matched, ...gap].slice(0, 3);
}

export function buildResumeAdvice(profile, job) {
  const analysis = analyzeJobFit(profile, job);
  const relevantExperiences = selectGroundedExperiences(profile, job);
  const rewrites = relevantExperiences.length > 0
    ? relevantExperiences.slice(0, 2).map((experience) => ({
        before: experience,
        after: normalizeGroundedResumeLine(experience),
        targetSection: '与目标岗位最相关的项目或经历',
        reason: '只调整表达顺序，不增加原简历中不存在的工具、数字、结果或职责。',
      }))
    : [{
        before: '暂无可直接改写的相关经历',
        after: '请先补充一段真实经历，再按“任务—动作—工具—结果”组织；没有的经历或结果不要添加。',
        targetSection: '项目或经历',
        reason: '当前简历没有可安全改写的岗位相关事实。',
      }];

  const weakEvidence = getSkillMatchDetails(profile, job)
    .filter((item) => item.score > 0 && item.confidence < 0.9)
    .map((item) => item.name);
  const nextActions = [];
  if (analysis.gaps.length > 0) {
    nextActions.push(
      `核对 JD 中尚无简历证据的 ${analysis.gaps.slice(0, 2).join('、')}：只有确实具备时才补充真实使用场景。`,
    );
  }
  if (weakEvidence.length > 0) {
    nextActions.push(`为 ${weakEvidence.slice(0, 2).join('、')} 补充已有项目中的任务、动作和结果证据。`);
  }
  nextActions.push(
    '把上方最相关的真实经历移到简历第一页上半部分。',
    '逐条核对数字、工具和结果是否能由原始经历或材料证明。',
    '投递前准备 30 秒岗位匹配自我介绍，并明确说明尚未具备的要求。',
  );

  return {
    coveredKeywords: analysis.matchedTags,
    missingKeywords: analysis.gaps,
    screeningSignal:
      analysis.score >= 80
        ? '初筛竞争力较强，建议完成针对性优化后投递'
        : analysis.score >= 65
          ? '具备投递基础，建议先补强关键能力表述'
          : '当前证据支撑不足，建议先补充项目经历',
    rewrites,
    nextActions: unique(nextActions).slice(0, 5),
    groundingNotice: '所有改写仅重组原简历事实；系统不会替你新增技能、数字、成果或经历。',
  };
}

function normalizeGroundedResumeLine(experience) {
  const normalized = String(experience ?? '')
    .replace(/^[-•·]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return '请补充真实经历后再改写。';
  return /[。！？.!?]$/.test(normalized) ? normalized : `${normalized}。`;
}

function selectGroundedExperiences(profile, job) {
  const jobTerms = unique([
    ...(job.tags ?? []),
    ...(job.softSkills ?? []),
    ...(job.languageRequirements ?? []),
    ...(job.responsibilities ?? []).flatMap((item) => String(item).split(/[、/\s]+/)),
  ]).filter((term) => String(term).length >= 2);

  const ranked = (profile.experiences ?? [])
    .map((experience, index) => ({
      experience,
      index,
      relevance: jobTerms.reduce(
        (score, term) => score + (hasTextMatch([experience], term) || String(experience).includes(term) ? 1 : 0),
        0,
      ),
    }))
    .filter((item) => item.relevance > 0)
    .sort((left, right) => right.relevance - left.relevance || left.index - right.index)
    .map((item) => item.experience);
  return ranked.length > 0 ? ranked : (profile.experiences ?? []).slice(0, 2);
}

export function buildTailoredResumeSnippet(profile, job) {
  const selected = selectGroundedExperiences(profile, job).slice(0, 4);
  if (selected.length === 0) {
    return `针对「${job.title}」暂无可安全改写的直接证据；请先补充真实项目或经历。`;
  }
  const requirementFocus = (job.tags ?? [])
    .filter((tag) => selected.some((experience) => hasTextMatch([experience], tag)))
    .slice(0, 3);
  const focusLabel = requirementFocus.length > 0 ? `（对应 ${requirementFocus.join('、')}）` : '';
  return `针对「${job.title}」可优先展示的现有证据${focusLabel}：${selected
    .map(normalizeGroundedResumeLine)
    .join('；')}`;
}
