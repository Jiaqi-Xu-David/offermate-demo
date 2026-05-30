import {
  COMPANY,
  SAMPLE_RESUME_TEXT,
  STUDENT_PROFILE,
  JOBS,
  CANDIDATES,
  rankJobs,
  analyzeJobFit,
  analyzeJobDescription,
  buildAdminCandidateInsight,
  buildResumeAdvice,
  buildScoreExplanation,
  buildStudentWorkflowSummary,
  buildTailoredResumeSnippet,
  enrichJob,
  parseResumeText,
} from './matcher.js';
import { buildJobDetailUrl } from './job-navigation.js';

const ADMIN_JOBS_STORAGE_KEY = 'offermate-admin-jobs';

function loadAdminJobs() {
  try {
    const parsedJobs = JSON.parse(localStorage.getItem(ADMIN_JOBS_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsedJobs) ? parsedJobs.map(enrichJob) : [];
  } catch {
    return [];
  }
}

function saveAdminJobs(jobs) {
  const adminJobs = jobs.filter((job) => job.source === 'admin');
  localStorage.setItem(ADMIN_JOBS_STORAGE_KEY, JSON.stringify(adminJobs));
}

const savedAdminJobs = loadAdminJobs();

const state = {
  mode: 'student',
  profile: STUDENT_PROFILE,
  jobs: [...savedAdminJobs, ...JOBS],
  selectedJobId: savedAdminJobs[0]?.id ?? 'data-analyst-intern',
  selectedCandidateId: 'chen-yutong',
  rankings: rankJobs(STUDENT_PROFILE, JOBS),
  parseStatus: `已自动解析 ${STUDENT_PROFILE.skills.length} 个技能标签、${STUDENT_PROFILE.experiences.length} 条经历证据。`,
  adminResult:
    savedAdminJobs.length > 0
      ? `已从本地恢复 ${savedAdminJobs.length} 个管理员新增岗位。`
      : '粘贴 JD 后，会自动抽取岗位能力标签并加入岗位池。',
};

const elements = {
  studentWorkspace: document.querySelector('#student-workspace'),
  adminWorkspace: document.querySelector('#admin-workspace'),
  studentMode: document.querySelector('#student-mode'),
  adminMode: document.querySelector('#admin-mode'),
  companySubtitle: document.querySelector('#company-subtitle'),
  companyName: document.querySelector('#company-name'),
  avatarInitial: document.querySelector('#avatar-initial'),
  studentName: document.querySelector('#student-name'),
  studentHeadline: document.querySelector('#student-headline'),
  studentMeta: document.querySelector('#student-meta'),
  studentTarget: document.querySelector('#student-target'),
  resumeDocument: document.querySelector('#resume-document'),
  parseResume: document.querySelector('#parse-resume'),
  parseStatus: document.querySelector('#parse-status'),
  skillList: document.querySelector('#skill-list'),
  languageList: document.querySelector('#language-list'),
  softSkillList: document.querySelector('#soft-skill-list'),
  jobCount: document.querySelector('#job-count'),
  jobList: document.querySelector('#job-list'),
  adminForm: document.querySelector('#admin-form'),
  adminTitle: document.querySelector('#admin-title'),
  adminCity: document.querySelector('#admin-city'),
  adminDescription: document.querySelector('#admin-description'),
  adminResult: document.querySelector('#admin-result'),
  adminJobCount: document.querySelector('#admin-job-count'),
  adminJobList: document.querySelector('#admin-job-list'),
  candidateCount: document.querySelector('#candidate-count'),
  candidateList: document.querySelector('#candidate-list'),
  adminCandidateName: document.querySelector('#admin-candidate-name'),
  adminCandidateStatus: document.querySelector('#admin-candidate-status'),
  submittedJobList: document.querySelector('#submitted-job-list'),
  screeningRecommendation: document.querySelector('#screening-recommendation'),
  routingRecommendation: document.querySelector('#routing-recommendation'),
  suggestedJobList: document.querySelector('#suggested-job-list'),
  workflowBestFit: document.querySelector('#workflow-best-fit'),
  workflowSteps: document.querySelector('#workflow-steps'),
  selectedJobTitle: document.querySelector('#selected-job-title'),
  selectedJobMeta: document.querySelector('#selected-job-meta'),
  scoreRing: document.querySelector('#score-ring'),
  scoreValue: document.querySelector('#score-value'),
  reasonList: document.querySelector('#reason-list'),
  gapList: document.querySelector('#gap-list'),
  scoreFormula: document.querySelector('#score-formula'),
  scoreBreakdown: document.querySelector('#score-breakdown'),
  skillDetailList: document.querySelector('#skill-detail-list'),
  screeningSignal: document.querySelector('#screening-signal'),
  rewriteList: document.querySelector('#rewrite-list'),
  generateSnippet: document.querySelector('#generate-snippet'),
  tailoredSnippet: document.querySelector('#tailored-snippet'),
  nextActions: document.querySelector('#next-actions'),
  finalReport: document.querySelector('#final-report'),
};

function renderTags(container, tags, variant = '') {
  container.replaceChildren(
    ...tags.map((tag) => {
      const span = document.createElement('span');
      span.className = variant ? `tag ${variant}` : 'tag';
      span.textContent = tag;
      return span;
    }),
  );
}

function createLabelValue(tagName, labelText, valueText) {
  const item = document.createElement(tagName);
  const label = document.createElement('strong');
  label.textContent = labelText;
  item.append(label, document.createTextNode(valueText));
  return item;
}

function renderWorkflowSummary() {
  const summary = buildStudentWorkflowSummary(state.profile, state.jobs);
  elements.workflowBestFit.textContent = `推荐结果：${summary.bestFit}`;
  elements.workflowSteps.replaceChildren(
    ...summary.steps.map((step, index) => {
      const item = document.createElement('div');
      item.className = 'workflow-step';

      const indexNode = document.createElement('span');
      indexNode.className = 'workflow-index';
      indexNode.textContent = String(index + 1).padStart(2, '0');

      const body = document.createElement('div');
      const label = document.createElement('strong');
      label.textContent = step.label;
      const value = document.createElement('p');
      value.textContent = step.value;
      body.append(label, value);

      item.append(indexNode, body);
      return item;
    }),
  );
}

function appendResumeLine(section, line) {
  if (line.startsWith('-')) {
    let list = section.querySelector('ul');
    if (!list) {
      list = document.createElement('ul');
      section.append(list);
    }
    const item = document.createElement('li');
    item.textContent = line.replace(/^-\s*/, '');
    list.append(item);
    return;
  }

  const paragraph = document.createElement('p');
  paragraph.textContent = line;
  section.append(paragraph);
}

function renderResumeDocument() {
  const sectionNames = new Set(['教育背景', '核心技能', '语言与软技能', '实习经历', '项目经历', '校园经历']);
  const lines = SAMPLE_RESUME_TEXT.split('\n').map((line) => line.trim()).filter(Boolean);
  const header = document.createElement('div');
  header.className = 'resume-header';
  const firstSectionIndex = lines.findIndex((line) => sectionNames.has(line));
  const headerLines = firstSectionIndex > -1 ? lines.slice(0, firstSectionIndex) : lines.slice(0, 4);

  const name = document.createElement('h2');
  name.textContent = headerLines[0];
  header.append(name);
  headerLines.slice(1).forEach((line) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    header.append(paragraph);
  });

  const body = document.createElement('div');
  body.className = 'resume-body';
  let currentSection;

  lines.slice(firstSectionIndex > -1 ? firstSectionIndex : 4).forEach((line) => {
    if (sectionNames.has(line)) {
      currentSection = document.createElement('section');
      currentSection.className = 'resume-section';
      const heading = document.createElement('h4');
      heading.textContent = line;
      currentSection.append(heading);
      body.append(currentSection);
      return;
    }

    if (!currentSection) return;
    if (currentSection.querySelector('h4')?.textContent === '核心技能' && !line.startsWith('-')) {
      const skills = document.createElement('div');
      skills.className = 'resume-skill-row';
      line.split('、').forEach((skill) => {
        const tag = document.createElement('span');
        tag.textContent = skill;
        skills.append(tag);
      });
      currentSection.append(skills);
      return;
    }

    appendResumeLine(currentSection, line);
  });

  elements.resumeDocument.replaceChildren(header, body);
}

