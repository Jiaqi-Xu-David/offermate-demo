import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  COMPANY,
  SAMPLE_RESUME_TEXT,
  STUDENT_PROFILE,
  JOBS,
  CANDIDATES,
  analyzeJobFit,
  analyzeJobDescription,
  buildAdminCandidateInsight,
  buildCandidateFitHighlights,
  buildCandidateMatchSummary,
  buildCompositeCapabilityDetails,
  buildCrossRoleRecommendations,
  buildEvidenceTrace,
  buildEvidenceConfidenceSummary,
  buildHrCandidateQueueSummary,
  buildInterviewQuestions,
  buildMatchHeatmap,
  buildPotentialAnalysis,
  buildScoreExplanation,
  buildResumeAdvice,
  buildResumeSummary,
  buildSoftSkillMatchDetails,
  buildStudentWorkflowSummary,
  buildTeamComplement,
  buildTailoredResumeSnippet,
  getSkillMatchDetails,
  getScoreBreakdown,
  findJobById,
  filterHrCandidatesForReview,
  parseJobDescription,
  parseResumeText,
  resolveHrCandidateSelection,
  sortHrCandidatesForReview,
} from '../src/matcher.js';
import { buildJobDetailUrl } from '../src/job-navigation.js';

test('ranks a data analyst internship as the strongest fit', () => {
  const scoredJobs = JOBS.map((job) => analyzeJobFit(STUDENT_PROFILE, job))
    .sort((a, b) => b.score - a.score);

  assert.equal(scoredJobs[0].job.id, 'data-analyst-intern');
  assert.ok(scoredJobs[0].score >= 80);
  assert.equal(scoredJobs[0].level, '优先投递');
});

test('produces resume advice with missing keywords and rewrite suggestions', () => {
  const targetJob = JOBS.find((job) => job.id === 'product-ops-intern');
  const advice = buildResumeAdvice(STUDENT_PROFILE, targetJob);

  assert.ok(advice.coveredKeywords.includes('SQL'));
  assert.ok(advice.missingKeywords.includes('用户分层'));
  assert.ok(advice.rewrites[0].after.includes('SQL'));
  assert.ok(advice.nextActions.length >= 3);
});

test('resume advice does not fabricate data-analysis templates for HR resumes', () => {
  const targetJob = JOBS.find((job) => job.id === 'data-analyst-intern');
  const profile = parseResumeText(`专业赛事
教育经历2023.9-至今哈尔滨华德学院人力资源管理本科主修人力资源管理、组织行为学、劳动法、招聘与选拔等核心课程，系统掌握了人力资源管理
通财务有限公司人事实习生半职责范围:协助人力资源部门完成日常人事管理工作，包括员工档案整理、考勤统计及入职离职手续办理；参与公司招聘流程，负责简历初步筛选及面试邀约协调；独立完成10份员工档案电子化归档工作`);
  const advice = buildResumeAdvice(profile, targetJob);
  const rewrittenText = advice.rewrites.map((item) => item.after).join(' ');

  assert.ok(rewrittenText.includes('人事') || rewrittenText.includes('招聘') || rewrittenText.includes('档案'));
  assert.ok(!rewrittenText.includes('SQL'));
  assert.ok(!rewrittenText.includes('Python'));
  assert.ok(!rewrittenText.includes('10万+'));
  assert.ok(!rewrittenText.includes('校园 App'));
});

test('treats adjacent product operations evidence as a viable role match', () => {
  const targetJob = JOBS.find((job) => job.id === 'product-ops-intern');
  const analysis = analyzeJobFit(STUDENT_PROFILE, targetJob);

  assert.ok(analysis.score >= 65);
  assert.equal(analysis.level, '可投递');
  assert.ok(analysis.matchedTags.includes('问卷调研'));
});

test('parses the realistic sample resume into a student profile', () => {
  const profile = parseResumeText(SAMPLE_RESUME_TEXT);

  assert.equal(profile.name, '大卫德');
  assert.equal(profile.gender, '男');
  assert.ok(profile.headline.includes('慕尼黑工业大学'));
  assert.ok(profile.skills.includes('SQL'));
  assert.ok(profile.skills.includes('Tableau'));
  assert.ok(profile.languages.includes('英语 CET-6'));
  assert.ok(profile.softSkills.includes('跨部门沟通'));
  assert.ok(profile.cityPreferences.includes('上海'));
  assert.ok(profile.experiences.some((item) => item.includes('10万+ 用户行为数据')));
  assert.ok(profile.skillEvidence.SQL.count >= 2);
});

test('recognizes AI and frontend engineering aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：林一
学校：上海交通大学 软件工程 本科
求职意向：AI 应用开发实习
技能：JS、React.js、TypeScript、Node、LLM、RAG、Prompt Engineering
项目经历：使用 React.js 和 TypeScript 搭建简历匹配前端，用 LangChain 接入大语言模型并完成 RAG 检索问答。`);
  const job = analyzeJobDescription({
    title: 'AI 应用开发实习生',
    city: '上海',
    description: '负责 AI 求职智能体前端和模型应用开发，要求 JavaScript、React、TypeScript、Node.js、LLM、RAG 和 LangChain 经验。',
  });

  assert.ok(profile.skills.includes('JavaScript'));
  assert.ok(profile.skills.includes('React'));
  assert.ok(profile.skills.includes('TypeScript'));
  assert.ok(profile.skills.includes('Node.js'));
  assert.ok(profile.skills.includes('大语言模型'));
  assert.ok(profile.skills.includes('RAG'));
  assert.ok(job.tags.includes('JavaScript'));
  assert.ok(job.tags.includes('React'));
  assert.ok(job.tags.includes('LangChain'));
});

test('recognizes modern frontend and AI platform aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：周宁
学校：同济大学 软件工程 本科
求职意向：AI 产品工程实习
技能：Next.js、Vue3、Tailwind CSS、OpenAI API、Vercel
项目经历：使用 Next.js 和 Tailwind CSS 搭建 AI 求职产品前端，通过 OpenAI API 接入简历解析与问答能力，并部署到 Vercel。`);
  const job = analyzeJobDescription({
    title: 'AI 产品工程实习生',
    city: '上海',
    description: '负责使用 Next.js、Vue、TailwindCSS 和 OpenAI API 开发 AI 求职产品前端，并完成 Vercel 部署。',
  });

  assert.ok(profile.skills.includes('Next.js'));
  assert.ok(profile.skills.includes('Vue'));
  assert.ok(profile.skills.includes('Tailwind CSS'));
  assert.ok(profile.skills.includes('OpenAI API'));
  assert.ok(profile.skills.includes('Vercel'));
  assert.ok(job.tags.includes('Next.js'));
  assert.ok(job.tags.includes('Vue'));
  assert.ok(job.tags.includes('Tailwind CSS'));
  assert.ok(job.tags.includes('OpenAI API'));
  assert.ok(job.tags.includes('Vercel'));
});

test('recognizes analytics platform aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：陈旻
学校：复旦大学 统计学 本科
求职意向：商业分析实习
技能：Looker Studio、Metabase、GA4、SQL
项目经历：使用 Google Analytics 4 分析渠道转化，并用 Looker Studio 和 Metabase 搭建周报看板。`);
  const job = analyzeJobDescription({
    title: '商业分析实习生',
    city: '上海',
    description: '负责使用 Google Analytics、Looker 和 Metabase 监控增长漏斗，输出周度分析看板。',
  });

  assert.ok(profile.skills.includes('Looker'));
  assert.ok(profile.skills.includes('Metabase'));
  assert.ok(profile.skills.includes('Google Analytics'));
  assert.ok(job.tags.includes('Looker'));
  assert.ok(job.tags.includes('Metabase'));
  assert.ok(job.tags.includes('Google Analytics'));
});

test('recognizes modern product analytics and BI workspace aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：韩哲
学校：复旦大学 信息系统 本科
求职意向：增长分析实习
技能：Am plitude、Mix Panel、Apache Superset、Re dash、SQL
项目经历：使用 Am plitude 和 Mix Panel 分析新用户转化，在 Apache Superset 与 Re dash 中维护增长看板。`);
  const job = analyzeJobDescription({
    title: '增长分析实习生',
    city: '上海',
    description: '负责使用 Amplitude、Mixpanel、Superset、Redash 和 SQL 分析转化漏斗，并维护增长数据看板。',
  });

  assert.ok(profile.skills.includes('Amplitude'));
  assert.ok(profile.skills.includes('Mixpanel'));
  assert.ok(profile.skills.includes('Superset'));
  assert.ok(profile.skills.includes('Redash'));
  assert.ok(job.tags.includes('Amplitude'));
  assert.ok(job.tags.includes('Mixpanel'));
  assert.ok(job.tags.includes('Superset'));
  assert.ok(job.tags.includes('Redash'));
});

test('recognizes OCR-spaced frontend and experiment aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：陈果
学校：华东师范大学 软件工程 本科
求职意向：增长产品工程实习
技能：Java Script、Type Script、Node js、Next js、Open AI API、A B测试
项目经历：使用 Java Script 和 Next js 搭建增长实验平台，通过 Open AI API 生成活动文案，并用 A B测试验证转化效果。`);
  const job = analyzeJobDescription({
    title: '增长产品工程实习生',
    city: '上海',
    description: '负责 Java Script / Type Script 前端开发，使用 Node js、Next js 和 Open AI API 支撑实验平台，并持续推进 A B测试。',
  });

  assert.ok(profile.skills.includes('JavaScript'));
  assert.ok(profile.skills.includes('TypeScript'));
  assert.ok(profile.skills.includes('Node.js'));
  assert.ok(profile.skills.includes('Next.js'));
  assert.ok(profile.skills.includes('OpenAI API'));
  assert.ok(profile.skills.includes('A/B测试'));
  assert.ok(job.tags.includes('JavaScript'));
  assert.ok(job.tags.includes('TypeScript'));
  assert.ok(job.tags.includes('Node.js'));
  assert.ok(job.tags.includes('Next.js'));
  assert.ok(job.tags.includes('OpenAI API'));
  assert.ok(job.tags.includes('A/B测试'));
});

test('recognizes OCR-spaced analytics and ML aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：高晨
学校：同济大学 数据科学 本科
求职意向：数据智能实习
技能：PowerBI、Git Hub、Machine Learning、Deep Learning、Py Torch
项目经历：使用 PowerBI 搭建经营看板，在 Git Hub 维护实验代码，并基于 Machine Learning / Deep Learning 完成用户流失预测。`);
  const job = analyzeJobDescription({
    title: '数据智能实习生',
    city: '上海',
    description: '负责 Power BI 数据看板、GitHub 协作开发，并应用 Machine Learning、Deep Learning 与 PyTorch 完成建模分析。',
  });

  assert.ok(profile.skills.includes('Power BI'));
  assert.ok(profile.skills.includes('GitHub'));
  assert.ok(profile.skills.includes('机器学习'));
  assert.ok(profile.skills.includes('深度学习'));
  assert.ok(profile.skills.includes('PyTorch'));
  assert.ok(job.tags.includes('Power BI'));
  assert.ok(job.tags.includes('GitHub'));
  assert.ok(job.tags.includes('机器学习'));
  assert.ok(job.tags.includes('深度学习'));
  assert.ok(job.tags.includes('PyTorch'));
});

