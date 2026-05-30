import {
  COMPANY,
  JOBS,
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

const elements = {
  company: document.querySelector('#detail-company'),
  companySubtitle: document.querySelector('#detail-company-subtitle'),
  title: document.querySelector('#detail-title'),
  meta: document.querySelector('#detail-meta'),
  description: document.querySelector('#detail-description'),
  responsibilities: document.querySelector('#detail-responsibilities'),
  niceToHave: document.querySelector('#detail-nice-to-have'),
  jdAnalysis: document.querySelector('#detail-jd-analysis'),
  summary: document.querySelector('#detail-summary'),
  requirements: document.querySelector('#detail-requirements'),
  applyNotes: document.querySelector('#detail-apply-notes'),
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

function renderSummary() {
  [
    ['公司', job.company],
    ['地点', job.city],
    ['薪资', job.salary],
    ['类型', job.source === 'admin' ? '管理员新增岗位' : '校园招聘岗位'],
  ].forEach(([labelText, valueText]) => {
    elements.summary.append(createLabelValue('p', labelText, valueText));
  });
}

elements.company.textContent = job.company;
elements.companySubtitle.textContent = `${COMPANY.subtitle} · 招聘详情`;
elements.title.textContent = job.title;
elements.meta.textContent = `${job.company} · ${job.city} · ${job.salary}`;
elements.description.textContent = job.description;
renderList(elements.responsibilities, job.responsibilities);
renderTags(elements.niceToHave, job.niceToHave);
renderSummary();
renderTags(elements.requirements, [
  ...job.tags,
  ...(job.softSkills ?? []),
  ...(job.languageRequirements ?? []),
]);
renderList(elements.applyNotes, [
  `请围绕 ${job.tags.slice(0, 3).join('、')} 准备项目案例。`,
  `面试中建议结合 ${job.responsibilities.slice(0, 2).join('、')} 说明过往贡献。`,
  `如有 ${(job.softSkills ?? []).slice(0, 2).join('、')} 相关经历，可在投递材料中突出。`,
]);
renderJdAnalysis();
