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
  assert.ok(indexHtml.includes('求职者视角'));
  assert.ok(indexHtml.includes('HR 视角'));
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
  assert.ok(indexHtml.includes('id="composite-list"'));
  assert.ok(indexHtml.includes('class="score-explainer"'));
  assert.ok(indexHtml.includes('id="confidence-panel"'));
  assert.ok(indexHtml.includes('id="evidence-jd"'));
  assert.ok(indexHtml.includes('id="team-complement-list"'));
  assert.ok(indexHtml.includes('id="interview-question-list"'));
  assert.ok(indexHtml.includes('候选人简历'));
  assert.ok(indexHtml.includes('匹配结果与评分'));
  assert.ok(indexHtml.includes('动态能力标签'));
  assert.ok(indexHtml.includes('AI 面试提问桩'));
  assert.ok(submittedJobsIndex > adminSummaryIndex);
  assert.ok(resumeIndex > submittedJobsIndex);
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

  assert.match(css, /\.resume-section\s*\{[\s\S]*gap: 6px/);
  assert.match(css, /\.resume-skill-row\s*\+\s*\.resume-skill-row\s*\{[\s\S]*margin-top: 0/);
  assert.match(css, /\.profile-meta-grid\s*\+\s*\.profile-block\s*\{[\s\S]*margin-top: 18px/);
  assert.match(css, /a\.admin-job-item\s*\{[\s\S]*display: grid[\s\S]*gap: 10px/);
  assert.match(css, /\.job-detail-main\s*>\s*\.section-heading\.compact\s*\{[\s\S]*margin-bottom: 0/);
  assert.match(css, /\.score-explainer\s*\{/);
  assert.match(css, /\.evidence-link-panel\s*\{/);
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
  assert.ok(appJs.includes('state.selectedJobId = analysis.job.id;'));
  assert.ok(appJs.includes('detailLink.href = buildJobDetailUrl(analysis.job.id);'));
  assert.ok(appJs.includes("detailLink.addEventListener('click', (event) => {"));
  assert.ok(appJs.includes('event.stopPropagation();'));
  assert.ok(!appJs.includes("const link = document.createElement('a');\n  link.className = analysis.job.id === state.selectedJobId ? 'job-card active' : 'job-card';"));
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
  assert.ok(middleware.includes("url.pathname.startsWith('/admin/')"));
  assert.ok(middleware.includes('PRIVATE_FILE_PATTERN'));
  assert.ok(middleware.includes("'/wrangler.toml'"));
  assert.ok(adminPage.includes('VISIT_ADMIN_TOKEN'));
  assert.ok(adminPage.includes('WWW-Authenticate'));
  assert.ok(adminPage.includes('OfferMate 访问记录'));
  assert.ok(!middleware.includes('localStorage'));
  assert.ok(!middleware.includes('clipboard'));
  assert.ok(!middleware.includes('canvas'));
  assert.ok(!middleware.includes('fingerprint'));
});