test('recognizes common data-stack aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：宋越
学校：复旦大学 数据科学 本科
求职意向：数据建模实习
技能：MySQL、Postgres、Pandas、NumPy、scikit-learn、TensorFlow
项目经历：使用 Pandas 和 NumPy 清洗经营数据，通过 scikit-learn 训练分类模型，并用 TensorFlow 完成深度学习实验。`);
  const job = analyzeJobDescription({
    title: '数据建模实习生',
    city: '上海',
    description: '要求熟悉 MySQL / PostgreSQL 查询，能使用 Pandas、NumPy、scikit-learn 和 TensorFlow 完成数据建模分析。',
  });

  assert.ok(profile.skills.includes('SQL'));
  assert.ok(profile.skills.includes('Python'));
  assert.ok(profile.skills.includes('机器学习'));
  assert.ok(profile.skills.includes('深度学习'));
  assert.ok(job.tags.includes('SQL'));
  assert.ok(job.tags.includes('Python'));
  assert.ok(job.tags.includes('机器学习'));
  assert.ok(job.tags.includes('深度学习'));
});

test('recognizes Excel feature aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：徐言
学校：上海财经大学 信息管理 本科
求职意向：经营分析实习
技能：Power Query、XLOOKUP、数据透视表
项目经历：使用 Power Query 清洗销售台账，通过 XLOOKUP 对齐渠道口径，并用数据透视表输出周报。`);
  const job = analyzeJobDescription({
    title: '经营分析实习生',
    city: '上海',
    description: '要求熟悉 Power Query、XLOOKUP 和数据透视表，能独立整理经营数据并产出周报。',
  });

  assert.ok(profile.skills.includes('Excel'));
  assert.ok(job.tags.includes('Excel'));
});

test('recognizes spaced and spelled-out AI platform aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：唐宁
学校：浙江大学 计算机科学 本科
求职意向：AI 平台工程实习
技能：Lang Chain、Retrieval Augmented Generation、PromptOps
项目经历：基于 Lang Chain 编排问答流程，结合 Retrieval Augmented Generation 构建校招知识库助手。`);
  const job = analyzeJobDescription({
    title: 'AI 平台工程实习生',
    city: '上海',
    description: '负责使用 Lang Chain、Retrieval Augmented Generation 和 PromptOps 搭建招聘知识库问答链路。',
  });

  assert.ok(profile.skills.includes('LangChain'));
  assert.ok(profile.skills.includes('RAG'));
  assert.ok(profile.skills.includes('Prompt Engineering'));
  assert.ok(job.tags.includes('LangChain'));
  assert.ok(job.tags.includes('RAG'));
  assert.ok(job.tags.includes('Prompt Engineering'));
});

test('recognizes common product collaboration tools in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：林岚
学校：华东师范大学 信息管理 本科
求职意向：产品运营实习
技能：Figma、Notion、Jira
项目经历：使用 Figma 绘制活动流程稿，在 Notion 维护实验周报，并通过 Jira 跟进需求流转。`);
  const job = analyzeJobDescription({
    title: '产品运营实习生',
    city: '上海',
    description: '需要熟悉 Figma、Notion 和 Jira，能支持活动方案协同、需求跟进与周报沉淀。',
  });

  assert.ok(profile.skills.includes('Figma'));
  assert.ok(profile.skills.includes('Notion'));
  assert.ok(profile.skills.includes('Jira'));
  assert.ok(job.tags.includes('Figma'));
  assert.ok(job.tags.includes('Notion'));
  assert.ok(job.tags.includes('Jira'));
});

test('recognizes OCR-spaced and Chinese collaboration tool aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：周澄
学校：暨南大学 市场营销 本科
求职意向：产品运营实习
技能：Fi gma、No tion、Ji ra、Con fluence、飞书
项目经历：使用 No tion 维护需求池，通过 Ji ra 跟进版本节奏，并在飞书同步项目进展。`);
  const job = analyzeJobDescription({
    title: '产品运营实习生',
    city: '上海',
    description: '负责使用 Figma、Notion、Jira Software、Confluence 和 Slack 支持需求协同、文档沉淀与跨团队沟通。',
  });

  assert.ok(profile.skills.includes('Figma'));
  assert.ok(profile.skills.includes('Notion'));
  assert.ok(profile.skills.includes('Jira'));
  assert.ok(profile.skills.includes('Confluence'));
  assert.ok(profile.skills.includes('Slack'));
  assert.ok(job.tags.includes('Figma'));
  assert.ok(job.tags.includes('Notion'));
  assert.ok(job.tags.includes('Jira'));
  assert.ok(job.tags.includes('Confluence'));
  assert.ok(job.tags.includes('Slack'));
});

test('recognizes modern collaboration workspace tools in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：沈遥
学校：同济大学 信息管理 本科
求职意向：产品运营实习
技能：Slack、Confluence、Asana、Trello
项目经历：使用 Slack 协调活动排期，在 Confluence 维护流程文档，通过 Asana 和 Trello 跟进需求与复盘任务。`);
  const job = analyzeJobDescription({
    title: '产品运营实习生',
    city: '上海',
    description: '需要熟悉 Slack、Confluence、Asana、Trello，能够支持跨团队沟通、文档沉淀与任务推进。',
  });

  assert.ok(profile.skills.includes('Slack'));
  assert.ok(profile.skills.includes('Confluence'));
  assert.ok(profile.skills.includes('Asana'));
  assert.ok(profile.skills.includes('Trello'));
  assert.ok(job.tags.includes('Slack'));
  assert.ok(job.tags.includes('Confluence'));
  assert.ok(job.tags.includes('Asana'));
  assert.ok(job.tags.includes('Trello'));
});

test('recognizes ops CRM and automation tools in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：顾闻
学校：上海大学 信息管理 本科
求职意向：增长运营实习
技能：Mi ro、Air table、Hub Spot、SFDC、Za pier、Integromat
项目经历：使用 Air table 维护活动台账，在 Hub Spot 和 SFDC 跟进线索状态，并通过 Za pier 与 Integromat 自动同步报名数据。`);
  const job = analyzeJobDescription({
    title: '增长运营实习生',
    city: '上海',
    description: '需要熟悉 Miro、Airtable、HubSpot、Sales Force、Zapier 和 Make，支持活动协作、线索流转与自动化数据同步。',
  });

  assert.ok(profile.skills.includes('Miro'));
  assert.ok(profile.skills.includes('Airtable'));
  assert.ok(profile.skills.includes('HubSpot'));
  assert.ok(profile.skills.includes('Salesforce'));
  assert.ok(profile.skills.includes('Zapier'));
  assert.ok(profile.skills.includes('Make'));
  assert.ok(job.tags.includes('Miro'));
  assert.ok(job.tags.includes('Airtable'));
  assert.ok(job.tags.includes('HubSpot'));
  assert.ok(job.tags.includes('Salesforce'));
  assert.ok(job.tags.includes('Zapier'));
  assert.ok(job.tags.includes('Make'));
});

test('recognizes newer AI workflow and automation aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：何舟
学校：同济大学 信息管理 本科
求职意向：AI 运营工具实习
技能：N 8 N、Di fy、Co ze、Open AI API
项目经历：使用 N 8 N 串联表单流转，通过 Di fy 和 Co ze 搭建校招问答助手，并接入 Open AI API 处理简历解析。`);
  const job = analyzeJobDescription({
    title: 'AI 运营工具实习生',
    city: '上海',
    description: '需要熟悉 n8n、Dify、扣子 Coze 和 OpenAI API，支持校招助手配置、线索自动化流转与提示词调试。',
  });

  assert.ok(profile.skills.includes('n8n'));
  assert.ok(profile.skills.includes('Dify'));
  assert.ok(profile.skills.includes('Coze'));
  assert.ok(profile.skills.includes('OpenAI API'));
  assert.ok(job.tags.includes('n8n'));
  assert.ok(job.tags.includes('Dify'));
  assert.ok(job.tags.includes('Coze'));
  assert.ok(job.tags.includes('OpenAI API'));
});

test('recognizes Microsoft collaboration workspace aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：林依
学校：华中科技大学 信息管理与信息系统 本科
求职意向：项目协作运营实习
技能：MS Teams、Share Point、Excel、文档写作
项目经历：使用 Microsoft Teams 组织跨部门周会，并通过 SharePoint 维护协作资料库和流程文档。`);
  const job = analyzeJobDescription({
    title: '项目协作运营实习生',
    city: '上海',
    description: '负责使用 Teams 和 Microsoft SharePoint 维护跨团队协作流程，整理 Excel 台账与文档。',
  });

  assert.ok(profile.skills.includes('Microsoft Teams'));
  assert.ok(profile.skills.includes('SharePoint'));
  assert.ok(job.tags.includes('Microsoft Teams'));
  assert.ok(job.tags.includes('SharePoint'));
});

test('recognizes ClickUp and Monday.com aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：郑可
学校：浙江大学 管理科学 本科
求职意向：项目运营实习
技能：Click Up、Mon day、Excel
项目经历：使用 Click-up 跟进需求排期，并在 Monday.com 维护团队任务看板。`);
  const job = analyzeJobDescription({
    title: '项目运营实习生',
    city: '上海',
    description: '需要熟悉 ClickUp 和 monday com，能维护任务看板、协调跨团队排期并更新 Excel 台账。',
  });

  assert.ok(profile.skills.includes('ClickUp'));
  assert.ok(profile.skills.includes('Monday.com'));
  assert.ok(job.tags.includes('ClickUp'));
  assert.ok(job.tags.includes('Monday.com'));
});