function renderProfile() {
  document.body.dataset.mode = state.mode;
  elements.studentWorkspace.hidden = state.mode !== 'student';
  elements.adminWorkspace.hidden = state.mode !== 'admin';
  elements.studentMode.classList.toggle('active', state.mode === 'student');
  elements.adminMode.classList.toggle('active', state.mode === 'admin');
  elements.studentMode.setAttribute('aria-selected', String(state.mode === 'student'));
  elements.adminMode.setAttribute('aria-selected', String(state.mode === 'admin'));
  elements.companySubtitle.textContent = `${COMPANY.name} · ${COMPANY.subtitle}`;
  elements.companyName.textContent = COMPANY.name;
  elements.avatarInitial.textContent = state.profile.name.slice(0, 1);
  elements.studentName.textContent = state.profile.name;
  elements.studentHeadline.textContent = state.profile.headline;
  elements.studentMeta.textContent = `${state.profile.gender ?? '未填写'} · ${(state.profile.cityPreferences ?? []).join(' / ')}`;
  elements.studentTarget.textContent = state.profile.target;
  elements.parseStatus.textContent = state.parseStatus;
  renderTags(elements.skillList, state.profile.skills);
  renderTags(elements.languageList, state.profile.languages ?? ['未解析到语言要求']);
  renderTags(elements.softSkillList, state.profile.softSkills ?? ['未解析到软技能']);
}

