import {
  COMPANY,
  JOBS,
  STUDENT_PROFILE,
  analyzeJobFit,
  buildScoreExplanation,
  enrichJob,
  findJobById,
} from './matcher.js';

const ADMIN_JOBS_STORAGE_KEY = 'offermate-admin-jobs';

function loadAdminJobs() {
  try {
    const parsedJobs = JSON.parse(localStorage.getItem(ADMIN_JOBS_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsedJobs) ? parsedJobs.map(enrichJob) : [];
  } catch {
    return [];
  }
}

const allJobs = [...loadAdminJobs(), ...JOBS];
const params = new URLSearchParams(window.location.search);
const job = findJobById(params.get('id'), allJobs) ?? JOBS[0];
const analysis = analyzeJobFit(STUDENT_PROFILE, job);
const explanation = buildScoreExplanation(STUDENT_PROFILE, job);

const elements = {
  company: document.querySelector('#detail-company'),
  companySubtitle: document.querySelector('#detail-company-subtitle'),
  title: document.querySelector('#detail-title'),
  meta: document.querySelector('#detail-meta'),
  scoreRing: document.querySelector('#detail-score-ring'),
  scoreValue: document.querySelector('#detail-score-value'),
  description: document.querySelector('#detail-description'),
  responsibilities: document.querySelector('#detail-responsibilities'),
  niceToHave: document.querySelector('#detail-nice-to-have'),
  jdAnalysis: document.querySelector('#detail-jd-analysis'),
  studentName: document.querySelector('#detail-student-name'),
  studentMeta: document.querySelector('#detail-student-meta'),
  resumeTags: document.querySelector('#detail-resume-tags'),
  scoreFormula: document.querySelector('#detail-score-formula'),
  scoreBreakdown: document.querySelector('#detail-score-breakdown'),
  skillRows: document.querySelector('#detail-skill-rows'),
};

function createLabelValue(tagName, labelText, valueText) {
  const item = document.createElement(tagName);
  const label = document.createElement('strong');
  label.textContent = labelText;
  item.append(label, document.createTextNode(valueText));
  return item;
}

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

function renderList(container, items) {
  container.replaceChildren(
    ...items.map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }),
  );
}

function renderJdAnalysis() {
  const hardSkills = (job.hardSkillRequirements ?? [])
    .map((item) => `${item.name}：${item.requiredLevel}`)
    .join('、');
  [
    ['薪资', job.salary],
    ['硬技能', hardSkills || job.tags.join('、')],
    ['软技能', (job.softSkills ?? []).join('、') || '待补充'],
    ['语言要求', (job.languageRequirements ?? []).join('、') || '待补充'],
  ].forEach(([labelText, valueText]) => {
    elements.jdAnalysis.append(createLabelValue('p', labelText, valueText));
  });
}

function renderScoreBreakdown() {
  elements.scoreFormula.textContent = explanation.formula;
  elements.scoreBreakdown.replaceChildren(
    ...explanation.breakdown.map((item) => {
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
}

function renderSkillRows() {
  elements.skillRows.replaceChildren(
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
  );
}

elements.company.textContent = job.company;
elements.companySubtitle.textContent = `${COMPANY.subtitle} · 招聘详情`;
elements.title.textContent = job.title;
elements.meta.textContent = `${job.company} · ${job.city} · ${job.salary}`;
elements.scoreRing.style.setProperty('--score', analysis.score);
elements.scoreValue.textContent = analysis.score;
elements.description.textContent = job.description;
renderList(elements.responsibilities, job.responsibilities);
renderTags(elements.niceToHave, job.niceToHave);
elements.studentName.textContent = `${STUDENT_PROFILE.name} 的简历画像`;
elements.studentMeta.textContent = `${STUDENT_PROFILE.gender} · ${STUDENT_PROFILE.headline} · ${STUDENT_PROFILE.target}`;
renderTags(elements.resumeTags, [
  ...STUDENT_PROFILE.skills.slice(0, 8),
  ...STUDENT_PROFILE.languages,
  ...STUDENT_PROFILE.softSkills.slice(0, 3),
]);
renderJdAnalysis();
renderScoreBreakdown();
renderSkillRows();
