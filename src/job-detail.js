import {
  COMPANY,
  JOBS,
  enrichJob,
  findJobById,
} from './matcher.js';

const elements = {
  company: document.querySelector('#detail-company'),
  companySubtitle: document.querySelector('#detail-company-subtitle'),
  title: document.querySelector('#detail-title'),
  meta: document.querySelector('#detail-meta'),
  description: document.querySelector('#detail-description'),
  responsibilities: document.querySelector('#detail-responsibilities'),
  niceToHave: document.querySelector('#detail-nice-to-have'),
  summary: document.querySelector('#detail-summary'),
  requirements: document.querySelector('#detail-requirements'),
  arrangements: document.querySelector('#detail-arrangements'),
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

function buildRequirementItems(job) {
  const hardSkills = (job.hardSkillRequirements ?? [])
    .map((item) => `${item.name}${item.requiredLevel && item.requiredLevel !== '需具备' ? `（${item.requiredLevel}）` : ''}`);

  return [
    `具备 ${hardSkills.length ? hardSkills.join('、') : job.tags.join('、')} 等岗位相关能力。`,
    `能够参与 ${job.responsibilities.slice(0, 2).join('、')}，并稳定推进日常任务。`,
    (job.softSkills ?? []).length
      ? `具备 ${(job.softSkills ?? []).join('、')} 等协作素质。`
      : '具备良好的沟通协作能力和学习意愿。',
    (job.languageRequirements ?? []).length
      ? `满足 ${(job.languageRequirements ?? []).join('、')} 相关要求。`
      : '能够阅读岗位相关资料并完成基础沟通。',
  ];
}

function renderSummary(job) {
  [
    ['公司', job.company],
    ['地点', job.city],
    ['薪资', job.salary],
    ['类型', job.source === 'hr' ? '实习岗位' : '校园招聘岗位'],
  ].forEach(([labelText, valueText]) => {
    elements.summary.append(createLabelValue('p', labelText, valueText));
  });
}

function renderArrangements(job) {
  [
    ['面向对象', '2026 届本科及硕士在校生'],
    ['实习周期', '每周不少于 4 天，连续 3 个月及以上'],
    ['工作方式', job.city === '远程' ? '远程协作' : `${job.city} 办公，支持团队协作安排`],
    ['招聘流程', '简历筛选、业务面试、录用沟通'],
  ].forEach(([labelText, valueText]) => {
    elements.arrangements.append(createLabelValue('p', labelText, valueText));
  });
}

function renderNiceToHave(container, tags) {
  if (tags?.length) {
    renderTags(container, tags);
    return;
  }
  const hint = document.createElement('p');
  hint.className = 'history-empty';
  hint.textContent = '加分方向以岗位描述为准。';
  container.replaceChildren(hint);
}

async function resolveJob() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('id');

  if (jobId) {
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
        credentials: 'same-origin',
      });
      if (response.ok) {
        const payload = await response.json();
        if (payload?.job) return enrichJob(payload.job);
      }
    } catch {
      // 后端不可用时回退到内置岗位列表，保证种子岗位页面仍然可用。
    }
  }

  return findJobById(jobId, JOBS) ?? JOBS[0];
}

function mergeStaticExtras(job) {
  const staticJob = findJobById(job.id, JOBS);
  return {
    ...job,
    niceToHave: job.niceToHave ?? staticJob?.niceToHave ?? [],
  };
}

async function renderJobDetailPage() {
  const job = mergeStaticExtras(await resolveJob());

  elements.company.textContent = job.company;
  elements.companySubtitle.textContent = `${COMPANY.subtitle} · 官方招聘信息`;
  elements.title.textContent = job.title;
  elements.meta.textContent = `${job.company} · ${job.city} · ${job.salary}`;
  elements.description.textContent = job.description;
  renderList(elements.responsibilities, job.responsibilities ?? []);
  renderList(elements.requirements, buildRequirementItems(job));
  renderNiceToHave(elements.niceToHave, job.niceToHave);
  renderSummary(job);
  renderArrangements(job);
  renderList(elements.applyNotes, [
    '请提交一页中文简历，PDF 格式优先。',
    '邮件标题建议使用：姓名-学校-岗位名称-每周可实习天数。',
    '如有作品集、项目报告或数据分析案例，可随简历一并附上。',
  ]);
}

renderJobDetailPage();