function createJobCard(analysis) {
  const link = document.createElement('a');
  link.className = analysis.job.id === state.selectedJobId ? 'job-card active' : 'job-card';
  link.dataset.jobId = analysis.job.id;
  link.href = buildJobDetailUrl(analysis.job.id);
  link.setAttribute('aria-label', `查看${analysis.job.company}${analysis.job.title}招聘详情`);

  const titleRow = document.createElement('div');
  titleRow.className = 'job-title-row';
  const titleBlock = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = analysis.job.title;
  const meta = document.createElement('p');
  meta.className = 'job-meta';
  meta.textContent = `${analysis.job.company} · ${analysis.job.city} · ${analysis.job.salary}`;
  titleBlock.append(title, meta);

  const score = document.createElement('span');
  score.className = 'mini-score';
  score.textContent = analysis.score;
  titleRow.append(titleBlock, score);

  const tagList = document.createElement('div');
  tagList.className = 'tag-list';
  renderTags(tagList, analysis.job.tags.slice(0, 4));

  const requirementList = document.createElement('div');
  requirementList.className = 'job-requirement-grid';
  [
    ['核心技能', analysis.job.tags.slice(0, 3).join('、')],
    ['软技能', (analysis.job.softSkills ?? []).slice(0, 2).join('、') || '待补充'],
    ['语言', (analysis.job.languageRequirements ?? []).slice(0, 1).join('、') || '待补充'],
  ].forEach(([labelText, valueText]) => {
    requirementList.append(createLabelValue('span', labelText, valueText));
  });

  const description = document.createElement('p');
  description.className = 'job-description';
  description.textContent = analysis.job.description;

  const level = document.createElement('span');
  level.className = 'job-level';
  level.textContent = analysis.job.source === 'admin' ? `新增 · ${analysis.level}` : analysis.level;

  const footer = document.createElement('div');
  footer.className = 'job-card-footer';
  const detailHint = document.createElement('span');
  detailHint.className = 'job-detail-hint';
  detailHint.textContent = '查看公司招聘详情';
  footer.append(level, detailHint);

  link.append(titleRow, description, requirementList, tagList, footer);
  return link;
}