test('parses media resume text into compact profile tags instead of one long paragraph', () => {
  const profile = parseResumeText(`Werf基本资料实习经历电话：15779859005邮箱：2411049771@qq.com邓聖喆求职意向：影视媒体类方向姓后：邓聖喆籍贯：江西九江出生年月：2005-12-21学历：专科性别：男政治面貌：群众院校：江西生物科技职业学院专业：动漫媒体制作技术湖口县融媒体|实习记者2025年7月——9月|九江2020-2022主导多部短片/微电影创作：负责从创意策划、脚本撰写、分镜设计到现场拍摄后期剪辑调色的全过程。点赞传媒有限公司|短视频内容编导助理2025年4月——6月|南昌工作职责：独立负责短视频制作，全面参与公司抖音账号内容更新，脚本撰写，现场拍摄及后期剪辑调色。掌握技能影视制作：具备从策划、脚本、拍摄到剪辑调色的全流程能力和经验。摄影与后期：可独立完成人像，产品、纪实类拍摄及修图。设计软件：熟练使用 PR、PS、AE、达芬奇、剪映等设计后期软件。团队与执行：具有良好的团队协作意识和项目推进能力。`);

  assert.equal(profile.name, '邓聖喆');
  assert.equal(profile.gender, '男');
  assert.equal(profile.target, '影视媒体类方向');
  assert.ok(profile.headline.includes('江西生物科技职业学院'));
  assert.ok(profile.headline.includes('动漫媒体制作技术'));
  assert.ok(profile.skills.includes('PR'));
  assert.ok(profile.skills.includes('剪映'));
  assert.ok(profile.skills.includes('影视制作'));
  assert.ok(profile.softSkills.includes('项目推进'));
  assert.ok(profile.experiences.some((item) => item.includes('短视频内容编导助理')));
});

test('parses administration resume text into education, target, and office tags', () => {
  const profile = parseResumeText(`个人简历
姓 名: 景萍
毕业院校: 西华大学
专 业: 学前教育
景萍 求职意向：行政（综合管理）
性别：女
2022.09-2025.06 西华大学 学前教育（本科）
2023.10-至今 航空工业成都飞机工业（集团）有限责任公司 行政人员
协助公司管理制度的编写修订及执行落实；分厂人员工资日常考勤整理上报。人事工作的监督及主导人员招聘配置、培训、及薪资、福利管理；办公室日常管理。
技能证书｜Skills
计算机二级，文档写作能力，熟练掌握 OFFICE 办公软件。
自我评价｜About me
性格开朗，具有良好的服务意识和组织、沟通协调能力。`);

  assert.equal(profile.name, '景萍');
  assert.equal(profile.gender, '女');
  assert.equal(profile.target, '行政（综合管理）');
  assert.ok(profile.headline.includes('西华大学'));
  assert.ok(profile.headline.includes('学前教育'));
  assert.ok(profile.skills.includes('Office'));
  assert.ok(profile.skills.includes('文档写作'));
  assert.ok(profile.softSkills.includes('沟通协调'));
  assert.ok(profile.experiences.some((item) => item.includes('行政人员')));
});

test('recognizes common office-suite aliases in admin resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：林清
学校：华南师范大学
求职意向：HR 实习
技能：熟练使用 Word、PowerPoint、WPS，负责招聘台账和文档整理。`);
  const parsed = parseJobDescription('岗位要求：熟练使用 Microsoft Word、PowerPoint、WPS，支持招聘流程与文档整理。');

  assert.ok(profile.skills.includes('Office'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Office'));
});

test('recognizes OCR-spaced office-suite aliases in admin resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：谢宁
学校：华东政法大学
求职意向：行政支持实习
技能：熟练使用 W ord、Power Point、W P S，负责会议材料整理和招聘文档维护。`);
  const parsed = parseJobDescription('岗位要求：熟练使用 W ord、Power Point、W P S，支持会议纪要、台账维护和文档整理。');

  assert.ok(profile.skills.includes('Office'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Office'));
});

test('recognizes shorthand Microsoft 365 office-suite aliases in admin resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：罗颖
学校：西南财经大学
求职意向：行政运营实习
技能：熟练使用 M365、MS365，支持文档整理与台账维护。`);
  const parsed = parseJobDescription('岗位要求：熟练使用 M365 / MS365，配合会议纪要、招聘台账和行政支持。');

  assert.ok(profile.skills.includes('Office'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Office'));
});

test('recognizes full Microsoft 365 aliases in admin resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：孙璇
学校：华东师范大学
求职意向：行政支持实习
技能：熟练使用 Microsoft 365、office365 维护会议纪要和招聘台账。`);
  const parsed = parseJobDescription('岗位要求：熟练使用 Microsoft 365 / office365，支持文档整理、会议纪要和台账更新。');

  assert.ok(profile.skills.includes('Office'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Office'));
});

test('recognizes Outlook and Exchange scheduling aliases in admin resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：顾言
学校：上海大学
求职意向：行政支持实习
技能：熟练使用 Outlook Calendar、Exchange 和邮件排期，负责会议排期与邮箱管理。`);
  const parsed = parseJobDescription('岗位要求：熟悉 Microsoft Outlook、Outlook Calendar、Exchange，支持会议排期、邮箱管理和行政协同。');

  assert.ok(profile.skills.includes('Office'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Office'));
});

test('recognizes Google Workspace office-suite aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：苏禾
学校：华东师范大学
求职意向：行政实习
技能：Google Workspace、Google Docs、Google Sheets、谷歌幻灯片
项目经历：使用 Google Docs 和 Google Sheets 协助整理校园招聘材料。`);
  const parsed = parseJobDescription('岗位要求：熟悉 Google Workspace、Google Docs、Google Sheets 与 Google Slides，支持招聘文档协同与日常行政表格维护。');

  assert.ok(profile.skills.includes('Office'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Office'));
});

test('recognizes OCR-spaced Google Workspace aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：顾遥
学校：华东师范大学
求职意向：行政实习
技能：Google Work space、Google Doc s、Google Sheet s、Google Slide s
项目经历：使用 Google Doc s 和 Google Sheet s 协助维护招聘材料。`);
  const parsed = parseJobDescription('岗位要求：熟悉 Google Work space、Google Doc s、Google Sheet s 与 Google Slide s，支持招聘文档协同与表格更新。');

  assert.ok(profile.skills.includes('Office'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Office'));
});

test('recognizes Chinese online document-suite aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：祝楠
学校：华东理工大学
求职意向：招聘运营实习
技能：熟练使用 腾讯文档、石墨文档、金山文档 维护面试排期和招聘台账。`);
  const parsed = parseJobDescription('岗位要求：熟悉腾讯文档、石墨文档或金山文档，支持招聘流程协同、文档整理和台账更新。');

  assert.ok(profile.skills.includes('Office'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Office'));
});

test('recognizes Feishu and Lark document-suite aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：韩策
学校：上海师范大学
求职意向：招聘运营实习
技能：熟练使用 飞书文档、飞书表格 和 Lark Docs 维护招聘台账与面试排期。`);
  const parsed = parseJobDescription('岗位要求：熟悉飞书文档、Lark Sheets 或 Lark Docs，支持招聘协同与数据更新。');

  assert.ok(profile.skills.includes('Office'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Office'));
});

test('recognizes applicant tracking system aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：宋禾
学校：上海大学
求职意向：招聘运营实习
技能：Green house、Le ver、Moka
项目经历：使用 Green house 和 Le ver 跟进入库候选人，并在 Moka 维护面试流程。`);
  const parsed = parseJobDescription('岗位要求：熟悉 Greenhouse、Lever 或 Moka，支持候选人推进、面试排期和招聘流程协同。');

  assert.ok(profile.skills.includes('招聘'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === '招聘'));
});

test('recognizes common media-suite aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：周映
学校：中国传媒大学
求职意向：视频内容实习
技能：Premiere Pro、AfterEffects、Adobe Photoshop
项目经历：使用 Premiere Pro 剪辑校园宣传片，用 AfterEffects 制作字幕包装，并用 Adobe Photoshop 设计封面。`);
  const parsed = parseJobDescription('岗位要求：熟练使用 Premiere Pro、AfterEffects、Photoshop，支持短视频剪辑与包装设计。');

  assert.ok(profile.skills.includes('PR'));
  assert.ok(profile.skills.includes('AE'));
  assert.ok(profile.skills.includes('PS'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'PR'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'AE'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'PS'));
});

test('recognizes broader Adobe and video-editing aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：陆青
学校：中国传媒大学 动画 本科
求职意向：视觉设计实习
技能：Adobe Illustrator、InDesign、Lightroom、FCP
项目经历：使用 Adobe Illustrator 设计活动主视觉，用 InDesign 排版宣传册，通过 Lightroom 修图，并用 Final Cut Pro 剪辑采访视频。`);
  const parsed = parseJobDescription('岗位要求：熟练使用 illustrator、Adobe InDesign、Adobe Lightroom、Final Cut，支持品牌物料设计、修图和视频剪辑。');

  assert.ok(profile.skills.includes('Illustrator'));
  assert.ok(profile.skills.includes('InDesign'));
  assert.ok(profile.skills.includes('Lightroom'));
  assert.ok(profile.skills.includes('Final Cut Pro'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Illustrator'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'InDesign'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Lightroom'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Final Cut Pro'));
});

test('recognizes Canva and CapCut aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：林可
学校：浙江传媒学院
求职意向：内容设计实习
技能：Canva、CapCut、PS
项目经历：使用 Canva 设计活动海报，用 CapCut 剪辑校园短视频，并配合 Photoshop 完成封面物料。`);
  const parsed = parseJobDescription('岗位要求：熟练使用 canva、Cap Cut、Photoshop，支持社媒封面设计与短视频剪辑。');

  assert.ok(profile.skills.includes('Canva'));
  assert.ok(profile.skills.includes('剪映'));
  assert.ok(profile.skills.includes('PS'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Canva'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === '剪映'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'PS'));
});

test('recognizes common Excel aliases in resumes and JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：陈澄
学校：上海大学
求职意向：商业分析实习
技能：熟练使用 ms excel、micro soft excel 制作周报。`);
  const parsed = parseJobDescription('岗位要求：精通 excel，能独立搭建经营分析报表。');

  assert.ok(profile.skills.includes('Excel'));
  assert.ok(parsed.hardSkillRequirements.some((item) => item.name === 'Excel'));
});

test('prefers the highest recent education when PDF text contains several schools', () => {
  const profile = parseResumeText(`个人简历
姓名:景萍
毕业院校:四川文轩职业学院
专业:学前教育联系方式:18398206696
求职意向：行政
学校：四川文轩职业学院微信：2185009187生日：2000年11月
2020.09-2023.06四川文轩职业学院学前教育（专科）2021.09-2024.06西华大学学前教育（本科）
2023.10-至今航空工业成都飞机工业（集团）有限责任公司行政人员协助公司管理制度的编写修订及执行落实；分厂人员工资日常考勤整理上报。`);

  assert.ok(profile.headline.includes('西华大学'));
  assert.ok(profile.headline.includes('学前教育'));
  assert.ok(profile.headline.includes('本科'));
  assert.ok(!profile.headline.includes('联系方式'));
});

