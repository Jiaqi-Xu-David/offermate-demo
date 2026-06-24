import {
  COMPANY,
  SAMPLE_RESUME_TEXT,
  JOBS,
  rankJobs,
  analyzeJobFit,
  analyzeJobDescription,
  buildAdminCandidateInsight,
  buildCompositeCapabilityDetails,
  buildEvidenceConfidenceSummary,
  buildEvidenceTrace,
  buildInterviewQuestions,
  buildPotentialAnalysis,
  buildResumeAdvice,
  buildResumeSummary,
  buildScoreExplanation,
  buildTeamComplement,
  buildTailoredResumeSnippet,
  enrichJob,
  parseResumeText,
} from './matcher.js';
import { buildJobDetailUrl } from './job-navigation.js';

const ADMIN_JOBS_STORAGE_KEY = 'offermate-admin-jobs';
const HIGHLIGHT_CLASS = 'hl-target';
const HIGHLIGHT_FLASH_CLASS = 'hl-flash';
const DEFAULT_PARSE_STATUS = '等待上传 PDF 简历。解析完成后会提取技能、经历证据、语言与求职偏好。';

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

function createEmptyProfile(name = '求职者') {
  return {
    name,
    gender: '未填写',
    headline: '上传 PDF 简历后生成候选人画像',
    target: '上传简历后提取求职偏好',
    cityPreferences: [],
    skills: [],
    languages: [],
    softSkills: [],
    skillEvidence: {},
    interests: [],
    experiences: [],
    rawResume: '',
  };
}

function repairProfileFromRawText(profile, rawText) {
  if (!rawText?.trim()) return profile;
  const reparsedProfile = parseResumeText(rawText);
  return {
    ...profile,
    ...reparsedProfile,
    rawResume: rawText,
  };
}