function createAdminJobItem(job) {
  const item = document.createElement('a');
  item.className = 'admin-job-item';
  item.href = buildJobDetailUrl(job.id);
  item.setAttribute('aria-label', `查看${job.company}${job.title}招聘详情`);

  const header = document.createElement('div');
  header.className = 'admin-item-header';
  const title = document.createElement('h3');
  title.textContent = job.title;
  const meta = document.createElement('span');
  meta.textContent = `${job.company} · ${job.city} · ${job.salary}`;
  header.append(title, meta);

  const description = document.createElement('p');
  description.textContent = job.description;

  const tagList = document.createElement('div');
  tagList.className = 'tag-list';
  renderTags(tagList, job.tags);

  const detailGrid = document.createElement('div');
  detailGrid.className = 'admin-job-detail-grid';
  [
    ['核心技能', job.hardSkillRequirements?.map((skill) => `${skill.name}：${skill.requiredLevel}`).join('、') || job.tags.join('、')],
    ['软技能', (job.softSkills ?? []).join('、') || '待补充'],
    ['语言', (job.languageRequirements ?? []).join('、') || '待补充'],
  ].forEach(([labelText, valueText]) => {
    detailGrid.append(createLabelValue('p', labelText, valueText));
  });

  item.append(header, description, detailGrid, tagList);
  return item;
}

function createCandidateCard(candidate) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = candidate.id === state.selectedCandidateId ? 'candidate-card active' : 'candidate-card';
  button.dataset.candidateId = candidate.id;

  const submittedJobs = candidate.submittedJobIds
    .map((jobId) => state.jobs.find((job) => job.id === jobId)?.title)
    .filter(Boolean);

  const name = document.createElement('h3');
  name.textContent = candidate.name;
  const meta = document.createElement('p');
  meta.textContent = `${candidate.profile.gender ?? '未填写'} · ${candidate.school} · ${candidate.major}`;
  const submitted = document.createElement('p');
  submitted.className = 'candidate-submitted';
  submitted.textContent = `已提交：${submittedJobs.join('、')}`;
  button.append(name, meta, submitted);
  button.addEventListener('click', () => {
    state.selectedCandidateId = candidate.id;
    render();
  });
  return button;
}

function renderScoreBreakdown(profile, job) {
  const explanation = buildScoreExplanation(profile, job);
  const breakdown = explanation.breakdown;
  elements.scoreFormula.textContent = explanation.formula;
  elements.scoreBreakdown.replaceChildren(
    ...breakdown.map((item) => {
      const row = document.createElement('div');
      row.className = 'breakdown-row';

      const header = document.createElement('div');
      header.className = 'breakdown-header';
      const label = document.createElement('strong');
      label.textContent = item.label;
      const score = document.createElement('span');
      score.textContent = `${item.points}/${item.max}`;
      header.append(label, score);

      const bar = document.createElement('div');
      bar.className = 'breakdown-bar';
      const fill = document.createElement('span');
      fill.style.width = `${Math.round((item.points / item.max) * 100)}%`;
      bar.append(fill);

      const detail = document.createElement('p');
      detail.textContent = item.detail;

      row.append(header, bar, detail);
      return row;
    }),
  );

  const softSkillHeading = document.createElement('div');
  softSkillHeading.className = 'skill-detail-section-heading';
  softSkillHeading.textContent = '软技能与活动经历加分';

  elements.skillDetailList.replaceChildren(
    ...explanation.skillDetails.map((detail) => {
      const row = document.createElement('article');
      row.className = 'skill-detail-row';

      const title = document.createElement('div');
      title.className = 'skill-detail-title';
      const name = document.createElement('strong');
      name.textContent = detail.name;
      const score = document.createElement('span');
      score.textContent = `${detail.score}/${detail.max}`;
      title.append(name, score);

      const fields = document.createElement('div');
      fields.className = 'skill-detail-fields';
      [
        ['JD要求', detail.jdRequirement],
        ['简历体现', detail.resumeLevel],
        ['证据', detail.resumeEvidence],
      ].forEach(([labelText, valueText]) => {
        fields.append(createLabelValue('p', labelText, valueText));
      });

      row.append(title, fields);
      return row;
    }),
    softSkillHeading,
    ...explanation.softSkillDetails.map((detail) => {
      const row = document.createElement('article');
      row.className = detail.matched ? 'skill-detail-row soft-match' : 'skill-detail-row soft-gap';

      const title = document.createElement('div');
      title.className = 'skill-detail-title';
      const name = document.createElement('strong');
      name.textContent = detail.name;
      const score = document.createElement('span');
      score.textContent = detail.matched ? '已体现' : '待补充';
      title.append(name, score);

      const fields = document.createElement('div');
      fields.className = 'skill-detail-fields soft-skill-fields';
      [
        ['JD要求', detail.jdRequirement],
        ['匹配结论', detail.matched ? '简历中有对应体现' : '简历证据不足'],
        ['证据', detail.resumeEvidence],
      ].forEach(([labelText, valueText]) => {
        fields.append(createLabelValue('p', labelText, valueText));
      });

      row.append(title, fields);
      return row;
    }),
  );
}

