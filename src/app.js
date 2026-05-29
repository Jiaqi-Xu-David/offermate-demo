import {
  COMPANY,
  SAMPLE_RESUME_TEXT,
  STUDENT_PROFILE,
  JOBS,
  rankJobs,
  analyzeJobFit,
  analyzeJobDescription,
  buildResumeAdvice,
  parseResumeText,
} from './matcher.js';

const state = {
  profile: STUDENT_PROFILE,
  jobs: [...JOBS],
  selectedJobId: 'data-analyst-intern',
  rankings: rankJobs(STUDENT_PROFILE, JOBS),
  parseStatus: `已自动解析 ${STUDENT_PROFILE.skills.length} 个技能标签、${STUDENT_PROFILE.experiences.length} 条经历证据。`,
  adminResult: '粘贴 JD 后，系统会自动抽取岗位能力标签并加入岗位池。',
};

const elements = {
  companySubtitle: document.querySelector('#company-subtitle'),
  companyName: document.querySelector('#company-name'),
  avatarInitial: document.querySelector('#avatar-initial'),
  studentName: document.querySelector('#student-name'),
  studentHeadline: document.querySelector('#student-headline'),
  studentTarget: document.querySelector('#student-target'),
  resumeDocument: document.querySelector('#resume-document'),
  parseResume: document.querySelector('#parse-resume'),
  parseStatus: document.querySelector('#parse-status'),
  skillList: document.querySelector('#skill-list'),
  jobCount: document.querySelector('#job-count'),
  jobList: document.querySelector('#job-list'),
  adminForm: document.querySelector('#admin-form'),
  adminTitle: document.querySelector('#admin-title'),
  adminCity: document.querySelector('#admin-city'),
  adminDescription: document.querySelector('#admin-description'),
  adminResult: document.querySelector('#admin-result'),
  selectedJobTitle: document.querySelector('#selected-job-title'),
  scoreRing: document.querySelector('#score-ring'),
  scoreValue: document.querySelector('#score-value'),
  reasonList: document.querySelector('#reason-list'),
  gapList: document.querySelector('#gap-list'),
  screeningSignal: document.querySelector('#screening-signal'),
  rewriteList: document.querySelector('#rewrite-list'),
  nextActions: document.querySelector('#next-actions'),
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
  const sectionNames = new Set(['教育背景', '核心技能', '实习经历', '项目经历', '校园经历']);
  const lines = SAMPLE_RESUME_TEXT.split('\n').map((line) => line.trim()).filter(Boolean);
  const header = document.createElement('div');
  header.className = 'resume-header';

  const name = document.createElement('h2');
  name.textContent = lines[0];
  const target = document.createElement('p');
  target.textContent = lines[1];
  const contact = document.createElement('p');
  contact.textContent = lines[2];
  const city = document.createElement('p');
  city.textContent = lines[3];
  header.append(name, target, contact, city);

  const body = document.createElement('div');
  body.className = 'resume-body';
  let currentSection;

  lines.slice(4).forEach((line) => {
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
  elements.companySubtitle.textContent = `${COMPANY.name} · ${COMPANY.subtitle}`;
  elements.companyName.textContent = COMPANY.name;
  elements.avatarInitial.textContent = state.profile.name.slice(0, 1);
  elements.studentName.textContent = state.profile.name;
  elements.studentHeadline.textContent = state.profile.headline;
  elements.studentTarget.textContent = state.profile.target;
  elements.parseStatus.textContent = state.parseStatus;
  renderTags(elements.skillList, state.profile.skills);
}

function createJobCard(analysis) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = analysis.job.id === state.selectedJobId ? 'job-card active' : 'job-card';
  button.dataset.jobId = analysis.job.id;

  const titleRow = document.createElement('div');
  titleRow.className = 'job-title-row';
  const titleBlock = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = analysis.job.title;
  const meta = document.createElement('p');
  meta.className = 'job-meta';
  meta.textContent = `${analysis.job.company} · ${analysis.job.city}`;
  titleBlock.append(title, meta);

  const score = document.createElement('span');
  score.className = 'mini-score';
  score.textContent = analysis.score;
  titleRow.append(titleBlock, score);

  const tagList = document.createElement('div');
  tagList.className = 'tag-list';
  renderTags(tagList, analysis.job.tags.slice(0, 4));

  const level = document.createElement('span');
  level.className = 'job-level';
  level.textContent = analysis.job.source === 'admin' ? `新增 · ${analysis.level}` : analysis.level;

  button.append(titleRow, tagList, level);
  button.addEventListener('click', () => {
    state.selectedJobId = analysis.job.id;
    render();
  });
  return button;
}

function renderJobs() {
  state.rankings = rankJobs(state.profile, state.jobs);
  elements.jobCount.textContent = `${state.rankings.length} 个岗位`;
  elements.jobList.replaceChildren(...state.rankings.map(createJobCard));
  elements.adminResult.textContent = state.adminResult;
}

function renderAnalysis() {
  const selectedJob = state.jobs.find((job) => job.id === state.selectedJobId) ?? state.jobs[0];
  state.selectedJobId = selectedJob.id;
  const analysis = analyzeJobFit(state.profile, selectedJob);
  const advice = buildResumeAdvice(state.profile, selectedJob);

  elements.selectedJobTitle.textContent = `${selectedJob.title} · ${selectedJob.company}`;
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
  elements.nextActions.replaceChildren(
    ...advice.nextActions.map((action) => {
      const item = document.createElement('li');
      item.textContent = action;
      return item;
    }),
  );
}

function render() {
  renderProfile();
  renderJobs();
  renderAnalysis();
}

elements.parseResume.addEventListener('click', () => {
  state.profile = parseResumeText(SAMPLE_RESUME_TEXT);
  state.parseStatus = `已解析 ${state.profile.skills.length} 个技能标签、${state.profile.experiences.length} 条经历证据。`;
  render();
});

elements.adminForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const newJob = analyzeJobDescription({
    title: elements.adminTitle.value,
    city: elements.adminCity.value,
    description: elements.adminDescription.value,
  });
  state.jobs = [newJob, ...state.jobs.filter((job) => job.id !== newJob.id)];
  state.selectedJobId = newJob.id;
  state.adminResult = `已添加「${newJob.title}」，抽取能力：${newJob.tags.join('、')}。`;
  render();
});

renderResumeDocument();
render();