test('does not infer section titles as names and parses one-digit education dates', () => {
  const profile = parseResumeText(`专业赛事
教育经历2023.9-至今哈尔滨华德学院人力资源管理本科主修人力资源管理、组织行为学、劳动法、招聘与选拔等核心课程，系统掌握了人力资源管理
通财务有限公司人事实习生半职责范围:协助人力资源部门完成日常人事管理工作，包括员工档案整理、考勤统计及入职离职手续办理；参与公司招聘流程，负责简历初步筛选及面试邀约协调；独立完成10份员工档案电子化归档工作`);

  assert.equal(profile.name, '求职者');
  assert.ok(profile.headline.includes('哈尔滨华德学院'));
  assert.ok(profile.headline.includes('人力资源管理'));
  assert.ok(profile.headline.includes('本科'));
  assert.equal(profile.target, '求职意向待补充');
  assert.ok(profile.skills.includes('人事'));
  assert.ok(profile.skills.includes('招聘'));
  assert.ok(profile.experiences.some((item) => item.includes('人事实习生')));
  assert.ok(!profile.experiences.some((item) => item.includes('组织行为学')));
});

test('parses electrical engineering resume identity without falling back to account name', () => {
  const profile = parseResumeText(`个人简历
蒋纯
男 · 电气工程及其自动化
教育经历
哈尔滨华德学院 电气工程及其自动化 本科
求职意向待补充
经历证据
负责生产设备的日常巡检与维护，重点检查低压配电箱、变压器、电机运行状态，记录异常并协助师傅完成排查。
技能证书
电工基础、PLC 基础、Office`);
  const summary = buildResumeSummary(profile, []);

  assert.equal(profile.name, '蒋纯');
  assert.ok(profile.headline.includes('哈尔滨华德学院'));
  assert.ok(profile.headline.includes('电气工程及其自动化'));
  assert.equal(profile.target, '求职意向待补充');
  assert.equal(summary.name, '蒋纯');
  assert.match(summary.metaText, /男/);
  assert.match(summary.metaText, /电气工程及其自动化/);
});

test('keeps parsed experience evidence concise for compact resume cards', () => {
  const profile = parseResumeText(`个人简历
姓名:邓聖喆
求职意向：影视媒体类方向
性别：男
院校：江西生物科技职业学院
专业：动漫媒体制作技术湖口县融媒体|实习记者2025年7月——9月|九江2020-2022主导多部短片/微电影创作：负责从创意策划、脚本撰写、分镜设计到现场拍摄后期剪辑调色的全过程，成功与数名同学协作，按时交付成片。点赞传媒有限公司|短视频内容编导助理2025年4月——6月|南昌工作职责：独立负责短视频制作，全面参与公司抖音账号内容更新，脚本撰写，现场拍摄及后期剪辑调色。
掌握技能 设计软件：熟练使用 PR、PS、AE、达芬奇、剪映等设计后期软件。团队与执行：具有良好的团队协作意识和项目推进能力。`);

  assert.ok(profile.experiences.length >= 2);
  assert.ok(profile.experiences.every((item) => item.length <= 120));
  assert.ok(profile.experiences.every((item) => !item.includes('联系方式')));
  assert.ok(profile.experiences.every((item) => !item.includes('动漫媒体制作技术湖口县')));
  assert.ok(profile.experiences.some((item) => item.includes('短视频内容编导助理')));
});

test('filters self-introduction boilerplate out of parsed experience evidence', () => {
  const profile = parseResumeText(`个人简历
姓名:景萍
求职意向：行政
2023.10-至今航空工业成都飞机工业（集团）有限责任公司行政人员协助公司管理制度的编写修订及执行落实；分厂人员工资日常考勤整理上报。人事工作的监督及主导人员招聘配置、培训、及薪资、福利管理；办公室日常管理。
自荐信尊敬的领导：您好!根据自我的学习和实习经历，我有信心有本事做好这份工作，同时我也相信自我在以后的工作生活中能够切实的发扬团队精神。`);

  assert.ok(profile.experiences.some((item) => item.includes('行政人员')));
  assert.ok(profile.experiences.every((item) => !item.startsWith('至今')));
  assert.ok(profile.experiences.every((item) => !item.includes('我有信心')));
  assert.ok(profile.experiences.every((item) => !item.includes('自荐信')));
});

test('resume summary shows experience-like evidence instead of certificate fragments', () => {
  const summary = buildResumeSummary({
    name: '景萍',
    headline: '西华大学 学前教育 本科',
    target: '行政',
    skills: ['Office', '文档写作'],
    languages: [],
    softSkills: ['沟通协调'],
    experiences: [
      '航空工业成都飞机工业（集团）有限责任公司行政人员协助公司管理制度的编写修订及执行落实',
      '协助公司管理制度的编写修订及执行落实；分厂人员工资日常考勤整理上报',
      '培训 SYB 全国计算机等级证书，极具创意的广告策划',
    ],
  });

  assert.equal(summary.experiences.length, 1);
  assert.ok(summary.experiences[0].includes('行政人员'));
  assert.ok(summary.experiences.every((item) => item.length <= 96));
  assert.ok(!summary.experiences.some((item) => item.includes('SYB')));
});

test('builds a resume summary with short meta, submitted jobs, and tag groups', () => {
  const profile = parseResumeText(`个人简历
姓名：大卫德
个人信息：男
学校：慕尼黑工业大学 统计学 本科 2026届
求职意向：数据分析 / 产品运营
技能：SQL、Python、Tableau
语言与软技能
英语 CET-6，跨部门沟通、结构化表达`);
  const summary = buildResumeSummary(profile, ['数据分析实习生', '产品运营实习生']);

  assert.equal(summary.name, '大卫德');
  assert.equal(summary.metaText, '男 · 慕尼黑工业大学 · 统计学');
  assert.equal(summary.submittedText, '已提交：数据分析实习生、产品运营实习生');
  assert.deepEqual(summary.tagGroups[0], { label: '求职意向', tags: ['数据分析', '产品运营'] });
  assert.ok(summary.tagGroups.some((group) => group.label === '核心技能' && group.tags.includes('SQL')));
  assert.ok(!summary.metaText.includes('电话'));
  assert.ok(!summary.metaText.includes('邮箱'));
});

test('resume summary does not show a placeholder target as a real tag', () => {
  const summary = buildResumeSummary({
    name: '求职者',
    headline: '哈尔滨华德学院 人力资源管理 本科',
    target: '求职意向待补充',
    skills: ['人事', '招聘'],
    languages: [],
    softSkills: [],
    experiences: [],
  });

  assert.equal(summary.submittedText, '求职意向待补充');
  assert.ok(!summary.tagGroups.some((group) => group.label === '求职意向'));
});

test('keeps all seeded jobs inside the same company', () => {
  assert.equal(COMPANY.name, '大卫德科技');
  assert.ok(JOBS.length >= 4);
  assert.deepEqual(new Set(JOBS.map((job) => job.company)), new Set([COMPANY.name]));
});

test('uses the final demo branding in static pages', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const jobHtml = await readFile(new URL('../job.html', import.meta.url), 'utf8');

  assert.ok(indexHtml.includes('@大卫德哈哈哈'));
  assert.ok(indexHtml.includes('./assets/avatar-davide.jpeg'));
  assert.ok(indexHtml.includes('id="open-admin-modal"'));
  assert.ok(indexHtml.includes('id="admin-job-dialog"'));
  assert.ok(indexHtml.includes('id="login-form"'));
  assert.ok(indexHtml.includes('id="logout-button"'));
  assert.ok(indexHtml.includes('id="auth-role-label"'));
  assert.ok(!indexHtml.includes('求职者视角'));
  assert.ok(!indexHtml.includes('HR 视角'));
  assert.ok(!indexHtml.includes('学生视角'));
  assert.ok(!indexHtml.includes('管理员视角'));
  assert.match(indexHtml, />\s*demo\s*</);
  assert.ok(!indexHtml.includes('许家齐'));
  assert.ok(!indexHtml.includes('同公司多岗位 Demo'));
  assert.ok(jobHtml.includes('大卫德科技岗位招聘详情'));
  assert.ok(jobHtml.includes('大卫德科技校园招聘'));
  assert.ok(!jobHtml.includes('星河科技'));
});

test('defines a mobile-first dashboard reading flow', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.match(css, /@media \(max-width: 760px\)[\s\S]*body\.dashboard-page[\s\S]*overflow: auto/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.dashboard-page \.app-shell[\s\S]*height: auto/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.dashboard-page \.workspace[\s\S]*display: flex/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.student-workspace \.job-panel[\s\S]*order: 1/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.student-workspace \.profile-panel[\s\S]*order: 2/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.student-workspace \.insight-panel[\s\S]*order: 3/);
});

test('supports HR candidate resume and match review in static markup', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const adminSummaryIndex = indexHtml.indexOf('class="score-card admin-summary-card"');
  const submittedJobsIndex = indexHtml.indexOf('id="submitted-job-list"');
  const resumeIndex = indexHtml.indexOf('id="admin-resume-document"');

  assert.ok(indexHtml.includes('id="admin-resume-document"'));
  assert.ok(indexHtml.includes('id="admin-match-title"'));
  assert.ok(indexHtml.includes('id="admin-match-formula"'));
  assert.ok(indexHtml.includes('id="admin-match-breakdown"'));
  assert.ok(indexHtml.includes('id="potential-summary"'));
  assert.ok(indexHtml.includes('id="match-dashboard-list"'));
  assert.ok(indexHtml.includes('id="composite-list"'));
  assert.ok(indexHtml.includes('class="score-explainer"'));
  assert.ok(indexHtml.includes('id="confidence-panel"'));
  assert.ok(indexHtml.includes('id="confidence-chain"'));
  assert.ok(indexHtml.includes('id="evidence-jd"'));
  assert.ok(indexHtml.includes('id="team-complement-list"'));
  assert.ok(indexHtml.includes('id="interview-question-list"'));
  assert.ok(indexHtml.includes('候选人简历'));
  assert.ok(indexHtml.includes('匹配结果与评分'));
  assert.ok(indexHtml.includes('动态能力标签'));
  assert.ok(indexHtml.includes('面试提问建议'));
  assert.ok(appJs.includes('name: selectCandidateDisplayName(profile, candidate.name)'));
  assert.ok(!appJs.includes('seededCandidates'));
  assert.ok(submittedJobsIndex > adminSummaryIndex);
  assert.ok(resumeIndex > submittedJobsIndex);
});