function renderJobs() {
  state.rankings = rankJobs(state.profile, state.jobs);
  elements.jobCount.textContent = `${state.rankings.length} 个岗位`;
  elements.jobList.replaceChildren(...state.rankings.map(createJobCard));
  elements.adminResult.textContent = state.adminResult;
  renderWorkflowSummary();
}

function renderAdminJobs() {
  elements.adminJobCount.textContent = `${state.jobs.length} 个岗位`;
  elements.adminJobList.replaceChildren(...state.jobs.map(createAdminJobItem));
  elements.adminResult.textContent = state.adminResult;
}

function renderCandidates() {
  elements.candidateCount.textContent = `${CANDIDATES.length} 人`;
  elements.candidateList.replaceChildren(...CANDIDATES.map(createCandidateCard));
}

function createMatchItem(match) {
  const item = document.createElement('article');
  item.className = 'admin-match-item';
  const title = document.createElement('strong');
  title.textContent = `${match.title} · ${match.score}分`;
  const meta = document.createElement('p');
  meta.textContent = `地点：${match.city}；匹配能力：${match.matchedTags.join('、') || '暂无明显匹配'}`;
  item.append(title, meta);
  return item;
}

function renderAdminInsight() {
  const candidate = CANDIDATES.find((item) => item.id === state.selectedCandidateId) ?? CANDIDATES[0];
  state.selectedCandidateId = candidate.id;
  const insight = buildAdminCandidateInsight(candidate, state.jobs);

  elements.adminCandidateName.textContent = `${candidate.name} · ${candidate.profile.gender ?? '未填写'} · ${candidate.school}`;
  elements.adminCandidateStatus.textContent = `${candidate.submittedJobIds.length} 个已投岗位`;
  elements.submittedJobList.replaceChildren(...insight.submittedJobs.map(createMatchItem));
  elements.screeningRecommendation.textContent = insight.screeningRecommendation;
  elements.routingRecommendation.textContent = insight.routingRecommendation;
  elements.suggestedJobList.replaceChildren(
    ...(insight.suggestedJobs.length
      ? insight.suggestedJobs.map(createMatchItem)
      : [Object.assign(document.createElement('p'), { textContent: '暂无更合适的转推荐岗位。' })]),
  );
}

function renderFinalReport(analysis, selectedJob) {
  const topJob = state.rankings[0];
  const reportItems = [
    ['最适合岗位', topJob ? `${topJob.job.title} (${topJob.score}分)` : selectedJob.title],
    ['当前投递建议', `${analysis.level}：${analysis.score >= 80 ? '优先投递并准备面试讲述' : analysis.score >= 65 ? '补强关键词后投递' : '先补项目证据再投递'}`],
    ['主要短板', analysis.gaps.length ? analysis.gaps.join('、') : '暂无明显关键词缺口'],
    ['面试准备', `围绕 ${selectedJob.responsibilities.slice(0, 2).join('、')} 准备 2 个项目故事`],
  ];

  elements.finalReport.replaceChildren(
    ...reportItems.map(([label, value]) => {
      const item = document.createElement('div');
      item.className = 'report-item';
      const title = document.createElement('span');
      title.textContent = label;
      const body = document.createElement('strong');
      body.textContent = value;
      item.append(title, body);
      return item;
    }),
  );
}

