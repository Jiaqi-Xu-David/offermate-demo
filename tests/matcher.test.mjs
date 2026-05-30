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
  buildScoreExplanation,
  buildResumeAdvice,
  buildSoftSkillMatchDetails,
  buildStudentWorkflowSummary,
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

  assert.equal(profile.name, '陈雨桐');
  assert.equal(profile.gender, '女');
  assert.ok(profile.skills.includes('SQL'));
  assert.ok(profile.skills.includes('Tableau'));
  assert.ok(profile.languages.includes('英语 CET-6'));
  assert.ok(profile.softSkills.includes('跨部门沟通'));
  assert.ok(profile.cityPreferences.includes('上海'));
  assert.ok(profile.experiences.some((item) => item.includes('10万+ 用户行为数据')));
  assert.ok(profile.skillEvidence.SQL.count >= 2);
});

test('keeps all seeded jobs inside the same company', () => {
  assert.ok(JOBS.length >= 4);
  assert.deepEqual(new Set(JOBS.map((job) => job.company)), new Set([COMPANY.name]));
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
  assert.ok(parsed.softSkills.includes('跨部门沟通'));
  assert.ok(parsed.languageRequirements.includes('英语 CET-6'));
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

  assert.equal(total, analysis.score);
  assert.deepEqual(
    breakdown.map((item) => item.label),
    ['技能匹配', '经历证据', '地点匹配', '兴趣方向'],
  );
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
  assert.ok(tableau.resumeEvidence.includes('项目/技能区出现'));
  assert.ok(explanation.formula.includes('技能匹配 60/60'));
  assert.equal(explanation.skillDetails.length, targetJob.tags.length);
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

  assert.ok(!html.includes('简历分析'));
  assert.ok(!html.includes('简历画像'));
  assert.ok(!html.includes('匹配分'));
  assert.ok(!html.includes('detail-score-ring'));
  assert.ok(!html.includes('detail-student-name'));
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
  const candidate = CANDIDATES.find((item) => item.id === 'chen-yutong');
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
