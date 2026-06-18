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
  buildCompositeCapabilityDetails,
  buildCrossRoleRecommendations,
  buildEvidenceTrace,
  buildEvidenceConfidenceSummary,
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
  parseJobDescription,
  parseResumeText,
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
  assert.ok(submittedJobsIndex > adminSummaryIndex);
  assert.ok(resumeIndex > submittedJobsIndex);
});

test('starts resume parsing from an upload-first empty state', async () => {
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

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
  assert.ok(indexHtml.includes('data-demo-email="admin@davide.tech"'));
  assert.ok(appJs.includes("state.mode = user.role === 'admin' ? 'account-admin'"));
  assert.ok(appJs.includes('candidate.rawText'));
  assert.ok(appJs.includes('renderAdminResume(candidate)'));
  assert.ok(appJs.includes('renderResumeDocumentFromText(candidate.rawText'));
  assert.ok(appJs.includes('refreshAccountUsers'));
});

test('keeps empty HR candidates empty and exposes resume download action', async () => {
  const appJs = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.ok(appJs.includes("submitted.textContent = submittedJobs.length ? `已提交：${submittedJobs.join('、')}` : '尚未提交岗位';"));
  assert.ok(appJs.includes("elements.adminCandidateStatus.textContent = candidate.submittedJobIds.length ?"));
  assert.ok(appJs.includes('parseResumeText(rawText)'));
  assert.ok(appJs.includes('formatSafeResumeMeta'));
  assert.ok(!appJs.includes("meta.textContent = `${candidate.profile.gender ?? '未填写'} · ${candidate.school} · ${candidate.major}`;"));
  assert.ok(!appJs.includes("submittedJobIds: submittedJobIds.length ? submittedJobIds : ['data-analyst-intern']"));
  assert.ok(appJs.includes('candidate.resumeDownloadUrl'));
  assert.ok(appJs.includes('下载原简历'));
  assert.match(css, /\.admin-resume-download\s*\{/);
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
  assert.ok(middleware.includes("request.headers.get('cf-connecting-ip')"));
  assert.ok(middleware.includes('query_present'));
  assert.ok(middleware.includes('ensureVisitLogSchema'));
  assert.ok(middleware.includes('CREATE TABLE IF NOT EXISTS visit_logs'));
  assert.ok(middleware.includes("url.pathname.startsWith('/admin/')"));
  assert.ok(middleware.includes('PRIVATE_FILE_PATTERN'));
  assert.ok(middleware.includes("'/wrangler.toml'"));
  assert.ok(middleware.includes('src\\/backend'));
  assert.ok(adminPage.includes('VISIT_ADMIN_TOKEN'));
  assert.ok(adminPage.includes('WWW-Authenticate'));
  assert.ok(adminPage.includes('OfferMate 访问记录'));
  assert.ok(!middleware.includes('localStorage'));
  assert.ok(!middleware.includes('clipboard'));
  assert.ok(!middleware.includes('canvas'));
  assert.ok(!middleware.includes('fingerprint'));
});
