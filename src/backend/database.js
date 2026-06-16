import {
  CANDIDATES,
  JOBS,
  SAMPLE_RESUME_TEXT,
  STUDENT_PROFILE,
  analyzeJobDescription,
  buildScoreExplanation,
  rankJobs,
} from '../matcher.js';
import { hashPassword } from './auth.js';
import { parseResumeProfile } from './deepseek.js';
import { APP_SCHEMA_SQL } from './schema.js';

const DEMO_USERS = [
  {
    id: 'user-student-davide',
    email: 'davide@example.com',
    name: '大卫德',
    role: 'student',
    password: 'davide123',
    salt: 'offermate-student-demo',
  },
  {
    id: 'user-hr-davide-tech',
    email: 'hr@davide.tech',
    name: '大卫德科技 HR',
    role: 'hr',
    password: 'hr123',
    salt: 'offermate-hr-demo',
  },
  {
    id: 'user-admin-davide-tech',
    email: 'admin@davide.tech',
    name: '大卫德科技管理员',
    role: 'admin',
    password: 'admin123',
    salt: 'offermate-admin-demo',
  },
];

function dbFromEnv(env) {
  const db = env.APP_DB ?? env.VISITS_DB;
  if (!db) throw new Error('D1 database binding is not configured');
  return db;
}

function splitSqlStatements(sql) {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  if (typeof crypto.randomUUID === 'function') return `${prefix}-${crypto.randomUUID()}`;
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `${prefix}-${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function toJson(value) {
  return JSON.stringify(value ?? []);
}

function parseJson(value, fallback = []) {
  try {
    return JSON.parse(value ?? '');
  } catch {
    return fallback;
  }
}

function base64ToBytes(value) {
  const raw = String(value ?? '');
  if (!raw) return new Uint8Array();
  if (typeof atob === 'function') {
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(raw, 'base64'));
}

function serializeJob(job, source = job.source ?? 'seed', createdBy = job.createdBy ?? null) {
  return {
    ...job,
    source,
    createdBy,
    tagsJson: toJson(job.tags),
    hardRequirementsJson: toJson(job.hardSkillRequirements),
    softSkillsJson: toJson(job.softSkills),
    languageRequirementsJson: toJson(job.languageRequirements),
    responsibilitiesJson: toJson(job.responsibilities),
  };
}

function mapJobRow(row) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    city: row.city,
    salary: row.salary,
    description: row.description,
    tags: parseJson(row.tags_json),
    hardSkillRequirements: parseJson(row.hard_requirements_json),
    softSkills: parseJson(row.soft_skills_json),
    languageRequirements: parseJson(row.language_requirements_json),
    responsibilities: parseJson(row.responsibilities_json),
    source: row.source,
    createdBy: row.created_by,
  };
}

function mapScoreRow(row) {
  return {
    id: row.id,
    runId: row.run_id,
    jobId: row.job_id,
    title: row.title,
    city: row.city,
    salary: row.salary,
    score: row.score,
    level: row.level,
    matchedTags: parseJson(row.matched_tags_json),
    reasons: parseJson(row.reasons_json),
    explanation: parseJson(row.explanation_json, {}),
    createdAt: row.created_at,
  };
}

async function executeSchema(db) {
  for (const statement of splitSqlStatements(APP_SCHEMA_SQL)) {
    await db.prepare(statement).run();
  }
}

async function migrateUsersRoleCheck(db) {
  const table = await db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").first();
  if (!table?.sql || table.sql.includes("'admin'")) return;

  await db.prepare('PRAGMA foreign_keys = off').run();
  await db.prepare('DROP TABLE IF EXISTS users_with_admin').run();
  await db
    .prepare(
      `CREATE TABLE users_with_admin (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('student', 'hr', 'admin')),
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO users_with_admin (id, email, name, role, password_salt, password_hash, created_at)
       SELECT id, email, name, role, password_salt, password_hash, created_at
       FROM users`,
    )
    .run();
  await db.prepare('DROP TABLE users').run();
  await db.prepare('ALTER TABLE users_with_admin RENAME TO users').run();
  await db.prepare('PRAGMA foreign_keys = on').run();
}

async function ensureResumeFileColumns(db) {
  const columns = await db.prepare('PRAGMA table_info(resumes)').all();
  const columnNames = new Set((columns.results ?? []).map((column) => column.name));
  if (!columnNames.has('file_data_base64')) {
    await db.prepare('ALTER TABLE resumes ADD COLUMN file_data_base64 TEXT').run();
  }
  if (!columnNames.has('mime_type')) {
    await db.prepare('ALTER TABLE resumes ADD COLUMN mime_type TEXT').run();
  }
}

async function seedUsers(db) {
  for (const user of DEMO_USERS) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO users (
          id, email, name, role, password_salt, password_hash, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(user.id, user.email, user.name, user.role, user.salt, await hashPassword(user.password, user.salt), nowIso())
      .run();
  }
}

async function seedJobs(db) {
  for (const rawJob of JOBS) {
    const job = serializeJob(rawJob, 'seed');
    await db
      .prepare(
        `INSERT OR IGNORE INTO jobs (
          id, title, company, city, salary, description, tags_json,
          hard_requirements_json, soft_skills_json, language_requirements_json,
          responsibilities_json, source, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        job.id,
        job.title,
        job.company,
        job.city,
        job.salary,
        job.description,
        job.tagsJson,
        job.hardRequirementsJson,
        job.softSkillsJson,
        job.languageRequirementsJson,
        job.responsibilitiesJson,
        job.source,
        job.createdBy,
        nowIso(),
      )
      .run();
  }
}