function formatSafeResumeMeta(metaText, fallback = '简历已解析') {
  const clean = String(metaText ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  if (clean.length > 48 || /(电话|邮箱|联系方式|实习经历|工作职责|个人简历)/.test(clean)) {
    return fallback;
  }
  return clean;
}

const state = {
  mode: 'student',
  currentUser: null,
  profile: createEmptyProfile('求职者'),
  resumeText: '',
  resumeFileName: '',
  hasParsedResume: false,
  jobs: [...savedAdminJobs, ...JOBS],
  candidates: [],
  accountUsers: [],
  history: { resumes: [], matchRuns: [] },
  selectedJobId: savedAdminJobs[0]?.id ?? 'data-analyst-intern',
  selectedCandidateId: '',
  rankings: rankJobs(createEmptyProfile('求职者'), JOBS),
  parseStatus: DEFAULT_PARSE_STATUS,
  adminResult:
    savedAdminJobs.length > 0
      ? `已从本地恢复 ${savedAdminJobs.length} 个管理员新增岗位。`
      : '粘贴 JD 后，会自动抽取岗位能力标签并加入岗位池。',
  accountResult: '新增后即可用该邮箱和密码登录。',
};

const elements = {
  appShell: document.querySelector('#app-shell'),
  loginScreen: document.querySelector('#login-screen'),
  loginForm: document.querySelector('#login-form'),
  loginEmail: document.querySelector('#login-email'),
  loginPassword: document.querySelector('#login-password'),
  loginError: document.querySelector('#login-error'),
  openRegisterModal: document.querySelector('#open-register-modal'),
  registerDialog: document.querySelector('#register-dialog'),
  closeRegisterModal: document.querySelector('#close-register-modal'),
  registerForm: document.querySelector('#register-form'),
  registerName: document.querySelector('#register-name'),
  registerEmail: document.querySelector('#register-email'),
  registerPassword: document.querySelector('#register-password'),
  registerConfirmPassword: document.querySelector('#register-confirm-password'),
  registerError: document.querySelector('#register-error'),
  logoutButton: document.querySelector('#logout-button'),
  authUserName: document.querySelector('#auth-user-name'),
  authRoleLabel: document.querySelector('#auth-role-label'),
  studentWorkspace: document.querySelector('#student-workspace'),
  adminWorkspace: document.querySelector('#admin-workspace'),
  accountAdminWorkspace: document.querySelector('#account-admin-workspace'),
  companySubtitle: document.querySelector('#company-subtitle'),
  companyName: document.querySelector('#company-name'),
  studentName: document.querySelector('#student-name'),
  studentHeadline: document.querySelector('#student-headline'),
  studentMeta: document.querySelector('#student-meta'),
  studentTarget: document.querySelector('#student-target'),
  resumeDocument: document.querySelector('#resume-document'),
  resumeUploadForm: document.querySelector('#resume-upload-form'),
  resumeFile: document.querySelector('#resume-file'),
  resumePickerButton: document.querySelector('#resume-picker-button'),
  selectedFileName: document.querySelector('#selected-file-name'),
  sampleResumeButton: document.querySelector('#sample-resume-button'),
  resumeHistoryList: document.querySelector('#resume-history-list'),
  parseStatus: document.querySelector('#parse-status'),
  potentialSummary: document.querySelector('#potential-summary'),
  potentialSignals: document.querySelector('#potential-signals'),
  workflowChecklist: document.querySelector('#workflow-checklist'),
  matchDashboardList: document.querySelector('#match-dashboard-list'),
  skillList: document.querySelector('#skill-list'),
  languageList: document.querySelector('#language-list'),
  softSkillList: document.querySelector('#soft-skill-list'),
  jobCount: document.querySelector('#job-count'),
  jobList: document.querySelector('#job-list'),
  refreshJobsButton: document.querySelector('#refresh-jobs-button'),
  openAdminModal: document.querySelector('#open-admin-modal'),
  closeAdminModal: document.querySelector('#close-admin-modal'),
  adminDialog: document.querySelector('#admin-job-dialog'),
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
  adminResumeDocument: document.querySelector('#admin-resume-document'),
  adminMatchTitle: document.querySelector('#admin-match-title'),
  adminMatchFormula: document.querySelector('#admin-match-formula'),
  adminMatchBreakdown: document.querySelector('#admin-match-breakdown'),
  teamComplementTitle: document.querySelector('#team-complement-title'),
  teamComplementList: document.querySelector('#team-complement-list'),
  submittedJobList: document.querySelector('#submitted-job-list'),
  screeningRecommendation: document.querySelector('#screening-recommendation'),
  routingRecommendation: document.querySelector('#routing-recommendation'),
  suggestedJobList: document.querySelector('#suggested-job-list'),
  interviewQuestionList: document.querySelector('#interview-question-list'),
  selectedJobTitle: document.querySelector('#selected-job-title'),
  selectedJobMeta: document.querySelector('#selected-job-meta'),
  scoreRing: document.querySelector('#score-ring'),
  scoreValue: document.querySelector('#score-value'),
  priorityActionPanel: document.querySelector('#priority-action-panel'),
  compositeList: document.querySelector('#composite-list'),
  scoreFormula: document.querySelector('#score-formula'),
  scoreBreakdown: document.querySelector('#score-breakdown'),
  confidencePanel: document.querySelector('#confidence-panel'),
  confidenceChain: document.querySelector('#confidence-chain'),
  evidenceJd: document.querySelector('#evidence-jd'),
  evidenceResume: document.querySelector('#evidence-resume'),
  skillDetailList: document.querySelector('#skill-detail-list'),
  screeningSignal: document.querySelector('#screening-signal'),
  rewriteList: document.querySelector('#rewrite-list'),
  generateSnippet: document.querySelector('#generate-snippet'),
  tailoredSnippet: document.querySelector('#tailored-snippet'),
  accountUserCount: document.querySelector('#account-user-count'),
  accountUserList: document.querySelector('#account-user-list'),
  accountUserForm: document.querySelector('#account-user-form'),
  accountName: document.querySelector('#account-name'),
  accountEmail: document.querySelector('#account-email'),
  accountRole: document.querySelector('#account-role'),
  accountPassword: document.querySelector('#account-password'),
  accountResult: document.querySelector('#account-result'),
};

function resetStudentWorkspaceState(name = '求职者') {
  state.profile = createEmptyProfile(name);
  state.resumeText = '';
  state.resumeFileName = '';
  state.hasParsedResume = false;
  state.history = { resumes: [], matchRuns: [] };
  state.parseStatus = '等待上传 PDF 简历。解析完成后会提取技能、经历证据、语言与求职偏好。';
  if (elements.selectedFileName) elements.selectedFileName.textContent = '未选择文件';
  if (elements.resumeFile) elements.resumeFile.value = '';
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: options.body instanceof FormData ? options.headers : {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallback =
      response.status === 404
        ? '当前页面没有连接后端接口。请用 Cloudflare Pages Functions 本地服务或线上部署地址打开。'
        : '请求失败，请稍后再试。';
    throw new Error(payload.error ?? fallback);
  }
  return payload;
}

function getRoleLabel(role) {
  return { student: '求职者', hr: 'HR', admin: '管理员' }[role] ?? role;
}

function setAuthenticatedUser(user) {
  state.currentUser = user;
  state.mode = user.role === 'admin' ? 'account-admin' : user.role === 'hr' ? 'admin' : 'student';
  if (user.role === 'student') {
    resetStudentWorkspaceState(user.name);
  }
  elements.loginScreen.hidden = true;
  elements.appShell.hidden = false;
  elements.authUserName.textContent = user.name;
  elements.authRoleLabel.textContent = getRoleLabel(user.role);
}

function showLogin(message = '') {
  state.currentUser = null;
  resetStudentWorkspaceState();
  elements.appShell.hidden = true;
  elements.loginScreen.hidden = false;
  elements.loginError.textContent = message;
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

function hasResumeEvidence(profile) {
  const placeholderValues = new Set(['上传后生成', '未识别到', '待补充', '暂无', '']);
  const meaningfulItems = (items = []) =>
    (Array.isArray(items) ? items : [])
      .map((item) => String(item ?? '').trim())
      .filter((item) => item && !placeholderValues.has(item));
  const profileName = String(profile?.name ?? '').trim();
  const hasBrokenName = visibleLength(profileName) <= 1 || isGenericResumeTitle(profileName);
  const skills = meaningfulItems(profile?.skills);
  const languages = meaningfulItems(profile?.languages);
  const softSkills = meaningfulItems(profile?.softSkills);
  const experiences = meaningfulItems(profile?.experiences).filter((item) => item.length >= 12 && /[，。；,.;]|\d|SQL|Python|Excel|Tableau/.test(item));

  return Boolean(skills.length + languages.length + softSkills.length + experiences.length) && !hasBrokenName;
}

function isGenericResumeTitle(line) {
  return ['个人简历', '求职简历', '简历', '我的简历', 'Resume', 'CV'].includes(String(line ?? '').trim());
}

function visibleLength(value) {
  return Array.from(String(value ?? '').trim()).length;
}

function normalizeResumeDisplayText(rawText) {
  const lines = String(rawText ?? '')
    .replace(/\u0000/g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
  const merged = [];
  let singleGlyphBuffer = '';

  lines.forEach((line) => {
    const parts = line.split(/\s+/);
    const normalizedLine =
      parts.length >= 3 && parts.every((part) => visibleLength(part) === 1)
        ? parts.join('')
        : line;

    if (visibleLength(normalizedLine) === 1) {
      singleGlyphBuffer += normalizedLine;
      return;
    }
    if (singleGlyphBuffer) {
      merged.push(singleGlyphBuffer);
      singleGlyphBuffer = '';
    }
    merged.push(normalizedLine);
  });

  if (singleGlyphBuffer) merged.push(singleGlyphBuffer);
  return merged.join('\n');
}

function getDisplayResumeName(lines) {
  const explicit = lines.find((line) => /^(姓名|Name)\s*[：:]/i.test(line));
  if (explicit) {
    const value = explicit.replace(/^(姓名|Name)\s*[：:\s]*/i, '').replace(/[，,；;|].*$/, '').trim();
    if (value) return { name: value, sourceLine: explicit };
  }

  const candidateLine = lines.find((line) => {
    const clean = line.replace(/\s+/g, '');
    return !isGenericResumeTitle(clean) && /^[\u4e00-\u9fa5A-Za-z·]{2,24}$/.test(clean);
  });
  return { name: candidateLine ?? lines[0] ?? '求职者', sourceLine: candidateLine ?? lines[0] ?? '' };
}

function buildResumeStatusWarnings(payload, profile) {
  const warnings = [];
  if (payload.resume.extractionWarning) warnings.push(`OCR 回退：${payload.resume.extractionWarning}`);
  if (profile.parserWarning) warnings.push(`结构化回退：${profile.parserWarning}`);
  return warnings;
}

function createLabelValue(tagName, labelText, valueText, className = '') {
  const item = document.createElement(tagName);
  if (className) item.className = className;
  const label = document.createElement('strong');
  label.textContent = labelText;
  item.append(label, document.createTextNode(valueText));
  return item;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getScoreTone(score) {
  if (score >= 80) return 'strong';
  if (score >= 65) return 'medium';
  return 'low';
}

function getScoreToneLabel(score) {
  if (score >= 80) return '强匹配';
  if (score >= 65) return '可投递';
  return '暂缓';
}

function getConfidenceTone(confidence) {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
}

function selectStudentJob(jobId) {
  state.selectedJobId = jobId;
  renderJobs();
  renderAnalysis();
}

function clearHighlights(container) {
  container.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((node) => {
    node.replaceWith(document.createTextNode(node.textContent));
  });
  container.normalize();
}

function highlightKeyword(container, keyword) {
  if (!container || !keyword?.trim()) return [];

  clearHighlights(container);
  const pattern = new RegExp(escapeRegExp(keyword.trim()), 'gi');
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (parent?.closest(`.${HIGHLIGHT_CLASS}, script, style, textarea, input`)) return NodeFilter.FILTER_REJECT;
      pattern.lastIndex = 0;
      return pattern.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  return textNodes.flatMap((node) => {
    const matches = [];
    const fragment = document.createDocumentFragment();
    const source = node.nodeValue;
    let cursor = 0;
    pattern.lastIndex = 0;

    source.replace(pattern, (match, index) => {
      if (index > cursor) {
        fragment.append(document.createTextNode(source.slice(cursor, index)));
      }
      const highlight = document.createElement('span');
      highlight.className = `${HIGHLIGHT_CLASS} ${HIGHLIGHT_FLASH_CLASS}`;
      highlight.textContent = match;
      fragment.append(highlight);
      matches.push(highlight);
      cursor = index + match.length;
      return match;
    });

    if (cursor < source.length) {
      fragment.append(document.createTextNode(source.slice(cursor)));
    }

    node.replaceWith(fragment);
    return matches;
  });
}

function scrollFirstMatch(matches) {
  matches[0]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

function highlightEvidenceFocus(focus) {
  const resumeMatches = highlightKeyword(elements.resumeDocument, focus);
  const activeJobCard = elements.jobList.querySelector('.job-card.active');
  const jobMatches = highlightKeyword(activeJobCard, focus);
  scrollFirstMatch(resumeMatches);
  scrollFirstMatch(jobMatches);
}

function renderPotentialAnalysis() {
  if (!hasResumeEvidence(state.profile)) {
    const score = document.createElement('strong');
    score.textContent = '待解析';
    const label = document.createElement('span');
    label.textContent = '上传简历后生成';
    const trend = document.createElement('p');
    trend.textContent = '能力标签会基于技能、项目经历和活动证据生成。';
    elements.potentialSummary.replaceChildren(score, label, trend);
    elements.potentialSignals.replaceChildren(
      Object.assign(document.createElement('p'), { textContent: '当前还没有可用于评估的简历证据。' }),
    );
    return;
  }

  const potential = buildPotentialAnalysis(state.profile);
  const score = document.createElement('strong');
  score.textContent = `${potential.score}`;
  const label = document.createElement('span');
  label.textContent = potential.label;
  const trend = document.createElement('p');
  trend.textContent = potential.trend;
  elements.potentialSummary.replaceChildren(score, label, trend);
  elements.potentialSignals.replaceChildren(
    ...potential.signals.map((signal) => {
      const item = document.createElement('p');
      item.textContent = signal;
      return item;
    }),
  );
}

function renderResumeHistory() {
  if (!elements.resumeHistoryList) return;
  const runs = state.history.matchRuns ?? [];
  if (!runs.length) {
    const empty = document.createElement('p');
    empty.className = 'history-empty';
    empty.textContent = '登录后上传 PDF 简历，这里会保留解析和匹配记录。';
    elements.resumeHistoryList.replaceChildren(empty);
    return;
  }

  elements.resumeHistoryList.replaceChildren(
    ...runs.slice(0, 5).map((run) => {
      const best = run.scores?.[0];
      const item = document.createElement('article');
      item.className = 'history-item';
      const title = document.createElement('strong');
      title.textContent = run.fileName;
      const meta = document.createElement('p');
      meta.textContent = `${new Date(run.createdAt).toLocaleString('zh-CN')} · 最佳匹配：${best ? `${best.title} ${best.score}分` : '暂无评分'}`;
      item.append(title, meta);
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

function renderResumePlaceholder(container = elements.resumeDocument) {
  const empty = document.createElement('div');
  empty.className = 'resume-empty-state';
  const title = document.createElement('strong');
  title.textContent = '上传 PDF 后展示简历摘要';
  const copy = document.createElement('p');
  copy.textContent = '页面只展示姓名、学校、求职意向和能力标签，不再直接铺开完整原文。';
  empty.append(title, copy);
  container.replaceChildren(empty);
}

function renderResumeExtractionFallback(rawText, container = elements.resumeDocument) {
  const empty = document.createElement('div');
  empty.className = 'resume-empty-state';
  const title = document.createElement('strong');
  title.textContent = '暂未识别到稳定简历关键词';
  const copy = document.createElement('p');
  const length = String(rawText ?? '').trim().length;
  copy.textContent = length
    ? `已读取约 ${length} 个字符，但姓名、学校、技能或经历字段不足。请确认 PDF 清晰度，配置 OCR 后可自动重试。`
    : '请上传清晰 PDF，解析成功后会自动生成摘要和标签。';
  empty.append(title, copy);
  container.replaceChildren(empty);
}

function renderResumeSummaryCard(profile, container, submittedJobTitles = [], options = {}) {
  const summary = buildResumeSummary(profile, submittedJobTitles);
  const showExperiences = options.showExperiences ?? true;
  const header = document.createElement('div');
  header.className = 'resume-header resume-summary-header';

  const name = document.createElement('h2');
  name.textContent = summary.name;
  const meta = document.createElement('p');
  meta.className = 'resume-summary-meta';
  meta.textContent = summary.metaText;
  const submitted = document.createElement('p');
  submitted.className = 'resume-submitted-line';
  submitted.textContent = summary.submittedText;
  header.append(name, meta, submitted);

  const tagGroups = document.createElement('div');
  tagGroups.className = 'resume-tag-groups';
  summary.tagGroups.forEach((group) => {
    const section = document.createElement('section');
    section.className = 'resume-tag-group';
    const label = document.createElement('strong');
    label.textContent = group.label;
    const tags = document.createElement('div');
    tags.className = 'tag-list tight-tags';
    renderTags(tags, group.tags);
    section.append(label, tags);
    tagGroups.append(section);
  });

  const body = document.createElement('div');
  body.className = 'resume-body';
  if (showExperiences && summary.experiences.length) {
    const experienceSection = document.createElement('section');
    experienceSection.className = 'resume-section resume-compact-experience';
    const heading = document.createElement('h4');
    heading.textContent = '经历证据';
    const list = document.createElement('ul');
    summary.experiences.forEach((experience) => {
      const item = document.createElement('li');
      item.textContent = experience;
      list.append(item);
    });
    experienceSection.append(heading, list);
    body.append(experienceSection);
  }

  container.replaceChildren(header, tagGroups, body);
}

function renderResumeDocumentFromText(rawText, container = elements.resumeDocument, options = {}) {
  const profile = options.profile ? repairProfileFromRawText(options.profile, rawText) : null;
  if (profile?.name && hasResumeEvidence(profile)) {
    renderResumeSummaryCard(profile, container, options.submittedJobTitles ?? [], options.summaryOptions ?? {});
    return;
  }

  const text = normalizeResumeDisplayText(rawText).trim();
  if (!text) {
    renderResumePlaceholder(container);
    return;
  }
  renderResumeExtractionFallback(text, container);
}

function renderProfile() {
  document.body.dataset.mode = state.mode;
  elements.studentWorkspace.hidden = state.mode !== 'student';
  elements.adminWorkspace.hidden = state.mode !== 'admin';
  elements.accountAdminWorkspace.hidden = state.mode !== 'account-admin';
  const workspaceMap = {
    student: elements.studentWorkspace,
    admin: elements.adminWorkspace,
    'account-admin': elements.accountAdminWorkspace,
  };
  const activeWorkspace = workspaceMap[state.mode];
  activeWorkspace?.classList.remove('workspace-fade-in');
  window.requestAnimationFrame(() => activeWorkspace?.classList.add('workspace-fade-in'));
  elements.companySubtitle.textContent = `${COMPANY.name} · ${COMPANY.subtitle}`;
  elements.companyName.textContent = COMPANY.name;
  const resumeSummary = buildResumeSummary(state.profile, []);
  elements.studentName.textContent = resumeSummary.name;
  elements.studentHeadline.textContent = formatSafeResumeMeta(resumeSummary.metaText, '简历摘要待生成');
  const cityText = state.profile.cityPreferences?.length ? state.profile.cityPreferences.join(' / ') : '城市偏好待解析';
  elements.studentMeta.textContent = `${state.profile.gender ?? '未填写'} · ${cityText}`;
  elements.studentTarget.textContent = state.profile.target;
  elements.parseStatus.textContent = state.parseStatus;
  if (state.resumeText.trim()) {
    renderResumeDocumentFromText(state.resumeText, elements.resumeDocument, {
      profile: state.profile,
      summaryOptions: { showExperiences: false },
    });
  } else {
    renderResumePlaceholder();
  }
  renderPotentialAnalysis();
  renderResumeHistory();
  const emptyTag = state.hasParsedResume ? ['未识别到'] : ['上传后生成'];
  renderTags(elements.skillList, state.profile.skills?.length ? state.profile.skills : emptyTag);
  renderTags(elements.languageList, state.profile.languages?.length ? state.profile.languages : emptyTag);
  renderTags(elements.softSkillList, state.profile.softSkills?.length ? state.profile.softSkills : emptyTag);
}

function createWorkflowStep(number, label, detail, status) {
  const item = document.createElement('article');
  item.className = `workflow-step ${status}`;

  const index = document.createElement('span');
  index.className = 'workflow-step-index';
  index.textContent = String(number).padStart(2, '0');

  const content = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = label;
  const copy = document.createElement('p');
  copy.textContent = detail;
  content.append(title, copy);
  item.append(index, content);
  return item;
}

function renderWorkflowChecklist() {
  if (!elements.workflowChecklist) return;
  const hasEvidence = hasResumeEvidence(state.profile);
  const selectedJob = state.jobs.find((job) => job.id === state.selectedJobId) ?? state.jobs[0];
  const selectedAnalysis = state.rankings.find((analysis) => analysis.job.id === selectedJob?.id);
  const gaps = hasEvidence ? (selectedAnalysis?.gaps ?? []).filter(Boolean).slice(0, 2) : [];
  const firstOpenStep = hasEvidence ? (gaps.length ? 3 : 0) : 1;
  const steps = [
    {
      label: hasEvidence ? '简历已解析' : '上传简历',
      detail: hasEvidence
        ? `${state.profile.skills.length} 项能力，${state.profile.experiences.length} 条经历证据`
        : '先上传文字型 PDF，避免只看示例数据',
      done: hasEvidence,
    },
    {
      label: selectedJob ? '已选目标岗位' : '选择目标岗位',
      detail: selectedJob ? selectedJob.title : '从岗位池选择一个岗位查看分析',
      done: Boolean(selectedJob),
    },
    {
      label: hasEvidence ? '补强关键缺口' : '查看匹配结果',
      detail: hasEvidence
        ? gaps.length ? `优先补：${gaps.join('、')}` : '关键词覆盖较完整，可进入投递准备'
        : `${state.jobs.length} 个岗位等待匹配`,
      done: hasEvidence && gaps.length === 0,
    },
  ];

  elements.workflowChecklist.replaceChildren(
    ...steps.map((step, index) => {
      const status = step.done ? 'done' : firstOpenStep === index + 1 ? 'active' : 'pending';
      return createWorkflowStep(index + 1, step.label, step.detail, status);
    }),
  );
}

function createPrioritySection(labelText, children) {
  const section = document.createElement('section');
  const label = document.createElement('span');
  label.textContent = labelText;
  section.append(label, ...children);
  return section;
}

function renderPriorityActionPanel(selectedJob, analysis, advice) {
  if (!elements.priorityActionPanel) return;

  if (!hasResumeEvidence(state.profile)) {
    const title = document.createElement('strong');
    title.textContent = '先上传可识别 PDF 简历';
    const copy = document.createElement('p');
    copy.textContent = '上传后会抽取姓名、学校、经历证据和能力标签，再生成岗位匹配分与简历改写建议。';
    elements.priorityActionPanel.replaceChildren(title, copy);
    return;
  }

  const missingKeywords = (advice.missingKeywords ?? []).slice(0, 4);
  const coveredKeywords = (advice.coveredKeywords ?? []).slice(0, 4);
  const actions = (advice.nextActions ?? []).slice(0, 3);
  const recommendation =
    analysis.score >= 80 ? '建议投递前做一次定向润色' : analysis.score >= 65 ? '先补强关键证据再投递' : '先换更贴近的岗位或补项目';

  const header = document.createElement('div');
  header.className = 'priority-action-header';
  const titleBlock = document.createElement('div');
  const eyebrow = document.createElement('span');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = '优先处理';
  const title = document.createElement('strong');
  title.textContent = recommendation;
  titleBlock.append(eyebrow, title);
  const status = document.createElement('em');
  status.textContent = `${selectedJob.title} · ${analysis.score}分`;
  header.append(titleBlock, status);

  const gapTags = document.createElement('div');
  gapTags.className = 'tag-list tight-tags priority-tags';
  renderTags(gapTags, missingKeywords.length ? missingKeywords : ['暂无明显关键词缺口'], missingKeywords.length ? 'gap' : 'covered');

  const coveredTags = document.createElement('div');
  coveredTags.className = 'tag-list tight-tags priority-tags';
  renderTags(coveredTags, coveredKeywords.length ? coveredKeywords : ['等待更多证据'], 'covered');

  const actionList = document.createElement('ol');
  actions.forEach((action) => {
    const item = document.createElement('li');
    item.textContent = action;
    actionList.append(item);
  });

  const grid = document.createElement('div');
  grid.className = 'priority-action-grid';
  grid.append(
    createPrioritySection('关键词缺口', [gapTags]),
    createPrioritySection('已覆盖能力', [coveredTags]),
    createPrioritySection('建议动作', [actionList]),
  );

  elements.priorityActionPanel.replaceChildren(header, grid);
}

function renderMatchDashboard() {
  renderWorkflowChecklist();
  if (!hasResumeEvidence(state.profile)) {
    const summary = document.createElement('article');
    summary.className = 'match-dashboard-summary';
    const summaryLabel = document.createElement('span');
    summaryLabel.textContent = '岗位池';
    const summaryTitle = document.createElement('strong');
    summaryTitle.textContent = `${state.jobs.length} 个岗位待分析`;
    const summaryMeta = document.createElement('p');
    summaryMeta.textContent = '先上传简历，再生成推荐顺序';
    summary.append(summaryLabel, summaryTitle, summaryMeta);

    elements.matchDashboardList.replaceChildren(
      summary,
      ...state.jobs.slice(0, 3).map((job) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = job.id === state.selectedJobId ? 'match-dashboard-card pending active' : 'match-dashboard-card pending';
        card.style.setProperty('--score', 0);
        card.setAttribute('aria-label', `切换到${job.title}`);
        card.addEventListener('click', () => selectStudentJob(job.id));

        const ring = document.createElement('div');
        ring.className = 'dashboard-score-ring';
        const score = document.createElement('strong');
        score.textContent = '--';
        ring.append(score);

        const content = document.createElement('div');
        content.className = 'dashboard-card-content';
        const title = document.createElement('strong');
        title.textContent = job.title;
        const level = document.createElement('p');
        level.textContent = '等待匹配';
        content.append(title, level);
        card.append(ring, content);
        return card;
      }),
    );
    return;
  }

  const bestMatch = state.rankings[0];
  const viableCount = state.rankings.filter((analysis) => analysis.score >= 65).length;
  const strongCount = state.rankings.filter((analysis) => analysis.score >= 80).length;
  const summary = document.createElement('article');
  summary.className = 'match-dashboard-summary';
  const summaryLabel = document.createElement('span');
  summaryLabel.textContent = '最佳匹配';
  const summaryTitle = document.createElement('strong');
  summaryTitle.textContent = bestMatch ? `${bestMatch.job.title} · ${bestMatch.score}分` : '暂无岗位';
  const summaryMeta = document.createElement('p');
  summaryMeta.textContent = `${strongCount} 个强匹配，${viableCount} 个建议投递`;
  summary.append(summaryLabel, summaryTitle, summaryMeta);

  elements.matchDashboardList.replaceChildren(
    summary,
    ...state.rankings.slice(0, 3).map((analysis, index) => {
      const tone = getScoreTone(analysis.score);
      const card = document.createElement('button');
      card.type = 'button';
      card.className =
        analysis.job.id === state.selectedJobId ? `match-dashboard-card ${tone} active` : `match-dashboard-card ${tone}`;
      card.style.setProperty('--score', analysis.score);
      card.style.setProperty('--delay', `${Math.min(index * 35, 180)}ms`);
      card.setAttribute('aria-label', `切换到${analysis.job.title}匹配分析`);
      card.addEventListener('click', () => selectStudentJob(analysis.job.id));

      const ring = document.createElement('div');
      ring.className = 'dashboard-score-ring';
      const score = document.createElement('strong');
      score.textContent = analysis.score;
      ring.append(score);

      const content = document.createElement('div');
      content.className = 'dashboard-card-content';
      const title = document.createElement('strong');
      title.textContent = analysis.job.title;
      const level = document.createElement('p');
      level.textContent = getScoreToneLabel(analysis.score);
      content.append(title, level);
      card.append(ring, content);
      return card;
    }),
  );
}

function createJobCard(analysis) {
  const hasEvidence = hasResumeEvidence(state.profile);
  const card = document.createElement('article');
  card.className = analysis.job.id === state.selectedJobId ? 'job-card active' : 'job-card';
  card.dataset.jobId = analysis.job.id;
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `查看${analysis.job.title}匹配分析`);

  card.addEventListener('click', () => selectStudentJob(analysis.job.id));
  card.addEventListener('keydown', (event) => {
    if (event.target !== card) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectStudentJob(analysis.job.id);
    }
  });

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
  score.textContent = hasEvidence ? analysis.score : '--';
  titleRow.append(titleBlock, score);

  const tagList = document.createElement('div');
  tagList.className = 'tag-list job-keywords';
  renderTags(tagList, analysis.job.tags.slice(0, 4));

  const requirementList = document.createElement('div');
  requirementList.className = 'job-signal-strip';
  [
    ['核心', analysis.job.tags.slice(0, 3).join('、')],
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
  level.textContent = hasEvidence
    ? analysis.job.source === 'admin' ? `新增 · ${analysis.level}` : analysis.level
    : '待解析';

  const footer = document.createElement('div');
  footer.className = 'job-card-footer';
  const detailLink = document.createElement('a');
  detailLink.className = 'job-detail-link';
  detailLink.href = buildJobDetailUrl(analysis.job.id);
  detailLink.textContent = '查看公司招聘详情';
  detailLink.setAttribute('aria-label', `查看${analysis.job.company}${analysis.job.title}招聘详情`);
  detailLink.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  footer.append(level, detailLink);

  card.append(titleRow, description, requirementList, tagList, footer);
  return card;
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
  const profile = repairProfileFromRawText(candidate.profile, candidate.rawText);
  const summary = buildResumeSummary(profile, submittedJobs);
  meta.textContent = formatSafeResumeMeta(summary.metaText, `${profile.gender ?? '未填写'} · 简历已解析`);
  const submitted = document.createElement('p');
  submitted.className = 'candidate-submitted';
  submitted.textContent = submittedJobs.length ? `已提交：${submittedJobs.join('、')}` : '尚未提交岗位';
  button.append(name, meta, submitted);
  button.addEventListener('click', () => {
    state.selectedCandidateId = candidate.id;
    render();
  });
  return button;
}

function createTagGroup(labelText, tags) {
  const section = document.createElement('div');
  section.className = 'admin-resume-section';
  const label = document.createElement('strong');
  label.textContent = labelText;
  const tagList = document.createElement('div');
  tagList.className = 'tag-list tight-tags';
  renderTags(tagList, tags.length ? tags : ['未填写']);
  section.append(label, tagList);
  return section;
}

function prependAdminResumeDownload(candidate) {
  if (!candidate.resumeDownloadUrl) return;
  const action = document.createElement('a');
  action.className = 'admin-resume-download';
  action.href = candidate.resumeDownloadUrl;
  action.textContent = '下载原简历';
  action.setAttribute('download', candidate.fileName || 'resume.pdf');
  elements.adminResumeDocument.prepend(action);
}

function getCandidateSubmittedJobTitles(candidate) {
  return (candidate.submittedJobIds ?? [])
    .map((jobId) => state.jobs.find((job) => job.id === jobId)?.title)
    .filter(Boolean);
}

function selectCandidateDisplayName(profile, fallbackName = '求职者') {
  const parsedName = String(profile?.name ?? '').trim();
  if (parsedName && !isGenericResumeTitle(parsedName) && parsedName !== '求职者') return parsedName;
  return fallbackName || '求职者';
}

function renderAdminResume(candidate) {
  const profile = repairProfileFromRawText(candidate.profile, candidate.rawText);
  if (candidate.rawText?.trim()) {
    renderResumeDocumentFromText(candidate.rawText, elements.adminResumeDocument, {
      profile,
      submittedJobTitles: getCandidateSubmittedJobTitles(candidate),
    });
    prependAdminResumeDownload(candidate);
    return;
  }

  if (!hasResumeEvidence(profile)) {
    const empty = document.createElement('div');
    empty.className = 'resume-empty-state';
    const title = document.createElement('strong');
    title.textContent = '候选人尚未上传简历';
    const copy = document.createElement('p');
    copy.textContent = '上传后 HR 可在这里查看简历摘要与关键词，并下载原始文件。';
    empty.append(title, copy);
    elements.adminResumeDocument.replaceChildren(empty);
    return;
  }

  renderResumeSummaryCard(profile, elements.adminResumeDocument, getCandidateSubmittedJobTitles(candidate));
  prependAdminResumeDownload(candidate);
}

function renderAdminMatchReview(candidate, insight) {
  if (!hasResumeEvidence(candidate.profile)) {
    elements.adminMatchTitle.textContent = '等待候选人上传简历';
    elements.adminMatchFormula.textContent = '暂无简历证据，不能生成可信评分。';
    elements.adminMatchBreakdown.replaceChildren();
    return;
  }

  const bestMatch = insight.submittedJobs[0] ?? insight.suggestedJobs[0];
  const bestJob = bestMatch ? state.jobs.find((job) => job.id === bestMatch.id) : null;

  if (!bestJob) {
    elements.adminMatchTitle.textContent = '暂无可评分岗位';
    elements.adminMatchFormula.textContent = '候选人尚未提交可分析岗位。';
    elements.adminMatchBreakdown.replaceChildren();
    return;
  }

  const explanation = buildScoreExplanation(candidate.profile, bestJob);
  elements.adminMatchTitle.textContent = `${bestJob.title} · ${explanation.total}分`;
  elements.adminMatchFormula.textContent = explanation.formula;
  elements.adminMatchBreakdown.replaceChildren(
    ...explanation.breakdown.map((item) => {
      const row = document.createElement('div');
      row.className = 'admin-breakdown-row';
      const header = document.createElement('div');
      const label = document.createElement('strong');
      label.textContent = item.label;
      const score = document.createElement('span');
      score.textContent = item.points;
      header.append(label, score);
      const detail = document.createElement('p');
      detail.textContent = item.detail;
      row.append(header, detail);
      return row;
    }),
  );
}

function updateEvidenceTrace(profile, job, focus, shouldHighlight = true) {
  const trace = buildEvidenceTrace(profile, job, focus);
  elements.evidenceJd.textContent = trace.jdText;
  elements.evidenceResume.textContent = trace.resumeText;
  document.querySelectorAll('[data-evidence-focus]').forEach((node) => {
    node.classList.toggle('active-evidence', node.dataset.evidenceFocus === focus);
  });
  if (shouldHighlight) highlightEvidenceFocus(focus);
}

function renderCompositeCapabilities(profile, job) {
  const capabilities = buildCompositeCapabilityDetails(profile, job);
  elements.compositeList.replaceChildren(
    ...(capabilities.length
      ? capabilities.map((capability) => {
          const item = document.createElement('article');
          item.className = capability.matched ? 'composite-item matched' : 'composite-item';
          const title = document.createElement('strong');
          title.textContent = capability.name;
          const description = document.createElement('p');
          description.textContent = capability.description;
          const evidence = document.createElement('span');
          evidence.textContent = capability.conclusion;
          item.append(title, description, evidence);
          return item;
        })
      : [Object.assign(document.createElement('p'), { textContent: '当前 JD 暂未识别出额外复合能力。' })]),
  );
}

function renderConfidencePanel(profile, job) {
  const summary = buildEvidenceConfidenceSummary(profile, job);
  const score = document.createElement('strong');
  score.textContent = `${summary.averageConfidence}%`;
  const text = document.createElement('p');
  text.textContent = summary.summary;
  const detail = document.createElement('span');
  detail.textContent = `${summary.highConfidenceCount}/${summary.details.length} 项高置信证据`;
  elements.confidencePanel.replaceChildren(score, text, detail);
  elements.confidenceChain.replaceChildren(
    ...summary.details.map((item) => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = `confidence-chain-item ${getConfidenceTone(item.confidence)}`;
      node.dataset.evidenceFocus = item.name;
      node.title = item.confidenceReason;
      node.addEventListener('click', () => updateEvidenceTrace(profile, job, item.name));
      const dot = document.createElement('span');
      dot.className = 'confidence-dot';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const label = document.createElement('em');
      label.textContent = item.confidenceLabel;
      node.append(dot, name, label);
      return node;
    }),
  );
}

function renderScoreBreakdown(profile, job) {
  const explanation = buildScoreExplanation(profile, job);
  const breakdown = explanation.breakdown;
  elements.scoreFormula.textContent = explanation.formula;
  renderConfidencePanel(profile, job);
  elements.scoreBreakdown.replaceChildren(
    ...breakdown.map((item) => {
      const row = document.createElement('div');
      row.className = 'breakdown-row';

      const header = document.createElement('div');
      header.className = 'breakdown-header';
      const label = document.createElement('strong');
      label.textContent = item.label;
      const score = document.createElement('span');
      score.textContent = item.points;
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
      row.dataset.evidenceFocus = detail.name;
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.addEventListener('click', () => updateEvidenceTrace(profile, job, detail.name));
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          updateEvidenceTrace(profile, job, detail.name);
        }
      });

      const title = document.createElement('div');
      title.className = 'skill-detail-title';
      const name = document.createElement('strong');
      name.textContent = detail.name;
      const score = document.createElement('span');
      score.textContent = detail.score;
      title.append(name, score);

      const fields = document.createElement('div');
      fields.className = 'skill-detail-fields';
      const fieldRows = [
        ['JD要求', detail.jdRequirement],
        ['简历体现', detail.resumeLevel],
        ['证据', detail.resumeEvidence],
        ['置信度', `${detail.confidenceLabel}：${detail.confidenceReason}`],
        ['来源', detail.sourceText],
      ];
      fieldRows.forEach(([labelText, valueText]) => {
        const className =
          labelText === '来源' ? 'source-field' : labelText === '置信度' ? 'confidence-field' : '';
        fields.append(createLabelValue('p', labelText, valueText, className));
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
        ['匹配结论', detail.matched ? '简历中有对应体现' : '简历中暂未看到对应体现'],
        ['证据', detail.resumeEvidence],
      ].forEach(([labelText, valueText]) => {
        fields.append(createLabelValue('p', labelText, valueText));
      });

      row.append(title, fields);
      return row;
    }),
  );
  const firstFocus = explanation.skillDetails[0]?.name ?? breakdown[0]?.label;
  if (firstFocus) updateEvidenceTrace(profile, job, firstFocus, false);
}

function renderJobs() {
  state.rankings = hasResumeEvidence(state.profile)
    ? rankJobs(state.profile, state.jobs)
    : state.jobs.map((job) => ({
        job,
        score: 0,
        level: '待解析',
        matchedTags: [],
        matchedNiceToHave: [],
        gaps: job.tags ?? [],
        reasons: [],
      }));
  elements.jobCount.textContent = `${state.rankings.length} 个岗位`;
  elements.jobList.replaceChildren(...state.rankings.map(createJobCard));
  renderMatchDashboard();
  elements.adminResult.textContent = state.adminResult;
}

function renderAdminJobs() {
  elements.adminJobCount.textContent = `${state.jobs.length} 个岗位`;
  elements.adminJobList.replaceChildren(...state.jobs.map(createAdminJobItem));
  elements.adminResult.textContent = state.adminResult;
}

function renderCandidates() {
  elements.candidateCount.textContent = `${state.candidates.length} 人`;
  elements.candidateList.replaceChildren(...state.candidates.map(createCandidateCard));
}

function createAccountUserCard(user) {
  const item = document.createElement('article');
  item.className = user.id === state.currentUser?.id ? 'account-user-card current' : 'account-user-card';

  const main = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = user.name;
  const meta = document.createElement('p');
  meta.textContent = `${user.email} · ${new Date(user.createdAt).toLocaleString('zh-CN')}`;
  main.append(name, meta);

  const actions = document.createElement('div');
  actions.className = 'account-user-actions';
  const role = document.createElement('span');
  role.className = `role-pill ${user.role}`;
  role.textContent = getRoleLabel(user.role);
  const deleteButton = document.createElement('button');
  deleteButton.className = 'secondary-button compact-button';
  deleteButton.type = 'button';
  deleteButton.textContent = user.id === state.currentUser?.id ? '当前账号' : '删除';
  deleteButton.disabled = user.id === state.currentUser?.id;
  deleteButton.addEventListener('click', async () => {
    try {
      await apiRequest(`/api/admin/users?id=${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      state.accountResult = `已删除账号：${user.email}`;
      await refreshAccountUsers();
      renderAccountUsers();
    } catch (error) {
      state.accountResult = error.message;
      renderAccountUsers();
    }
  });
  actions.append(role, deleteButton);
  item.append(main, actions);
  return item;
}

function renderAccountUsers() {
  elements.accountUserCount.textContent = `${state.accountUsers.length} 个账号`;
  elements.accountResult.textContent = state.accountResult;
  elements.accountUserList.replaceChildren(
    ...(state.accountUsers.length
      ? state.accountUsers.map(createAccountUserCard)
      : [Object.assign(document.createElement('p'), { className: 'history-empty', textContent: '暂无账号。' })]),
  );
}

function createMatchItem(match) {
  const item = document.createElement('article');
  item.className = 'admin-match-item';
  const title = document.createElement('strong');
  title.textContent = `${match.title} · ${match.score}分`;
  const meta = document.createElement('p');
  meta.textContent = `地点：${match.city}；匹配能力：${match.matchedTags.join('、') || '暂无明显匹配'}`;
  item.append(title, meta);
  if (match.reason) {
    const reason = document.createElement('p');
    reason.className = 'cross-role-reason';
    reason.textContent = match.reason;
    item.append(reason);
  }
  return item;
}

function renderTeamComplement(candidate) {
  if (!hasResumeEvidence(candidate.profile)) {
    elements.teamComplementTitle.textContent = '待上传简历';
    elements.teamComplementList.replaceChildren(
      Object.assign(document.createElement('p'), { className: 'history-empty', textContent: '暂无候选人能力证据。' }),
    );
    return;
  }

  const complement = buildTeamComplement(candidate);
  elements.teamComplementTitle.textContent = `${complement.score} 分互补度`;
  elements.teamComplementList.replaceChildren(
    ...complement.teamGaps.map((gap) => {
      const item = document.createElement('div');
      item.className = complement.matchedGaps.includes(gap) ? 'team-gap matched' : 'team-gap';
      item.textContent = gap;
      return item;
    }),
  );
}

function renderInterviewQuestions(candidate, insight) {
  if (!hasResumeEvidence(candidate.profile)) {
    elements.interviewQuestionList.replaceChildren(
      Object.assign(document.createElement('p'), { className: 'history-empty', textContent: '上传简历后再生成面试问题。' }),
    );
    return;
  }

  const bestMatch = insight.submittedJobs[0] ?? insight.suggestedJobs[0];
  const bestJob = bestMatch ? state.jobs.find((job) => job.id === bestMatch.id) : state.jobs[0];
  const questions = buildInterviewQuestions(candidate, bestJob);

  elements.interviewQuestionList.replaceChildren(
    ...questions.map((question) => {
      const item = document.createElement('article');
      item.className = 'interview-question-item';
      const focus = document.createElement('strong');
      focus.textContent = question.focus;
      const text = document.createElement('p');
      text.textContent = question.question;
      const reason = document.createElement('span');
      reason.textContent = question.reason;
      item.append(focus, text, reason);
      return item;
    }),
  );
}

function renderSnippetPrompt(selectedJob) {
  if (!state.hasParsedResume) {
    elements.generateSnippet.disabled = true;
    elements.tailoredSnippet.textContent = '上传并解析简历后，可以基于当前岗位生成一段可放入简历的项目表达。';
    return;
  }

  elements.generateSnippet.disabled = false;
  elements.tailoredSnippet.textContent = `已选择「${selectedJob.title}」。点击生成后，会基于解析出的经历改写简历片段。`;
}

function renderAdminInsight() {
  const candidate = state.candidates.find((item) => item.id === state.selectedCandidateId) ?? state.candidates[0];
  if (!candidate) return;
  state.selectedCandidateId = candidate.id;
  candidate.profile = repairProfileFromRawText(candidate.profile, candidate.rawText);
  const insight = buildAdminCandidateInsight(candidate, state.jobs);
  const summary = buildResumeSummary(candidate.profile, getCandidateSubmittedJobTitles(candidate));

  elements.adminCandidateName.textContent = `${candidate.name} · ${formatSafeResumeMeta(summary.metaText, `${candidate.profile.gender ?? '未填写'} · 简历已解析`)}`;
  elements.adminCandidateStatus.textContent = candidate.submittedJobIds.length ? `${candidate.submittedJobIds.length} 个已投岗位` : '尚未提交岗位';
  renderAdminResume(candidate);
  renderAdminMatchReview(candidate, insight);
  renderTeamComplement(candidate);
  renderInterviewQuestions(candidate, insight);
  elements.submittedJobList.replaceChildren(
    ...(insight.submittedJobs.length
      ? insight.submittedJobs.map(createMatchItem)
      : [Object.assign(document.createElement('p'), { className: 'history-empty', textContent: '暂无已投岗位。' })]),
  );
  elements.screeningRecommendation.textContent = hasResumeEvidence(candidate.profile)
    ? insight.screeningRecommendation
    : '候选人尚未上传简历，暂不能进行初筛判断。';
  elements.routingRecommendation.textContent = hasResumeEvidence(candidate.profile)
    ? insight.routingRecommendation
    : '上传简历后再生成转推荐建议。';
  elements.suggestedJobList.replaceChildren(
    ...(hasResumeEvidence(candidate.profile) && insight.suggestedJobs.length
      ? insight.suggestedJobs.map(createMatchItem)
      : [Object.assign(document.createElement('p'), { className: 'history-empty', textContent: '暂无更合适的转推荐岗位。' })]),
  );
}

function renderAnalysis() {
  const selectedJob = state.jobs.find((job) => job.id === state.selectedJobId) ?? state.jobs[0];
  state.selectedJobId = selectedJob.id;
  if (!hasResumeEvidence(state.profile)) {
    elements.selectedJobTitle.textContent = `${selectedJob.title} · ${selectedJob.company}`;
    elements.selectedJobMeta.textContent = `${selectedJob.city} · ${selectedJob.salary}`;
    elements.scoreValue.textContent = '--';
    elements.scoreRing.style.setProperty('--score', 0);
    renderPriorityActionPanel(selectedJob, { score: 0 }, {});
    clearHighlights(elements.resumeDocument);
    clearHighlights(elements.jobList);
    elements.compositeList.replaceChildren(
      Object.assign(document.createElement('p'), { textContent: '上传并成功解析简历后，会展示该岗位的复合能力匹配。' }),
    );
    elements.scoreFormula.textContent = '等待简历解析完成后生成评分。';
    elements.scoreBreakdown.replaceChildren();
    elements.confidencePanel.replaceChildren(
      Object.assign(document.createElement('p'), { textContent: '暂无可计算的证据链。' }),
    );
    elements.confidenceChain.replaceChildren();
    elements.evidenceJd.textContent = selectedJob.description;
    elements.evidenceResume.textContent = '尚未上传可识别简历。';
    elements.skillDetailList.replaceChildren();
    elements.screeningSignal.textContent = '上传可识别简历后生成建议';
    elements.rewriteList.replaceChildren(
      Object.assign(document.createElement('p'), {
        className: 'history-empty',
        textContent: '当前没有足够的简历经历，暂不生成改写建议。',
      }),
    );
    renderSnippetPrompt(selectedJob);
    return;
  }

  const analysis = analyzeJobFit(state.profile, selectedJob);
  const advice = buildResumeAdvice(state.profile, selectedJob);

  elements.selectedJobTitle.textContent = `${selectedJob.title} · ${selectedJob.company}`;
  elements.selectedJobMeta.textContent = `${selectedJob.city} · ${selectedJob.salary}`;
  elements.scoreValue.textContent = analysis.score;
  elements.scoreRing.style.setProperty('--score', analysis.score);
  renderPriorityActionPanel(selectedJob, analysis, advice);
  clearHighlights(elements.resumeDocument);
  clearHighlights(elements.jobList);
  elements.scoreRing.classList.remove('score-bump');
  void elements.scoreRing.offsetWidth;
  elements.scoreRing.classList.add('score-bump');
  renderCompositeCapabilities(state.profile, selectedJob);
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
  renderSnippetPrompt(selectedJob);
}

async function refreshJobs() {
  const payload = await apiRequest('/api/jobs');
  if (Array.isArray(payload.jobs) && payload.jobs.length) {
    state.jobs = payload.jobs.map(enrichJob);
    if (!state.jobs.some((job) => job.id === state.selectedJobId)) {
      state.selectedJobId = state.jobs[0].id;
    }
  }
}

async function refreshStudentHistory() {
  if (state.currentUser?.role !== 'student') return;
  state.history = await apiRequest('/api/resumes');
  const latestResume = state.history.resumes?.[0];
  const latestProfile = latestResume?.profile;
  if (latestProfile?.name) {
    const rawText = latestResume.rawText ?? latestProfile.rawResume ?? '';
    state.profile = repairProfileFromRawText(latestProfile, rawText);
    state.resumeText = rawText;
    state.resumeFileName = latestResume.fileName ?? '';
    state.hasParsedResume = Boolean(state.resumeText.trim());
    state.parseStatus = hasResumeEvidence(state.profile)
      ? `已加载最近一次解析：${latestResume.fileName}`
      : '最近一次解析质量不足，建议重新上传更清晰的 PDF，或配置 OCR 后再次解析。';
  } else if (!state.hasParsedResume) {
    state.profile = createEmptyProfile(state.currentUser?.name ?? '求职者');
    state.resumeText = '';
    state.resumeFileName = '';
  }
}

function mapUploadedCandidate(candidate) {
  const submittedJobIds = candidate.submittedJobIds ?? [];
  const rawText = candidate.rawText ?? candidate.profile?.rawResume ?? '';
  const baseProfile = candidate.profile?.name ? candidate.profile : createEmptyProfile(candidate.name);
  const profile = repairProfileFromRawText(baseProfile, rawText);
  const summary = buildResumeSummary(profile, []);
  const metaParts = formatSafeResumeMeta(summary.metaText, '已上传简历').split(' · ');
  return {
    id: candidate.id,
    name: selectCandidateDisplayName(profile, candidate.name),
    school: hasResumeEvidence(profile) ? metaParts.find((part) => /大学|学院|学校/.test(part)) ?? '已上传简历' : '未上传简历',
    major: metaParts.find((part) => !/男|女|大学|学院|学校|简历/.test(part)) ?? candidate.fileName ?? '候选人简历',
    submittedJobIds,
    profile,
    rawText,
    fileName: candidate.fileName ?? '',
    resumeDownloadUrl: candidate.resumeDownloadUrl ?? '',
  };
}

async function refreshHrCandidates() {
  if (state.currentUser?.role !== 'hr') return;
  const payload = await apiRequest('/api/hr/candidates');
  const uploaded = (payload.uploadedCandidates ?? []).map(mapUploadedCandidate);
  state.candidates = uploaded;
  state.selectedCandidateId = state.candidates[0]?.id ?? state.selectedCandidateId;
}

async function refreshAccountUsers() {
  if (state.currentUser?.role !== 'admin') return;
  const payload = await apiRequest('/api/admin/users');
  state.accountUsers = payload.users ?? [];
}

async function refreshRoleData() {
  if (state.currentUser?.role === 'student') {
    await refreshJobs();
    await refreshStudentHistory();
  } else if (state.currentUser?.role === 'hr') {
    await refreshJobs();
    await refreshHrCandidates();
  } else if (state.currentUser?.role === 'admin') {
    await refreshAccountUsers();
  }
}

function render() {
  renderProfile();
  if (state.mode === 'student') {
    renderJobs();
    renderAnalysis();
  }
  if (state.mode === 'admin') {
    renderAdminJobs();
    renderCandidates();
    renderAdminInsight();
  }
  if (state.mode === 'account-admin') {
    renderAccountUsers();
  }
}

async function enterApp(user) {
  setAuthenticatedUser(user);
  await refreshRoleData();
  render();
}

async function bootstrapSession() {
  try {
    const payload = await apiRequest('/api/session');
    await enterApp(payload.user);
  } catch {
    renderResumePlaceholder();
    showLogin();
  }
}

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  elements.loginError.textContent = '';
  try {
    const payload = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        email: elements.loginEmail.value,
        password: elements.loginPassword.value,
      }),
    });
    await enterApp(payload.user);
  } catch (error) {
    showLogin(error.message);
  }
});

elements.openRegisterModal.addEventListener('click', () => {
  elements.registerError.textContent = '';
  elements.registerForm.reset();
  if (typeof elements.registerDialog.showModal === 'function') {
    elements.registerDialog.showModal();
    return;
  }
  elements.registerDialog.setAttribute('open', '');
});

elements.closeRegisterModal.addEventListener('click', () => {
  elements.registerDialog.close();
});

elements.registerDialog.addEventListener('click', (event) => {
  if (event.target === elements.registerDialog) {
    elements.registerDialog.close();
  }
});

elements.registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  elements.registerError.textContent = '';
  if (elements.registerPassword.value !== elements.registerConfirmPassword.value) {
    elements.registerError.textContent = '两次密码输入不一致。';
    return;
  }

  try {
    const payload = await apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        name: elements.registerName.value,
        email: elements.registerEmail.value,
        password: elements.registerPassword.value,
        confirmPassword: elements.registerConfirmPassword.value,
      }),
    });
    elements.registerDialog.close();
    await enterApp(payload.user);
  } catch (error) {
    elements.registerError.textContent = error.message;
  }
});

elements.logoutButton.addEventListener('click', async () => {
  await apiRequest('/api/logout', { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
  showLogin();
});

elements.refreshJobsButton.addEventListener('click', async () => {
  try {
    await refreshJobs();
    renderJobs();
    renderAnalysis();
  } catch (error) {
    state.parseStatus = error.message;
    renderProfile();
  }
});

elements.generateSnippet.addEventListener('click', () => {
  if (!state.hasParsedResume) {
    elements.tailoredSnippet.textContent = '请先上传并解析简历，再生成定制片段。';
    return;
  }
  const selectedJob = state.jobs.find((job) => job.id === state.selectedJobId) ?? state.jobs[0];
  elements.tailoredSnippet.textContent = buildTailoredResumeSnippet(state.profile, selectedJob);
  elements.tailoredSnippet.classList.add('pulse');
  window.setTimeout(() => elements.tailoredSnippet.classList.remove('pulse'), 500);
});

elements.openAdminModal.addEventListener('click', () => {
  if (typeof elements.adminDialog.showModal === 'function') {
    elements.adminDialog.showModal();
    return;
  }
  elements.adminDialog.setAttribute('open', '');
});

elements.closeAdminModal.addEventListener('click', () => {
  elements.adminDialog.close();
});

elements.adminDialog.addEventListener('click', (event) => {
  if (event.target === elements.adminDialog) {
    elements.adminDialog.close();
  }
});

async function applyParsedResume(payload) {
  const rawText = payload.resume.rawText ?? payload.resume.profile?.rawResume ?? '';
  state.profile = repairProfileFromRawText(payload.resume.profile, rawText);
  state.resumeText = rawText;
  state.resumeFileName = payload.resume.fileName ?? '';
  state.hasParsedResume = Boolean(state.resumeText.trim());
  const extractionLabel =
    payload.resume.textSource === 'openai-ocr'
      ? 'OpenAI OCR 提取'
      : payload.resume.textSource === 'pdf-text-fallback'
        ? 'PDF 文本提取保底'
        : 'PDF 文本提取';
  const parserLabel =
    state.profile.parser === 'deepseek-v4-pro'
      ? 'DeepSeek 结构化解析'
      : state.profile.parser === 'openai-responses'
        ? 'OpenAI 结构化解析'
        : '本地规则解析';
  const warnings = buildResumeStatusWarnings(payload, state.profile);
  state.parseStatus = `${extractionLabel} + ${parserLabel}完成：提取 ${state.profile.skills.length} 项核心技能、${state.profile.experiences.length} 条经历证据。${warnings.length ? ` ${warnings.join('；')}` : ''}`;
  await refreshStudentHistory();
  render();
}

async function submitResumeText(body) {
  state.parseStatus = '正在解析简历...';
  renderProfile();
  const payload = await apiRequest('/api/resumes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  await applyParsedResume(payload);
}

elements.resumePickerButton.addEventListener('click', () => {
  elements.resumeFile.click();
});

elements.resumeFile.addEventListener('change', () => {
  const file = elements.resumeFile.files?.[0];
  elements.selectedFileName.textContent = file?.name ?? '未选择文件';
});

elements.sampleResumeButton.addEventListener('click', async () => {
  try {
    await submitResumeText({
      fileName: 'offermate-example-resume.txt',
      rawText: SAMPLE_RESUME_TEXT,
    });
  } catch (error) {
    state.parseStatus = error.message;
    renderProfile();
  }
});

elements.resumeUploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = elements.resumeFile.files?.[0];
  if (!file) {
    state.parseStatus = '请先选择一份文本型 PDF 简历，或点击“使用示例简历”体验完整流程。';
    renderProfile();
    return;
  }

  const form = new FormData();
  form.append('resume', file);
  state.parseStatus = '正在上传并解析 PDF...';
  renderProfile();

  try {
    const payload = await apiRequest('/api/resumes', { method: 'POST', body: form });
    await applyParsedResume(payload);
  } catch (error) {
    state.parseStatus = error.message;
    renderProfile();
  }
});

elements.adminForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: elements.adminTitle.value,
        city: elements.adminCity.value,
        description: elements.adminDescription.value,
      }),
    });
    const newJob = enrichJob(payload.job);
    state.jobs = [newJob, ...state.jobs.filter((job) => job.id !== newJob.id)];
    state.adminResult = `已添加「${newJob.title}」，抽取能力：${newJob.tags.join('、')}；薪资：${newJob.salary}。`;
    render();
    elements.adminDialog.close();
  } catch (error) {
    state.adminResult = error.message;
    renderAdminJobs();
  }
});

elements.accountUserForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = await apiRequest('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        name: elements.accountName.value,
        email: elements.accountEmail.value,
        role: elements.accountRole.value,
        password: elements.accountPassword.value,
      }),
    });
    state.accountResult = `已创建账号：${payload.user.email}（${getRoleLabel(payload.user.role)}）`;
    await refreshAccountUsers();
    renderAccountUsers();
  } catch (error) {
    state.accountResult = error.message;
    renderAccountUsers();
  }
});

renderResumePlaceholder();
bootstrapSession();