test('starts resume parsing from an upload-first empty state', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.ok(indexHtml.includes('id="parse-status" role="status" aria-live="polite" aria-atomic="true"'));
  assert.ok(indexHtml.includes('id="resume-picker-button"'));
  assert.ok(indexHtml.includes('id="sample-resume-button"'));
  assert.ok(indexHtml.includes('id="selected-file-name"'));
  assert.ok(indexHtml.includes('class="resume-empty-state"'));
  assert.ok(indexHtml.includes('上传 PDF 简历'));
  assert.ok(indexHtml.includes('简历摘要'));
  assert.ok(!indexHtml.includes('简历原文'));
  assert.ok(!indexHtml.includes('<p class="eyebrow">示例简历</p>'));
  assert.ok(!appJs.includes('renderResumeDocument();\nbootstrapSession();'));
  assert.ok(appJs.includes('renderResumePlaceholder'));
  assert.ok(appJs.includes('renderResumeExtractionFallback'));
  assert.ok(appJs.includes('submitResumeText'));
  assert.ok(appJs.includes('repairProfileFromRawText(latestProfile, rawText)'));
  assert.ok(appJs.includes('repairProfileFromRawText(payload.resume.profile, rawText)'));
  assert.ok(appJs.includes('{ showExperiences: false }'));
  assert.ok(!appJs.includes("heading.textContent = '解析文本';"));
  assert.match(css, /\.resume-upload-card\s*\{/);
  assert.match(css, /\.native-file-input\s*\{/);
  assert.match(css, /\.resume-empty-state\s*\{/);
});

test('renders HR candidate raw resume text and account admin workspace', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.ok(indexHtml.includes('id="account-admin-workspace"'));
  assert.ok(indexHtml.includes('id="account-user-list"'));
  assert.ok(!indexHtml.includes('data-demo-email'));
  assert.ok(appJs.includes("state.mode = user.role === 'admin' ? 'account-admin'"));
  assert.ok(appJs.includes('candidate.rawText'));
  assert.ok(appJs.includes('renderAdminResume(candidate)'));
  assert.ok(appJs.includes('renderResumeDocumentFromText(candidate.rawText'));
  assert.ok(appJs.includes('refreshAccountUsers'));
});

test('keeps empty HR candidates empty and exposes resume download action', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.ok(appJs.includes("submitted.textContent = submittedJobs.length ? `已提交：${submittedJobs.join('、')}` : '尚未提交岗位';"));
  assert.ok(appJs.includes('elements.adminCandidateStatus.textContent = candidate.matchSummary'));
  assert.ok(appJs.includes('parseResumeText(rawText)'));
  assert.ok(appJs.includes('formatSafeResumeMeta'));
  assert.ok(!appJs.includes("meta.textContent = `${candidate.profile.gender ?? '未填写'} · ${candidate.school} · ${candidate.major}`;"));
  assert.ok(!appJs.includes("submittedJobIds: submittedJobIds.length ? submittedJobIds : ['data-analyst-intern']"));
  assert.ok(appJs.includes('candidate.resumeDownloadUrl'));
  assert.ok(appJs.includes('下载原简历'));
  assert.ok(appJs.includes('暂无候选人提交简历。'));
  assert.ok(html.includes('id="candidate-count" aria-live="polite"'));
  assert.ok(html.includes('id="admin-candidate-status" class="admin-status-pill" role="status" aria-live="polite"'));
  assert.match(css, /\.admin-resume-download\s*\{/);
});

test('surfaces a quick fit summary in HR candidate cards and status copy', async () => {
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const matcherJs = await readFile(new URL('../src/matcher.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.ok(appJs.includes('buildAdminCandidateInsight'));
  assert.ok(appJs.includes('buildCandidateMatchSummary'));
  assert.ok(appJs.includes('candidate.matchSummary'));
  assert.ok(appJs.includes('buildCandidateFitHighlights'));
  assert.ok(appJs.includes('buildHrCandidateQueueSummary'));
  assert.ok(appJs.includes('resolveHrCandidateSelection'));
  assert.ok(appJs.includes('candidate-fit-tags'));
  assert.ok(appJs.includes('candidate-match-summary'));
  assert.ok(appJs.includes("name.id = `candidate-name-${candidate.id}`;"));
  assert.ok(appJs.includes("submitted.id = `candidate-submitted-${candidate.id}`;"));
  assert.ok(appJs.includes("button.setAttribute('aria-labelledby', name.id)"));
  assert.ok(appJs.includes("button.setAttribute('aria-describedby', [submitted.id, matchSummary.id, resumeSignals.id, fitHighlights.id].join(' '))"));
  assert.ok(appJs.includes("matchSummary.id = `candidate-match-summary-${candidate.id}`;"));
  assert.ok(appJs.includes("fitHighlights.id = `candidate-fit-highlights-${candidate.id}`;"));
  assert.ok(matcherJs.includes('最佳已投'));
  assert.ok(matcherJs.includes('推荐转看'));
  assert.ok(appJs.includes('elements.adminCandidateStatus.textContent = candidate.matchSummary'));
  assert.ok(appJs.includes("button.setAttribute('aria-pressed', String(candidate.id === state.selectedCandidateId))"));
  assert.ok(appJs.includes("button.setAttribute('aria-expanded', String(candidate.id === state.selectedCandidateId))"));
  assert.ok(appJs.includes("button.setAttribute('aria-controls', 'admin-candidate-panel')"));
  assert.ok(html.includes('id="admin-candidate-panel"'));
  assert.ok(html.includes('aria-labelledby="admin-candidate-name"'));
  assert.ok(html.includes('id="admin-candidate-highlights"'));
  assert.match(css, /\.candidate-match-summary\s*\{/);
  assert.match(css, /\.candidate-fit-tags\s*\{/);
  assert.match(css, /\.fit-chip\.gap\s*\{/);
});

test('removes duplicate workflow and low-value advice cards from student view', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.ok(!indexHtml.includes('workflow-card'));
  assert.ok(!indexHtml.includes('workflow-best-fit'));
  assert.ok(!indexHtml.includes('workflow-steps'));
  assert.ok(!indexHtml.includes('匹配流程'));
  assert.ok(!indexHtml.includes('下一步动作'));
  assert.ok(!indexHtml.includes('求职建议报告'));
  assert.ok(!indexHtml.includes('final-report'));
});

test('separates student progress guidance from the job selector', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const workflowIndex = indexHtml.indexOf('id="workflow-checklist"');
  const dashboardIndex = indexHtml.indexOf('id="match-dashboard-list"');
  const priorityIndex = indexHtml.indexOf('id="priority-action-panel"');
  const explainerIndex = indexHtml.indexOf('class="score-explainer"');

  assert.ok(workflowIndex > -1);
  assert.ok(dashboardIndex > workflowIndex);
  assert.ok(priorityIndex > -1);
  assert.ok(explainerIndex > priorityIndex);
  assert.ok(!indexHtml.includes('<h2>快速切换</h2>'));
  assert.ok(appJs.includes('renderWorkflowChecklist()'));
  assert.ok(appJs.includes('renderPriorityActionPanel(selectedJob, analysis, advice)'));
  assert.match(css, /\.workflow-checklist\s*\{/);
  assert.match(css, /\.priority-action-panel\s*\{/);
});

test('connects student job applications to the score workspace and HR queue', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.ok(indexHtml.includes('id="application-action"'));
  assert.ok(indexHtml.indexOf('id="application-action"') > indexHtml.indexOf('id="score-ring"'));
  assert.ok(appJs.includes("apiRequest('/api/applications'"));
  assert.ok(appJs.includes("method: 'DELETE'"));
  assert.ok(appJs.includes('refreshStudentApplications'));
  assert.ok(appJs.includes('getApplicationForJob(analysis.job.id)'));
  assert.ok(appJs.includes("level.classList.add('applied')"));
  assert.ok(appJs.includes("title.textContent = '已投递给 HR'"));
  assert.ok(appJs.includes("button.textContent = isPending ?"));
  assert.match(css, /\.application-action\s*\{/);
  assert.match(css, /\.job-level\.applied\s*\{/);
});

test('keeps the student profile ordered like a resume summary', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const skillIndex = indexHtml.indexOf('<h3>核心技能</h3>');
  const potentialIndex = indexHtml.indexOf('<h3>动态能力标签</h3>');
  const preferenceIndex = indexHtml.indexOf('<h3>求职偏好</h3>');
  const languageIndex = indexHtml.indexOf('<h3>语言能力</h3>');
  const softSkillIndex = indexHtml.indexOf('<h3>软技能</h3>');

  assert.ok(skillIndex > -1);
  assert.ok(potentialIndex > skillIndex);
  assert.ok(preferenceIndex > potentialIndex);
  assert.ok(languageIndex > preferenceIndex);
  assert.ok(softSkillIndex > languageIndex);
  assert.ok(!indexHtml.includes('技能标签'));
  assert.ok(!indexHtml.includes('id="match-heatmap"'));
  assert.ok(!indexHtml.includes('id="reason-list"'));
  assert.ok(!indexHtml.includes('id="gap-list"'));
});

test('places score explanation directly under the main score summary', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const scoreSummaryIndex = indexHtml.indexOf('class="score-summary-row"');
  const scoreRingIndex = indexHtml.indexOf('id="score-ring"');
  const explainerIndex = indexHtml.indexOf('class="score-explainer"');
  const skillDetailIndex = indexHtml.indexOf('id="skill-detail-list"');

  assert.ok(scoreSummaryIndex > -1);
  assert.ok(scoreRingIndex > scoreSummaryIndex);
  assert.ok(explainerIndex > scoreRingIndex);
  assert.ok(skillDetailIndex > explainerIndex);
});

test('tightens repeated tag blocks and job detail spacing', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.match(css, /\.resume-section\s*\{[\s\S]*gap: 6px/);
  assert.ok(!appJs.includes('resume-skill-row'));
  assert.match(css, /\.profile-meta-grid\s*\+\s*\.profile-block\s*\{[\s\S]*margin-top: 18px/);
  assert.match(css, /a\.admin-job-item\s*\{[\s\S]*display: grid[\s\S]*gap: 10px/);
  assert.match(css, /\.job-detail-main\s*>\s*\.section-heading\.compact\s*\{[\s\S]*margin-bottom: 0/);
  assert.match(css, /\.score-explainer\s*\{/);
  assert.match(css, /\.evidence-link-panel\s*\{/);
  assert.match(css, /\.match-dashboard\s*\{/);
  assert.match(css, /\.job-signal-strip\s*\{/);
  assert.match(css, /\.dashboard-score-ring\s*\{[\s\S]*conic-gradient/);
  assert.match(css, /\.confidence-chain-item\.high \.confidence-dot\s*\{/);
  assert.match(css, /@keyframes workspaceFade/);
  assert.match(css, /@keyframes scoreBump/);
  assert.match(css, /@keyframes hlPulse/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.skill-detail-fields \.confidence-field\s*\{[\s\S]*display: flex/);
  assert.match(css, /\.team-gap\.matched\s*\{/);
  assert.match(css, /\.interview-question-item\s*\{/);
  assert.ok(!css.includes('.heatmap-cell {'));
});

test('keeps primary controls visible across pointer and keyboard states', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.match(css, /\.primary-button:hover:not\(:disabled\)/);
  assert.match(css, /\.secondary-button:hover:not\(:disabled\)/);
  assert.match(css, /\.primary-button:focus-visible,[\s\S]*outline-offset: 2px/);
  assert.match(css, /\.primary-button:active:not\(:disabled\)/);
  assert.match(css, /input::placeholder,[\s\S]*opacity: 1/);
});

test('grounds every seeded job in a complete job description', () => {
  assert.ok(JOBS.every((job) => job.description.length > 80));
  assert.ok(JOBS.every((job) => job.tags.length >= 4));
  assert.ok(JOBS.every((job) => job.salary));
  assert.ok(JOBS.every((job) => job.softSkills.length >= 2));
  assert.ok(JOBS.every((job) => job.languageRequirements.length >= 1));
  assert.ok(JOBS.every((job) => job.description.includes(job.tags[0])));
});

test('builds stable company job detail links for every seeded job', () => {
  const links = JOBS.map((job) => buildJobDetailUrl(job.id));

  assert.ok(links.every((link) => link.startsWith('./job.html?id=')));
  assert.ok(links.some((link) => link.includes('data-analyst-intern')));
  assert.equal(new Set(links).size, JOBS.length);
});

test('separates job card selection from company detail navigation', async () => {
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.ok(appJs.includes("const card = document.createElement('article');"));
  assert.ok(appJs.includes('function selectStudentJob(jobId)'));
  assert.ok(appJs.includes('state.selectedJobId = jobId;'));
  assert.ok(appJs.includes('renderMatchDashboard();'));
  assert.ok(appJs.includes('detailLink.href = buildJobDetailUrl(analysis.job.id);'));
  assert.ok(appJs.includes("detailLink.addEventListener('click', (event) => {"));
  assert.ok(appJs.includes('event.stopPropagation();'));
  assert.ok(!appJs.includes("const link = document.createElement('a');\n  link.className = analysis.job.id === state.selectedJobId ? 'job-card active' : 'job-card';"));
});

test('wires evidence highlighting and confidence-chain interactions', async () => {
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.ok(appJs.includes('document.createTreeWalker'));
  assert.ok(appJs.includes('hl-target'));
  assert.ok(appJs.includes('scrollIntoView'));
  assert.ok(appJs.includes('highlightEvidenceFocus(focus)'));
  assert.ok(appJs.includes('confidence-chain-item'));
  assert.ok(appJs.includes('node.title = item.confidenceReason;'));
  assert.ok(appJs.includes("elements.scoreRing.classList.add('score-bump')"));
});

test('finds a job by id with parsed JD fields preserved', () => {
  const job = findJobById('data-analyst-intern', JOBS);

  assert.equal(job.title, '数据分析实习生');
  assert.equal(job.salary, '220-280元/天');
  assert.ok(job.hardSkillRequirements.some((item) => item.name === 'SQL' && item.requiredLevel === '高级'));
  assert.ok(job.softSkills.includes('跨部门沟通'));
});

test('matches remote and online city aliases as remote-friendly preferences', () => {
  const profile = parseResumeText(`个人简历
姓名：程远
学校：浙江大学 计算机科学 本科
求职意向：AI 应用开发实习
城市偏好：线上 / 可远程
技能：Python、RAG`);
  const remoteJob = analyzeJobDescription({
    title: 'AI 应用开发实习生',
    city: '全国远程',
    description: '远程协作，使用 Python 和 RAG 开发求职匹配智能体。',
  });
  const breakdown = getScoreBreakdown(profile, remoteJob);
  const city = breakdown.find((item) => item.label === '地点匹配');

  assert.ok(profile.cityPreferences.includes('远程'));
  assert.equal(city.points, 10);
  assert.match(city.detail, /远程/);
});

test('matches hybrid city labels for either onsite or remote-friendly candidates', () => {
  const onsiteProfile = parseResumeText(`个人简历
姓名：林桥
学校：同济大学 软件工程 本科
城市偏好：上海
技能：JavaScript、React`);
  const remoteProfile = parseResumeText(`个人简历
姓名：周岚
学校：华东师范大学 数据科学 本科
城市偏好：可远程
技能：SQL、Python`);
  const hybridJob = analyzeJobDescription({
    title: 'AI 产品工程实习生',
    city: '',
    description: '工作地点：上海，可远程协作。负责 React 前端开发与 Python 数据处理。',
  });

  const onsiteCity = getScoreBreakdown(onsiteProfile, hybridJob).find((item) => item.label === '地点匹配');
  const remoteCity = getScoreBreakdown(remoteProfile, hybridJob).find((item) => item.label === '地点匹配');

  assert.equal(hybridJob.city, '上海/远程');
  assert.equal(onsiteCity.points, 10);
  assert.equal(remoteCity.points, 10);
  assert.match(onsiteCity.detail, /上海\/远程/);
});

test('treats WFH-style wording as a remote preference in resumes and admin JDs', () => {
  const profile = parseResumeText(`个人简历
姓名：许岚
学校：华东师范大学 数据科学 本科
城市偏好：WFH / 居家办公
技能：Python、SQL`);
  const remoteJob = analyzeJobDescription({
    title: '数据策略实习生',
    city: '',
    description: 'Base：work from home。负责 SQL 数据分析与 Python 报表自动化。',
  });
  const city = getScoreBreakdown(profile, remoteJob).find((item) => item.label === '地点匹配');

  assert.ok(profile.cityPreferences.includes('远程'));
  assert.equal(remoteJob.city, '远程');
  assert.equal(city.points, 10);
});

test('parses JD text into compensation, hard skills, soft skills, and language requirements', () => {
  const parsed = parseJobDescription(JOBS[0].description);
  const sql = parsed.hardSkillRequirements.find((item) => item.name === 'SQL');

  assert.equal(parsed.salary, '220-280元/天');
  assert.equal(sql.requiredLevel, '高级');
  assert.ok(parsed.redLines.some((item) => item.name === 'SQL'));
  assert.ok(parsed.compositeCapabilities.some((item) => item.name === '数据驱动增长'));
  assert.ok(parsed.implicitRequirements.includes('数据驱动增长'));
  assert.ok(parsed.softSkills.includes('跨部门沟通'));
  assert.ok(parsed.languageRequirements.includes('英语 CET-6'));
});

test('parses monthly salary ranges with bonus-month suffixes from admin JDs', () => {
  const parsed = parseJobDescription('薪资：15 - 20 K/月 · 14薪；负责 SQL 看板与用户分析。');
  const job = analyzeJobDescription({
    title: '商业分析实习生',
    city: '上海',
    description: '薪酬: 15 - 20 K/月 · 14薪；要求 SQL、Excel，支持业务复盘。',
  });

  assert.equal(parsed.salary, '15-20K/月·14薪');
  assert.equal(job.salary, '15-20K/月·14薪');
});

test('parses bonus-month salary suffixes written with multiplication symbols', () => {
  const parsed = parseJobDescription('薪资：15 - 20 K/月 * 14薪；负责 SQL 看板与用户分析。');
  const job = analyzeJobDescription({
    title: '商业分析实习生',
    city: '上海',
    description: '薪酬: 18 - 22 K/月 × 13薪；要求 SQL、Excel，支持经营分析与周报复盘。',
  });

  assert.equal(parsed.salary, '15-20K/月·14薪');
  assert.equal(job.salary, '18-22K/月·13薪');
});

test('parses annual salary ranges from admin JDs', () => {
  const parsed = parseJobDescription('薪酬：20 - 30 万/年，负责商业分析报表与管理层复盘。');
  const job = analyzeJobDescription({
    title: '商业分析实习生',
    city: '上海',
    description: '薪资：20 - 30 万/年，要求 SQL、Excel，支持经营分析与周报复盘。',
  });

  assert.equal(parsed.salary, '20-30万/年');
  assert.equal(job.salary, '20-30万/年');
});

test('parses comprehensive monthly salary formats from admin JDs', () => {
  const parsed = parseJobDescription('综合薪资：1.5 - 2 万/月，负责招聘数据整理与流程跟进。');
  const job = analyzeJobDescription({
    title: 'HR 运营实习生',
    city: '上海',
    description: '薪资待遇: 8000 - 12000 元/月，要求 Office、文档写作和招聘协作。',
  });

  assert.equal(parsed.salary, '1.5-2万/月');
  assert.equal(job.salary, '8000-12000元/月');
});

test('parses K-style salary ranges when each bound repeats the unit or currency symbol', () => {
  const parsed = parseJobDescription('薪资：¥15K - ¥20K/月，负责经营分析和周报复盘。');
  const job = analyzeJobDescription({
    title: '商业分析实习生',
    city: '上海',
    description: '薪酬：￥18K-￥22K/月 · 13薪，要求 SQL、Excel，支持业务复盘。',
  });

  assert.equal(parsed.salary, '15K-20K/月');
  assert.equal(job.salary, '18K-22K/月·13薪');
});

test('infers admin-added job city from JD text when the city field is empty', () => {
  const job = analyzeJobDescription({
    title: 'AI 产品实习生',
    city: '',
    description: '工作地点：深圳。负责 AI 求职智能体需求分析，使用 SQL 复盘用户转化。',
  });
  const remoteJob = analyzeJobDescription({
    title: '远程增长运营实习生',
    city: '',
    description: '地点：可远程。负责用户增长活动复盘，使用 SQL 分析转化漏斗。',
  });

  assert.equal(job.city, '深圳');
  assert.equal(remoteJob.city, '远程');
});

test('builds potential, composite capability, and heatmap outputs', () => {
  const targetJob = JOBS.find((job) => job.id === 'data-analyst-intern');
  const potential = buildPotentialAnalysis(STUDENT_PROFILE);
  const composites = buildCompositeCapabilityDetails(STUDENT_PROFILE, targetJob);
  const heatmap = buildMatchHeatmap(STUDENT_PROFILE, targetJob);

  assert.ok(potential.score >= 70);
  assert.ok(potential.signals.length >= 3);
  assert.ok(composites.some((item) => item.name === '数据驱动增长' && item.matched));
  assert.equal(heatmap.length, 6);
  assert.ok(heatmap.every((item) => item.intensity >= 0 && item.intensity <= 100));
  assert.ok(heatmap.every((item) => !item.level.includes('待补')));
});

test('runs evidence confidence shadow checks and evidence trace linking', () => {
  const targetJob = JOBS.find((job) => job.id === 'data-analyst-intern');
  const shallowProfile = {
    name: '标签型候选人',
    skills: ['SQL'],
    experiences: [],
    cityPreferences: ['上海'],
    languages: [],
    softSkills: [],
    interests: [],
  };
  const summary = buildEvidenceConfidenceSummary(shallowProfile, targetJob);
  const sql = summary.details.find((item) => item.name === 'SQL');
  const trace = buildEvidenceTrace(STUDENT_PROFILE, targetJob, 'SQL');

  assert.ok(summary.adjustedItems.some((item) => item.name === 'SQL'));
  assert.ok(sql.score < sql.baseScore);
  assert.ok(sql.confidenceReason.includes('评分已适度下调'));
  assert.ok(!summary.summary.includes('影子校验'));
  assert.ok(trace.jdText.includes('SQL'));
  assert.ok(trace.resumeText.includes('SQL'));
});

test('builds HR team complement, cross-role recommendations, and interview questions', () => {
  const candidate = CANDIDATES.find((item) => item.id === 'davide');
  const targetJob = JOBS.find((job) => job.id === 'data-analyst-intern');
  const complement = buildTeamComplement(candidate);
  const recommendations = buildCrossRoleRecommendations(candidate, JOBS);
  const questions = buildInterviewQuestions(candidate, targetJob);

  assert.ok(complement.score > 0);
  assert.ok(complement.matchedGaps.length >= 1);
  assert.ok(recommendations.length >= 1);
  assert.ok(recommendations[0].reason.includes('跨界依据'));
  assert.ok(questions.length >= 1);
  assert.ok(questions[0].question.includes('请'));
});

test('analyzes an admin-added job description into required capabilities', () => {
  const job = analyzeJobDescription({
    title: '增长运营实习生',
    city: '上海',
    description:
      '负责用户增长活动复盘，使用 SQL 分析转化漏斗，完成用户分层和 A/B测试，沉淀数据看板。',
  });

  assert.equal(job.company, COMPANY.name);
  assert.ok(job.tags.includes('SQL'));
  assert.ok(job.tags.includes('用户分层'));
  assert.ok(job.tags.includes('A/B测试'));
  assert.ok(job.responsibilities.includes('用户增长'));
});

test('breaks the match score into explainable dimensions', () => {
  const targetJob = JOBS.find((job) => job.id === 'data-analyst-intern');
  const analysis = analyzeJobFit(STUDENT_PROFILE, targetJob);
  const breakdown = getScoreBreakdown(STUDENT_PROFILE, targetJob);
  const total = breakdown.reduce((sum, item) => sum + item.points, 0);
  const softSkill = breakdown.find((item) => item.label === '软技能匹配');
  const language = breakdown.find((item) => item.label === '语言要求');

  assert.equal(total, analysis.score);
  assert.deepEqual(
    breakdown.map((item) => item.label),
    ['硬技能匹配', '软技能匹配', '语言要求', '经历证据', '地点匹配', '兴趣方向'],
  );
  assert.ok(softSkill.points > 0);
  assert.equal(language.points, 5);
  assert.equal(language.max, 5);
  assert.ok(breakdown.every((item) => item.points <= item.max));
});

test('explains individual skill scoring with JD requirement and resume evidence', () => {
  const targetJob = JOBS.find((job) => job.id === 'data-analyst-intern');
  const details = getSkillMatchDetails(STUDENT_PROFILE, targetJob);
  const explanation = buildScoreExplanation(STUDENT_PROFILE, targetJob);
  const sql = details.find((item) => item.name === 'SQL');
  const python = details.find((item) => item.name === 'Python');
  const tableau = details.find((item) => item.name === 'Tableau');

  assert.equal(sql.jdRequirement, '高级');
  assert.equal(sql.resumeLevel, '中级');
  assert.equal(sql.score, 8);
  assert.equal(python.resumeLevel, '高级');
  assert.equal(python.score, 10);
  assert.ok(tableau.resumeEvidence.includes('定位到'));
  assert.ok(tableau.sourceText.includes('技能区'));
  assert.ok(tableau.sourceText.includes('项目/经历'));
  assert.ok(explanation.formula.includes('硬技能匹配'));
  assert.ok(explanation.formula.includes('软技能匹配'));
  assert.ok(!explanation.formula.includes('/50'));
  assert.ok(!explanation.formula.includes('/10'));
  assert.equal(explanation.skillDetails.length, targetJob.tags.length);
});

test('uses gentler match language without weak-evidence wording', () => {
  const targetJob = JOBS.find((job) => job.id === 'data-analyst-intern');
  const analysis = analyzeJobFit(STUDENT_PROFILE, targetJob);
  const explanation = buildScoreExplanation(STUDENT_PROFILE, targetJob);
  const combinedText = [
    ...analysis.reasons,
    ...explanation.breakdown.map((item) => item.detail),
  ].join(' ');

  assert.ok(!combinedText.includes('证据较弱'));
  assert.ok(!combinedText.includes('证据不足'));
  assert.ok(!combinedText.includes('分项证据 50/50'));
  assert.ok(!combinedText.includes('满足 英语 CET-6'));
  assert.ok(!combinedText.includes('CET-6'));
});

test('keeps language requirements out of compact job summary metadata', async () => {
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');

  assert.ok(appJs.includes('elements.selectedJobMeta.textContent = `${selectedJob.city} · ${selectedJob.salary}`;'));
  assert.ok(!appJs.includes('selectedJobMeta.textContent = `${selectedJob.city} · ${selectedJob.salary} ·'));
});

test('explains soft skill matches with resume and activity evidence', () => {
  const targetJob = JOBS.find((job) => job.id === 'product-ops-intern');
  const details = buildSoftSkillMatchDetails(STUDENT_PROFILE, targetJob);
  const communication = details.find((item) => item.name === '跨部门沟通');
  const projectPush = details.find((item) => item.name === '项目推进');

  assert.equal(communication.matched, true);
  assert.ok(communication.resumeEvidence.includes('软技能区'));
  assert.equal(projectPush.matched, true);
  assert.ok(projectPush.resumeEvidence.includes('组织 4 场数据分析工作坊'));
  assert.ok(projectPush.resumeEvidence.includes('活动经历加分'));
});

test('summarizes the student-facing AI workflow from parsed resume and JD data', () => {
  const summary = buildStudentWorkflowSummary(STUDENT_PROFILE, JOBS);

  assert.equal(summary.steps.length, 3);
  assert.ok(summary.steps[0].value.includes(`${STUDENT_PROFILE.skills.length}`));
  assert.ok(summary.steps[1].value.includes(`${JOBS.length}`));
  assert.ok(summary.steps[2].value.includes('硬技能'));
  assert.ok(summary.bestFit.includes('数据分析实习生'));
});

test('keeps the company job detail page free of candidate scoring content', async () => {
  const html = await readFile(new URL('../job.html', import.meta.url), 'utf8');
  const productSystemWord = ['系', '统'].join('');

  assert.ok(!html.includes('简历分析'));
  assert.ok(!html.includes('简历画像'));
  assert.ok(!html.includes('匹配分'));
  assert.ok(!html.includes('detail-score-ring'));
  assert.ok(!html.includes('detail-student-name'));
  assert.ok(!html.includes('AI 求职智能匹配智能体'));
  assert.ok(!html.includes(productSystemWord));
  assert.ok(!html.includes('JD 分析'));
  assert.ok(!html.includes('detail-jd-analysis'));
});

test('builds tailored resume snippets for different target roles', () => {
  const dataJob = JOBS.find((job) => job.id === 'data-analyst-intern');
  const productJob = JOBS.find((job) => job.id === 'product-ops-intern');
  const dataSnippet = buildTailoredResumeSnippet(STUDENT_PROFILE, dataJob);
  const productSnippet = buildTailoredResumeSnippet(STUDENT_PROFILE, productJob);

  assert.ok(dataSnippet.includes('转化漏斗'));
  assert.ok(dataSnippet.includes('Tableau'));
  assert.ok(productSnippet.includes('问卷'));
  assert.ok(productSnippet.includes('活动复盘'));
  assert.notEqual(dataSnippet, productSnippet);
});

test('builds recruiter-facing candidate routing insights', () => {
  const candidate = CANDIDATES.find((item) => item.id === 'davide');
  const insight = buildAdminCandidateInsight(candidate, JOBS);
  const combinedText = [
    insight.screeningRecommendation,
    insight.routingRecommendation,
    ...insight.submittedJobs.map((item) => item.title),
    ...insight.suggestedJobs.map((item) => item.title),
  ].join(' ');

  assert.ok(insight.submittedJobs.length >= 2);
  assert.ok(insight.suggestedJobs.length >= 1);
  assert.ok(insight.screeningRecommendation.includes('初筛'));
  assert.ok(combinedText.includes('数据分析实习生'));
  assert.ok(!combinedText.includes('优先投递'));
  assert.ok(!combinedText.includes('简历优化'));
});

test('builds recruiter-facing screening guidance for upload-only high-potential resumes', () => {
  const candidate = {
    ...CANDIDATES.find((item) => item.id === 'davide'),
    id: 'upload-only-high-potential-guidance',
    submittedJobIds: [],
  };
  const insight = buildAdminCandidateInsight(candidate, JOBS);

  assert.equal(insight.submittedJobs.length, 0);
  assert.ok(insight.suggestedJobs.length > 0);
  assert.match(insight.screeningRecommendation, /建议联系候选人补投递/);
  assert.match(insight.screeningRecommendation, /数据分析实习生/);
});

test('sorts HR candidates by strongest submitted fit for review order', () => {
  const ordered = sortHrCandidatesForReview(CANDIDATES, JOBS);

  assert.deepEqual(
    ordered.map((item) => item.id),
    ['li-ruohan', 'davide', 'wang-ziang'],
  );
});

test('keeps submitted candidates ahead of upload-only resumes in HR review order', () => {
  const uploadOnly = {
    ...CANDIDATES.find((item) => item.id === 'davide'),
    id: 'upload-only-top-match',
    name: '高匹配待投递',
    submittedJobIds: [],
  };
  const submitted = {
    ...CANDIDATES.find((item) => item.id === 'wang-ziang'),
    id: 'submitted-lower-match',
    name: '已投递候选人',
    submittedJobIds: ['hr-generalist-intern'],
  };

  const ordered = sortHrCandidatesForReview([uploadOnly, submitted], JOBS);

  assert.deepEqual(
    ordered.map((item) => item.id),
    ['submitted-lower-match', 'upload-only-top-match'],
  );
});

test('preserves the selected HR candidate when refreshed data still contains them', () => {
  const ordered = sortHrCandidatesForReview(CANDIDATES, JOBS);

  assert.equal(resolveHrCandidateSelection(ordered, 'davide'), 'davide');
  assert.equal(resolveHrCandidateSelection(ordered, 'missing-id'), ordered[0].id);
  assert.equal(resolveHrCandidateSelection([], 'davide'), '');
});

test('summarizes the HR review queue by submitted and upload-only candidates', () => {
  assert.equal(buildHrCandidateQueueSummary([]), '0 人');
  assert.equal(buildHrCandidateQueueSummary(CANDIDATES), '3 人 · 已投递 3 · 高匹配 2');

  const mixed = [
    ...CANDIDATES,
    {
      ...CANDIDATES[0],
      id: 'upload-only',
      submittedJobIds: [],
    },
  ];
  assert.equal(buildHrCandidateQueueSummary(mixed), '4 人 · 已投递 3 · 高匹配 2 · 待分流 1 · 高潜待分流 1');
  assert.equal(
    buildHrCandidateQueueSummary(
      mixed.map((candidate) => ({
        ...candidate,
        submittedJobIds: [],
      })),
    ),
    '4 人 · 待分流 4 · 高潜 3',
  );

  const unrelatedJobs = JOBS.map((job) => ({
    ...job,
    description: '负责档案整理、会务支持和访客接待，不要求 SQL、Python、Tableau 或数据分析经历。',
    tags: ['档案整理', '会务支持'],
    preferredSkills: [],
  }));
  assert.equal(buildHrCandidateQueueSummary(CANDIDATES, unrelatedJobs), '3 人 · 已投递 3');
});

test('filters the HR review queue by search text and review stage', () => {
  const nativePdfCandidate = {
    ...CANDIDATES[0],
    id: 'candidate-native-pdf-filter-test',
    name: '原生文本候选人',
    email: 'native-pdf@example.com',
    fileName: 'native.pdf',
    textSource: 'pdf-text',
    submittedJobIds: [],
    extractionWarning: '',
  };
  const openAiOcrCandidate = {
    ...CANDIDATES[0],
    id: 'candidate-openai-ocr-filter-test',
    name: '全量 OCR 候选人',
    email: 'openai-ocr@example.com',
    fileName: 'ocr.pdf',
    textSource: 'openai-ocr',
    submittedJobIds: [],
    extractionWarning: '',
  };
  const uploadOnlyCandidate = {
    ...CANDIDATES[0],
    id: 'candidate-upload-only-filter-test',
    name: '林搜索',
    email: 'lin-search@example.com',
    fileName: 'lin-search.pdf',
    textSource: 'pdf-text-fallback',
    submittedJobIds: [],
    extractionWarning: 'OCR 输出中仍有错字，需要人工复核。',
    profile: {
      ...CANDIDATES[0].profile,
      skills: [...CANDIDATES[0].profile.skills, 'Rust'],
    },
  };
  const candidates = [...CANDIDATES, nativePdfCandidate, openAiOcrCandidate, uploadOnlyCandidate];

  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { query: 'Rust' }).map((candidate) => candidate.id),
    [uploadOnlyCandidate.id],
  );
  assert.ok(
    filterHrCandidatesForReview(candidates, JOBS, { query: '数据分析实习生' }).some(
      (candidate) => candidate.submittedJobIds.includes('data-analyst-intern'),
    ),
  );
  assert.ok(
    filterHrCandidatesForReview(candidates, JOBS, { query: '浙江大学' }).some(
      (candidate) => candidate.id === 'li-ruohan',
    ),
  );
  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { query: '竞品市场研究案例' }).map((candidate) => candidate.id),
    ['li-ruohan'],
  );
  assert.ok(filterHrCandidatesForReview(candidates, JOBS, { query: '最佳已投' }).length > 0);
  assert.ok(filterHrCandidatesForReview(candidates, JOBS, { query: '待补' }).length > 0);
  assert.ok(filterHrCandidatesForReview(candidates, JOBS, { query: '进入初筛' }).length > 0);
  assert.ok(filterHrCandidatesForReview(candidates, JOBS, { query: '建议转推荐至' }).length > 0);
  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { query: 'OCR 回退' }).map((candidate) => candidate.id),
    [uploadOnlyCandidate.id],
  );
  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { query: 'PDF 文本提取保底' }).map((candidate) => candidate.id),
    [uploadOnlyCandidate.id],
  );
  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { query: 'lin-search@example.com' }).map((candidate) => candidate.id),
    [uploadOnlyCandidate.id],
  );
  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { query: 'lin-search.pdf' }).map((candidate) => candidate.id),
    [uploadOnlyCandidate.id],
  );
  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { query: 'OpenAI OCR 提取' }).map((candidate) => candidate.id),
    [openAiOcrCandidate.id],
  );
  assert.ok(
    filterHrCandidatesForReview(candidates, JOBS, { stage: 'submitted' }).every(
      (candidate) => candidate.submittedJobIds.length > 0,
    ),
  );
  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { stage: 'unsubmitted' }).map((candidate) => candidate.id),
    [nativePdfCandidate.id, openAiOcrCandidate.id, uploadOnlyCandidate.id],
  );
  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { stage: 'high-potential-unsubmitted' }).map((candidate) => candidate.id),
    [nativePdfCandidate.id, openAiOcrCandidate.id, uploadOnlyCandidate.id],
  );
  assert.ok(filterHrCandidatesForReview(candidates, JOBS, { stage: 'strong' }).length > 0);
  const nativePdfStageIds = filterHrCandidatesForReview(candidates, JOBS, { stage: 'native-pdf' }).map((candidate) => candidate.id);
  assert.ok(nativePdfStageIds.includes(nativePdfCandidate.id));
  assert.ok(!nativePdfStageIds.includes(openAiOcrCandidate.id));
  assert.ok(!nativePdfStageIds.includes(uploadOnlyCandidate.id));
  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { stage: 'openai-ocr' }).map((candidate) => candidate.id),
    [openAiOcrCandidate.id],
  );
  assert.deepEqual(
    filterHrCandidatesForReview(candidates, JOBS, { stage: 'ocr-fallback' }).map((candidate) => candidate.id),
    [uploadOnlyCandidate.id],
  );
});

