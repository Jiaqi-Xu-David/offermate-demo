import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPANY,
  SAMPLE_RESUME_TEXT,
  STUDENT_PROFILE,
  JOBS,
  analyzeJobFit,
  analyzeJobDescription,
  buildResumeAdvice,
  parseResumeText,
} from '../src/matcher.js';

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
  assert.ok(profile.skills.includes('SQL'));
  assert.ok(profile.skills.includes('Tableau'));
  assert.ok(profile.cityPreferences.includes('上海'));
  assert.ok(profile.experiences.some((item) => item.includes('10万+ 用户行为数据')));
});

test('keeps all seeded jobs inside the same company', () => {
  assert.ok(JOBS.length >= 4);
  assert.deepEqual(new Set(JOBS.map((job) => job.company)), new Set([COMPANY.name]));
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