function renderAnalysis() {
  const selectedJob = state.jobs.find((job) => job.id === state.selectedJobId) ?? state.jobs[0];
  state.selectedJobId = selectedJob.id;
  const analysis = analyzeJobFit(state.profile, selectedJob);
  const advice = buildResumeAdvice(state.profile, selectedJob);
  const snippet = buildTailoredResumeSnippet(state.profile, selectedJob);

  elements.selectedJobTitle.textContent = `${selectedJob.title} · ${selectedJob.company}`;
  elements.selectedJobMeta.textContent = `${selectedJob.city} · ${selectedJob.salary} · ${(selectedJob.languageRequirements ?? []).join('、') || '语言待补充'}`;
  elements.scoreValue.textContent = analysis.score;
  elements.scoreRing.style.setProperty('--score', analysis.score);
  elements.reasonList.replaceChildren(
    ...analysis.reasons.map((reason) => {
      const item = document.createElement('li');
      item.textContent = reason;
      return item;
    }),
  );
  renderTags(elements.gapList, analysis.gaps.length ? analysis.gaps : ['暂无明显关键词缺口'], analysis.gaps.length ? 'gap' : '');
  renderScoreBreakdown(state.profile, selectedJob);

  elements.screeningSignal.textContent = advice.screeningSignal;
  elements.rewriteList.replaceChildren(
    ...advice.rewrites.map((rewrite) => {
      const item = document.createElement('div');
      item.className = 'rewrite-item';

      const before = document.createElement('p');
      before.className = 'before';
      before.textContent = `原表达：${rewrite.before}`;
      const after = document.createElement('p');
      after.className = 'after';
      after.textContent = `优化后：${rewrite.after}`;
      item.append(before, after);
      return item;
    }),
  );
  elements.tailoredSnippet.textContent = snippet;
  elements.nextActions.replaceChildren(
    ...advice.nextActions.map((action) => {
      const item = document.createElement('li');
      item.textContent = action;
      return item;
    }),
  );
  renderFinalReport(analysis, selectedJob);
}

function render() {
  renderProfile();
  renderJobs();
  renderAnalysis();
  renderAdminJobs();
  renderCandidates();
  renderAdminInsight();
}

elements.parseResume.addEventListener('click', () => {
  state.profile = parseResumeText(SAMPLE_RESUME_TEXT);
  state.parseStatus = `已解析 ${state.profile.skills.length} 个技能标签、${state.profile.experiences.length} 条经历证据。`;
  render();
});

elements.studentMode.addEventListener('click', () => {
  state.mode = 'student';
  render();
});

elements.adminMode.addEventListener('click', () => {
  state.mode = 'admin';
  render();
});

elements.generateSnippet.addEventListener('click', () => {
  const selectedJob = state.jobs.find((job) => job.id === state.selectedJobId) ?? state.jobs[0];
  elements.tailoredSnippet.textContent = buildTailoredResumeSnippet(state.profile, selectedJob);
  elements.tailoredSnippet.classList.add('pulse');
  window.setTimeout(() => elements.tailoredSnippet.classList.remove('pulse'), 500);
});

elements.adminForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const newJob = analyzeJobDescription({
    title: elements.adminTitle.value,
    city: elements.adminCity.value,
    description: elements.adminDescription.value,
  });
  state.jobs = [newJob, ...state.jobs.filter((job) => job.id !== newJob.id)];
  state.mode = 'admin';
  state.adminResult = `已添加「${newJob.title}」，抽取能力：${newJob.tags.join('、')}；薪资：${newJob.salary}。`;
  saveAdminJobs(state.jobs);
  render();
});

renderResumeDocument();
render();