test('adds accessible HR candidate search and stage filters to the workspace', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.ok(indexHtml.includes('id="hr-candidate-search"'));
  assert.ok(indexHtml.includes('id="hr-candidate-stage"'));
  assert.ok(indexHtml.includes('只看高匹配'));
  assert.ok(indexHtml.includes('只看高潜待分流'));
  assert.ok(indexHtml.includes('只看原生 PDF 文本'));
  assert.ok(indexHtml.includes('只看 OpenAI OCR'));
  assert.ok(indexHtml.includes('只看 OCR 回退'));
  assert.ok(appJs.includes('filterHrCandidatesForReview(state.candidates'));
  assert.ok(appJs.includes('没有符合当前筛选条件的候选人。'));
  assert.ok(appJs.includes('elements.adminCandidatePanel.hidden = !candidate'));
  assert.match(css, /\.candidate-filter-bar\s*\{/);
});

test('shows resume extraction signals in HR candidate cards', async () => {
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.ok(appJs.includes('candidate.textSource ?? \'pdf-text\''));
  assert.ok(appJs.includes('candidate.extractionWarning ?? \'\''));
  assert.ok(appJs.includes('candidate-resume-signals'));
  assert.ok(appJs.includes("getResumeExtractionLabel(candidate.textSource ?? 'pdf-text')"));
  assert.ok(appJs.includes('OCR 回退'));
  assert.ok(appJs.includes("chip.title = candidate.extractionWarning"));
  assert.ok(appJs.includes("chip.setAttribute('aria-label', `OCR 回退：${candidate.extractionWarning}`)"));
  assert.ok(appJs.includes('prependResumeExtractionNote'));
  assert.match(css, /\.resume-signal-note\s*\{/);
  assert.match(css, /\.fit-chip\.warning\s*\{/);
  assert.match(css, /\.candidate-resume-signals\s*\{/);
});

test('builds an HR candidate summary with score and strongest evidence', () => {
  const candidate = CANDIDATES.find((item) => item.id === 'davide');
  const summary = buildCandidateMatchSummary(candidate, JOBS);

  assert.equal(summary, '最佳已投：数据分析实习生 82分 · 强项：SQL');
});

test('builds compact HR fit highlights from matched tags and top gaps', () => {
  const candidate = CANDIDATES.find((item) => item.id === 'davide');
  const highlights = buildCandidateFitHighlights(candidate, JOBS);

  assert.ok(highlights.length >= 2);
  assert.ok(highlights.length <= 3);
  assert.ok(highlights.some((item) => item.type === 'match'));
  assert.ok(highlights.every((item) => item.label));
  assert.ok(highlights.some((item) => item.label.includes('待补')));
});

test('defines a guarded Cloudflare visit log backend', async () => {
  const middleware = await readFile(new URL('../functions/_middleware.js', import.meta.url), 'utf8');
  const adminPage = await readFile(new URL('../functions/admin/visits.js', import.meta.url), 'utf8');
  const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  const wrangler = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');

  assert.ok(wrangler.includes('binding = "VISITS_DB"'));
  assert.ok(wrangler.includes('database_name = "offermate_visits"'));
  assert.ok(schema.includes('CREATE TABLE IF NOT EXISTS visit_logs'));
  assert.ok(schema.includes('visited_at TEXT NOT NULL'));
  assert.ok(schema.includes('ip TEXT NOT NULL'));
  assert.ok(schema.includes('visitor_cipher TEXT'));
  assert.ok(middleware.includes("request.headers.get('cf-connecting-ip')"));
  assert.ok(middleware.includes('encryptText'));
  assert.ok(middleware.includes("ip = '[encrypted]'"));
  assert.ok(middleware.includes('visitor_cipher'));
  assert.ok(middleware.includes('query_present'));
  assert.ok(middleware.includes('ensureVisitLogSchema'));
  assert.ok(middleware.includes('CREATE TABLE IF NOT EXISTS visit_logs'));
  assert.ok(middleware.includes("url.pathname.startsWith('/admin/')"));
  assert.ok(middleware.includes('PRIVATE_FILE_PATTERN'));
  assert.ok(middleware.includes("'/wrangler.toml'"));
  assert.ok(middleware.includes('src\\/backend'));
  assert.ok(adminPage.includes('VISIT_ADMIN_TOKEN'));
  assert.ok(adminPage.includes('decryptText'));
  assert.ok(adminPage.includes('decryptVisitorRow'));
  assert.ok(adminPage.includes('WWW-Authenticate'));
  assert.ok(adminPage.includes('OfferMate 访问记录'));
  assert.ok(!middleware.includes('localStorage'));
  assert.ok(!middleware.includes('clipboard'));
  assert.ok(!middleware.includes('canvas'));
  assert.ok(!middleware.includes('fingerprint'));
});