async function seedSampleResume(db) {
  const existing = await db.prepare('SELECT id FROM resumes WHERE id = ?').bind('resume-seed-davide').first();
  if (existing) return;

  await db
    .prepare(
      `INSERT INTO resumes (
        id, user_id, file_name, raw_text, file_data_base64, mime_type, profile_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      'resume-seed-davide',
      'user-student-davide',
      'davide-sample-resume.txt',
      SAMPLE_RESUME_TEXT,
      null,
      'text/plain;charset=utf-8',
      JSON.stringify(STUDENT_PROFILE),
      nowIso(),
    )
    .run();
}

export async function ensureAppData(env) {
  const db = dbFromEnv(env);
  await executeSchema(db);
  await migrateUsersRoleCheck(db);
  await ensureResumeFileColumns(db);
  await seedUsers(db);
  await seedJobs(db);
  return db;
}

export async function findUserByEmail(env, email) {
  const db = await ensureAppData(env);
  return db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').bind(email).first();
}

export async function findSessionUser(env, token) {
  if (!token) return null;
  const db = await ensureAppData(env);
  return db
    .prepare(
      `SELECT users.id, users.email, users.name, users.role, sessions.id AS session_id
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.id = ? AND sessions.expires_at > ?`,
    )
    .bind(token, nowIso())
    .first();
}

export async function createSession(env, userId, token) {
  const db = await ensureAppData(env);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  await db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(token, userId, createdAt, expiresAt).run();
  return { id: token, createdAt, expiresAt };
}

export async function deleteSession(env, token) {
  if (!token) return;
  const db = await ensureAppData(env);
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(token).run();
}

export async function listJobs(env) {
  const db = await ensureAppData(env);
  const rows = await db.prepare('SELECT * FROM jobs ORDER BY source DESC, created_at DESC').all();
  return (rows.results ?? []).map(mapJobRow);
}

export async function addJob(env, user, input) {
  const db = await ensureAppData(env);
  const parsed = serializeJob(analyzeJobDescription(input), 'hr', user.id);
  await db
    .prepare(
      `INSERT OR REPLACE INTO jobs (
        id, title, company, city, salary, description, tags_json,
        hard_requirements_json, soft_skills_json, language_requirements_json,
        responsibilities_json, source, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      parsed.id,
      parsed.title,
      parsed.company,
      parsed.city,
      parsed.salary,
      parsed.description,
      parsed.tagsJson,
      parsed.hardRequirementsJson,
      parsed.softSkillsJson,
      parsed.languageRequirementsJson,
      parsed.responsibilitiesJson,
      parsed.source,
      parsed.createdBy,
      nowIso(),
    )
    .run();
  return parsed;
}

function isLikelyUnusableResumeProfile(profile, rawText) {
  const compactText = String(rawText ?? '').replace(/\s+/g, '');
  const evidenceCount =
    (profile.skills?.length ?? 0) +
    (profile.experiences?.length ?? 0) +
    (profile.languages?.length ?? 0) +
    (profile.softSkills?.length ?? 0);
  const genericName = ['求职者', '个人简历', '求职简历', '简历', 'Resume', 'CV'].includes(profile.name);
  const brokenName = genericName || Array.from(String(profile.name ?? '').trim()).length <= 1;
  const extractionLooksCorrupt = /个亲简历|教育背施|籍设|特话|迎箱|与业/.test(compactText);
  return evidenceCount === 0 && (compactText.length < 80 || extractionLooksCorrupt || (brokenName && profile.headline === '学生'));
}

export async function createResumeAndMatchRun(env, user, { fileName, rawText, fileDataBase64 = null, mimeType = null }) {
  const db = await ensureAppData(env);
  const profile = await parseResumeProfile(env, rawText);
  if (isLikelyUnusableResumeProfile(profile, rawText)) {
    throw new Error('PDF 文本提取质量过低，无法可靠生成匹配结果。请上传文字型 PDF，扫描件需要先 OCR，或使用示例简历确认流程。');
  }
  const resumeId = createId('resume');
  const runId = createId('match');
  const createdAt = nowIso();
  const jobs = await listJobs(env);
  const rankings = rankJobs(profile, jobs);

  await db
    .prepare(
      `INSERT INTO resumes (
        id, user_id, file_name, raw_text, file_data_base64, mime_type, profile_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(resumeId, user.id, fileName, rawText, fileDataBase64, mimeType, JSON.stringify(profile), createdAt)
    .run();
  await db.prepare('INSERT INTO match_runs (id, user_id, resume_id, created_at) VALUES (?, ?, ?, ?)').bind(runId, user.id, resumeId, createdAt).run();

  for (const analysis of rankings) {
    const explanation = buildScoreExplanation(profile, analysis.job);
    await db
      .prepare(
        `INSERT INTO match_scores (
          id, run_id, job_id, score, level, matched_tags_json, reasons_json, explanation_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        createId('score'),
        runId,
        analysis.job.id,
        analysis.score,
        analysis.level,
        toJson(analysis.matchedTags),
        toJson(analysis.reasons),
        JSON.stringify(explanation),
        createdAt,
      )
      .run();
  }

  return { resume: { id: resumeId, fileName, rawText, createdAt, profile }, run: { id: runId, createdAt, scores: rankings } };
}

export async function listStudentHistory(env, user) {
  const db = await ensureAppData(env);
  const resumes = await db
    .prepare(
      `SELECT id, file_name, raw_text, profile_json, created_at
       FROM resumes
       WHERE user_id = ? AND id != 'resume-seed-davide'
       ORDER BY created_at DESC
       LIMIT 20`,
    )
    .bind(user.id)
    .all();
  const runs = await db
    .prepare(
      `SELECT match_runs.id, match_runs.resume_id, match_runs.created_at, resumes.file_name
       FROM match_runs
       JOIN resumes ON resumes.id = match_runs.resume_id
       WHERE match_runs.user_id = ? AND resumes.id != 'resume-seed-davide'
       ORDER BY match_runs.created_at DESC
       LIMIT 20`,
    )
    .bind(user.id)
    .all();

  return {
    resumes: (resumes.results ?? []).map((row) => ({
      id: row.id,
      fileName: row.file_name,
      rawText: row.raw_text,
      profile: parseJson(row.profile_json, {}),
      createdAt: row.created_at,
    })),
    matchRuns: await Promise.all(
      (runs.results ?? []).map(async (row) => ({
        id: row.id,
        resumeId: row.resume_id,
        fileName: row.file_name,
        createdAt: row.created_at,
        scores: await listScoresForRun(db, row.id),
      })),
    ),
  };
}

async function listScoresForRun(db, runId) {
  const rows = await db
    .prepare(
      `SELECT match_scores.*, jobs.title, jobs.city, jobs.salary
       FROM match_scores
       JOIN jobs ON jobs.id = match_scores.job_id
       WHERE match_scores.run_id = ?
       ORDER BY match_scores.score DESC`,
    )
    .bind(runId)
    .all();
  return (rows.results ?? []).map(mapScoreRow);
}

export async function listHrCandidates(env) {
  const db = await ensureAppData(env);
  const applicationRows = await db.prepare('SELECT user_id, job_id FROM applications ORDER BY created_at DESC').all();
  const applicationsByUser = new Map();
  for (const row of applicationRows.results ?? []) {
    const existing = applicationsByUser.get(row.user_id) ?? [];
    if (!existing.includes(row.job_id)) existing.push(row.job_id);
    applicationsByUser.set(row.user_id, existing);
  }

  const uploaded = await db
    .prepare(
      `SELECT users.id AS user_id, users.name, users.email, resumes.id AS resume_id,
              resumes.file_name, resumes.raw_text, resumes.profile_json, resumes.created_at
       FROM users
       LEFT JOIN resumes ON resumes.user_id = users.id AND resumes.id != 'resume-seed-davide'
       WHERE users.role = 'student'
       ORDER BY resumes.created_at DESC`,
    )
    .all();

  const seen = new Set();
  const uploadedCandidates = [];
  for (const row of uploaded.results ?? []) {
    if (seen.has(row.user_id)) continue;
    seen.add(row.user_id);
    const latestRun = row.resume_id
      ? await db.prepare('SELECT id FROM match_runs WHERE resume_id = ? ORDER BY created_at DESC LIMIT 1').bind(row.resume_id).first()
      : null;
    uploadedCandidates.push({
      id: row.user_id,
      name: row.name,
      email: row.email,
      resumeId: row.resume_id,
      fileName: row.file_name,
      rawText: row.raw_text,
      profile: parseJson(row.profile_json, {}),
      submittedJobIds: applicationsByUser.get(row.user_id) ?? [],
      resumeDownloadUrl: row.resume_id ? `/api/hr/resume-download?id=${encodeURIComponent(row.resume_id)}` : '',
      createdAt: row.created_at,
      scores: latestRun ? await listScoresForRun(db, latestRun.id) : [],
    });
  }

  return {
    seededCandidates: CANDIDATES,
    uploadedCandidates,
  };
}

export async function getResumeFileForHr(env, resumeId) {
  const db = await ensureAppData(env);
  const row = await db
    .prepare('SELECT id, file_name, raw_text, file_data_base64, mime_type FROM resumes WHERE id = ?')
    .bind(resumeId)
    .first();
  if (!row) return null;

  if (row.file_data_base64) {
    return {
      fileName: row.file_name || `${row.id}.pdf`,
      mimeType: row.mime_type || 'application/octet-stream',
      bytes: base64ToBytes(row.file_data_base64),
    };
  }

  return {
    fileName: `${(row.file_name || row.id).replace(/\.[^.]+$/, '')}.txt`,
    mimeType: 'text/plain;charset=utf-8',
    bytes: new TextEncoder().encode(row.raw_text ?? ''),
  };
}

export async function listAccountUsers(env) {
  const db = await ensureAppData(env);
  const rows = await db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC').all();
  return {
    users: (rows.results ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.created_at,
    })),
  };
}

export async function createAccountUser(env, input) {
  const db = await ensureAppData(env);
  const name = String(input.name ?? '').trim();
  const email = String(input.email ?? '').trim().toLowerCase();
  const role = String(input.role ?? '').trim();
  const password = String(input.password ?? '');
  const allowedRoles = new Set(['student', 'hr', 'admin']);

  if (!name || !email || !allowedRoles.has(role) || password.length < 6) {
    throw new Error('请填写姓名、邮箱、角色，并设置至少 6 位密码。');
  }

  const salt = createId('salt');
  const user = {
    id: createId('user'),
    email,
    name,
    role,
    createdAt: nowIso(),
  };

  await db
    .prepare(
      `INSERT INTO users (id, email, name, role, password_salt, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(user.id, user.email, user.name, user.role, salt, await hashPassword(password, salt), user.createdAt)
    .run();

  return user;
}

export async function deleteAccountUser(env, currentUser, userId) {
  const db = await ensureAppData(env);
  if (!userId) throw new Error('缺少要删除的账号。');
  if (userId === currentUser.id) throw new Error('不能删除当前登录账号。');
  await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
  return { deletedId: userId };
}
