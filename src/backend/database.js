import {
  JOBS,
  analyzeJobDescription,
  buildScoreExplanation,
  rankJobs,
} from '../matcher.js';
import { hashPassword } from './auth.js';
import { parseResumeProfile } from './deepseek.js';
import { decryptText, encryptText, hashLookup, isEncryptedText } from './secure-data.js';
import { APP_SCHEMA_SQL } from './schema.js';

const DEFAULT_ADMIN = {
  id: 'user-admin-davide-tech',
  email: 'admin@davide.tech',
  name: '大卫德管理员',
  role: 'admin',
  salt: 'offermate-admin-20260618',
  passwordHash: '2490fb1512da914301297caa0367ecc587b8b58b76e670b1495a07df8541aa88',
};

const LEGACY_DEMO_USER_LOOKUPS = [
  'c44abf87a6d36dc98cab56d6547c69a80631f0820256d0789777476a9aabec80',
  '333132eff27d0d18f4c4e8ea3dc0985d0afe34a05dff1acde32c4279d191fff2',
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

function maskEmail(id) {
  return `${id}@encrypted.local`;
}

function maskName(role) {
  return role === 'admin' ? '加密管理员' : '加密账号';
}

async function addMissingColumns(db, tableName, columnDefinitions) {
  const columns = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  const existing = new Set((columns.results ?? []).map((column) => column.name));
  for (const [columnName, definition] of columnDefinitions) {
    if (!existing.has(columnName)) {
      await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
    }
  }
}

async function decryptMaybe(env, encryptedValue, fallback = '') {
  if (!encryptedValue) return fallback;
  return decryptText(env, encryptedValue, fallback);
}

async function mapUserRow(env, row) {
  if (!row) return null;
  const email = await decryptMaybe(env, row.email_cipher, row.email?.endsWith('@encrypted.local') ? '' : row.email);
  const name = await decryptMaybe(env, row.name_cipher, row.name?.startsWith('加密') ? '' : row.name);
  return {
    ...row,
    email,
    name: name || (row.role === 'admin' ? '管理员' : '求职者'),
  };
}

async function decryptResumeRawText(env, row) {
  if (!row) return '';
  return decryptMaybe(env, row.raw_text_cipher, row.raw_text === '[encrypted]' ? '' : row.raw_text);
}

async function decryptResumeProfileJson(env, row) {
  const decrypted = await decryptMaybe(env, row.profile_json_cipher, row.profile_json);
  return decrypted || '{}';
}

async function decryptResumeFileData(env, row) {
  if (!row) return '';
  return decryptMaybe(env, row.file_data_cipher, row.file_data_base64 ?? '');
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
    if (statement.includes('idx_users_email_lookup')) continue;
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
        email_lookup TEXT UNIQUE,
        email_cipher TEXT,
        name TEXT NOT NULL,
        name_cipher TEXT,
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
  await addMissingColumns(db, 'resumes', [
    ['raw_text_cipher', 'TEXT'],
    ['file_data_base64', 'TEXT'],
    ['file_data_cipher', 'TEXT'],
    ['mime_type', 'TEXT'],
    ['profile_json_cipher', 'TEXT'],
  ]);
}

async function ensureUserEncryptionColumns(db, env) {
  await addMissingColumns(db, 'users', [
    ['email_lookup', 'TEXT'],
    ['email_cipher', 'TEXT'],
    ['name_cipher', 'TEXT'],
  ]);
  await db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lookup ON users (email_lookup) WHERE email_lookup IS NOT NULL').run();

  const rows = await db.prepare('SELECT id, email, email_lookup, email_cipher, name, name_cipher, role FROM users').all();
  for (const row of rows.results ?? []) {
    const decryptedEmail = await decryptMaybe(env, row.email_cipher, '');
    const decryptedName = await decryptMaybe(env, row.name_cipher, '');
    const legacyEmail = row.email && !String(row.email).endsWith('@encrypted.local') ? row.email : '';
    const legacyName = row.name && !String(row.name).startsWith('加密') ? row.name : '';
    const email = decryptedEmail || legacyEmail;
    const name = decryptedName || legacyName || maskName(row.role);
    const emailLookup = row.email_lookup || (email ? await hashLookup(email) : await hashLookup(row.id));
    const emailCipher = isEncryptedText(row.email_cipher) ? row.email_cipher : await encryptText(env, email || row.id);
    const nameCipher = isEncryptedText(row.name_cipher) ? row.name_cipher : await encryptText(env, name);

    await db
      .prepare(
        `UPDATE users
         SET email = ?, name = ?, email_lookup = ?, email_cipher = ?, name_cipher = ?
         WHERE id = ?`,
      )
      .bind(maskEmail(row.id), maskName(row.role), emailLookup, emailCipher, nameCipher, row.id)
      .run();
  }
}

async function ensureResumeEncryptionColumns(db, env) {
  await ensureResumeFileColumns(db);
  const rows = await db
    .prepare('SELECT id, raw_text, raw_text_cipher, file_data_base64, file_data_cipher, profile_json, profile_json_cipher FROM resumes')
    .all();

  for (const row of rows.results ?? []) {
    const rawText = await decryptMaybe(env, row.raw_text_cipher, row.raw_text === '[encrypted]' ? '' : row.raw_text);
    const profileJson = await decryptMaybe(env, row.profile_json_cipher, row.profile_json === '{}' ? '' : row.profile_json);
    const fileData = await decryptMaybe(env, row.file_data_cipher, row.file_data_base64 ?? '');
    const rawTextCipher = isEncryptedText(row.raw_text_cipher) ? row.raw_text_cipher : await encryptText(env, rawText);
    const profileJsonCipher = isEncryptedText(row.profile_json_cipher) ? row.profile_json_cipher : await encryptText(env, profileJson || '{}');
    const fileDataCipher = fileData && !isEncryptedText(row.file_data_cipher) ? await encryptText(env, fileData) : row.file_data_cipher;

    await db
      .prepare(
        `UPDATE resumes
         SET raw_text = '[encrypted]',
             raw_text_cipher = ?,
             file_data_base64 = NULL,
             file_data_cipher = ?,
             profile_json = '{}',
             profile_json_cipher = ?
         WHERE id = ?`,
      )
      .bind(rawTextCipher, fileDataCipher ?? null, profileJsonCipher, row.id)
      .run();
  }
}

async function seedAdminUser(db, env) {
  const email = String(env.OFFERMATE_ADMIN_EMAIL ?? DEFAULT_ADMIN.email).trim().toLowerCase();
  const name = String(env.OFFERMATE_ADMIN_NAME ?? DEFAULT_ADMIN.name).trim();
  const emailLookup = await hashLookup(email);
  const passwordHash = env.OFFERMATE_ADMIN_PASSWORD_HASH ?? DEFAULT_ADMIN.passwordHash;
  const existing = await db.prepare("SELECT id FROM users WHERE role = 'admin' OR email_lookup = ? ORDER BY created_at ASC LIMIT 1").bind(emailLookup).first();
  if (existing) {
    await db
      .prepare(
        `UPDATE users
         SET email = ?,
             email_lookup = ?,
             email_cipher = ?,
             name = ?,
             name_cipher = ?,
             role = 'admin',
             password_salt = ?,
             password_hash = ?
         WHERE id = ?`,
      )
      .bind(
        maskEmail(existing.id),
        emailLookup,
        await encryptText(env, email),
        maskName(DEFAULT_ADMIN.role),
        await encryptText(env, name),
        DEFAULT_ADMIN.salt,
        passwordHash,
        existing.id,
      )
      .run();
    return;
  }

  await db
    .prepare(
      `INSERT INTO users (
        id, email, email_lookup, email_cipher, name, name_cipher, role, password_salt, password_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      DEFAULT_ADMIN.id,
      maskEmail(DEFAULT_ADMIN.id),
      emailLookup,
      await encryptText(env, email),
      maskName(DEFAULT_ADMIN.role),
      await encryptText(env, name),
      DEFAULT_ADMIN.role,
      DEFAULT_ADMIN.salt,
      passwordHash,
      nowIso(),
    )
    .run();
}

async function deleteUserCascade(db, userId) {
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
  await db.prepare('DELETE FROM applications WHERE user_id = ?').bind(userId).run();
  await db
    .prepare(
      `DELETE FROM match_scores
       WHERE run_id IN (SELECT id FROM match_runs WHERE user_id = ?)`,
    )
    .bind(userId)
    .run();
  await db.prepare('DELETE FROM match_runs WHERE user_id = ?').bind(userId).run();
  await db.prepare('DELETE FROM resumes WHERE user_id = ?').bind(userId).run();
  return db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
}

async function purgeLegacyDemoUsers(db) {
  for (const lookup of LEGACY_DEMO_USER_LOOKUPS) {
    const user = await db.prepare('SELECT id FROM users WHERE email_lookup = ?').bind(lookup).first();
    if (user?.id) {
      await deleteUserCascade(db, user.id);
    }
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

export async function ensureAppData(env) {
  const db = dbFromEnv(env);
  await executeSchema(db);
  await migrateUsersRoleCheck(db);
  await ensureUserEncryptionColumns(db, env);
  await ensureResumeEncryptionColumns(db, env);
  await seedAdminUser(db, env);
  await purgeLegacyDemoUsers(db);
  await seedJobs(db);
  return db;
}

export async function findUserByEmail(env, email) {
  const db = await ensureAppData(env);
  const lookup = await hashLookup(email);
  const row = await db.prepare('SELECT * FROM users WHERE email_lookup = ?').bind(lookup).first();
  return mapUserRow(env, row);
}

export async function findSessionUser(env, token) {
  if (!token) return null;
  const db = await ensureAppData(env);
  const row = await db
    .prepare(
      `SELECT users.id, users.email, users.email_cipher, users.name, users.name_cipher, users.role, sessions.id AS session_id
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.id = ? AND sessions.expires_at > ?`,
    )
    .bind(token, nowIso())
    .first();
  return mapUserRow(env, row);
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
        id, user_id, file_name, raw_text, raw_text_cipher, file_data_base64, file_data_cipher,
        mime_type, profile_json, profile_json_cipher, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      resumeId,
      user.id,
      fileName,
      '[encrypted]',
      await encryptText(env, rawText),
      null,
      fileDataBase64 ? await encryptText(env, fileDataBase64) : null,
      mimeType,
      '{}',
      await encryptText(env, JSON.stringify(profile)),
      createdAt,
    )
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
      `SELECT id, file_name, raw_text, raw_text_cipher, profile_json, profile_json_cipher, created_at
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
    resumes: await Promise.all(
      (resumes.results ?? []).map(async (row) => ({
        id: row.id,
        fileName: row.file_name,
        rawText: await decryptResumeRawText(env, row),
        profile: parseJson(await decryptResumeProfileJson(env, row), {}),
        createdAt: row.created_at,
      })),
    ),
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
      `SELECT users.id AS user_id, users.name, users.name_cipher, users.email, users.email_cipher,
              resumes.id AS resume_id, resumes.file_name, resumes.raw_text, resumes.raw_text_cipher,
              resumes.profile_json, resumes.profile_json_cipher, resumes.created_at
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
    const user = await mapUserRow(env, {
      id: row.user_id,
      email: row.email,
      email_cipher: row.email_cipher,
      name: row.name,
      name_cipher: row.name_cipher,
      role: 'student',
    });
    const rawText = await decryptResumeRawText(env, row);
    const profile = parseJson(await decryptResumeProfileJson(env, row), {});
    uploadedCandidates.push({
      id: row.user_id,
      name: profile?.name && profile.name !== '求职者' ? profile.name : user.name,
      email: user.email,
      resumeId: row.resume_id,
      fileName: row.file_name,
      rawText,
      profile,
      submittedJobIds: applicationsByUser.get(row.user_id) ?? [],
      resumeDownloadUrl: row.resume_id ? `/api/hr/resume-download?id=${encodeURIComponent(row.resume_id)}` : '',
      createdAt: row.created_at,
      scores: latestRun ? await listScoresForRun(db, latestRun.id) : [],
    });
  }

  return {
    seededCandidates: [],
    uploadedCandidates,
  };
}

export async function getResumeFileForHr(env, resumeId) {
  const db = await ensureAppData(env);
  const row = await db
    .prepare('SELECT id, file_name, raw_text, raw_text_cipher, file_data_base64, file_data_cipher, mime_type FROM resumes WHERE id = ?')
    .bind(resumeId)
    .first();
  if (!row) return null;

  const fileDataBase64 = await decryptResumeFileData(env, row);
  if (fileDataBase64) {
    return {
      fileName: row.file_name || `${row.id}.pdf`,
      mimeType: row.mime_type || 'application/octet-stream',
      bytes: base64ToBytes(fileDataBase64),
    };
  }

  const rawText = await decryptResumeRawText(env, row);
  return {
    fileName: `${(row.file_name || row.id).replace(/\.[^.]+$/, '')}.txt`,
    mimeType: 'text/plain;charset=utf-8',
    bytes: new TextEncoder().encode(rawText),
  };
}

export async function listAccountUsers(env) {
  const db = await ensureAppData(env);
  const rows = await db.prepare('SELECT id, email, email_cipher, name, name_cipher, role, created_at FROM users ORDER BY created_at DESC').all();
  return {
    users: await Promise.all(
      (rows.results ?? []).map(async (row) => {
        const user = await mapUserRow(env, row);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: row.created_at,
        };
      }),
    ),
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
  const emailLookup = await hashLookup(email);
  const user = {
    id: createId('user'),
    email,
    name,
    role,
    createdAt: nowIso(),
  };

  await db
    .prepare(
      `INSERT INTO users (id, email, email_lookup, email_cipher, name, name_cipher, role, password_salt, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      user.id,
      maskEmail(user.id),
      emailLookup,
      await encryptText(env, user.email),
      maskName(user.role),
      await encryptText(env, user.name),
      user.role,
      salt,
      await hashPassword(password, salt),
      user.createdAt,
    )
    .run();

  return user;
}

export function normalizeStudentRegistrationInput(input) {
  const name = String(input.name ?? '').trim();
  const email = String(input.email ?? '').trim().toLowerCase();
  const password = String(input.password ?? '');
  const confirmPassword = String(input.confirmPassword ?? password);

  if (!name || name.length > 32) {
    throw new Error('请填写 32 字以内的姓名。');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('邮箱格式不正确。');
  }
  if (password.length < 6) {
    throw new Error('密码至少 6 位。');
  }
  if (confirmPassword !== password) {
    throw new Error('两次密码输入不一致。');
  }

  return {
    name,
    email,
    password,
    role: 'student',
  };
}

export async function createStudentRegistration(env, input) {
  const userInput = normalizeStudentRegistrationInput(input);
  const existing = await findUserByEmail(env, userInput.email);
  if (existing) throw new Error('这个邮箱已经注册，请直接登录。');
  return createAccountUser(env, userInput);
}

export async function deleteAccountUser(env, currentUser, userId) {
  const db = await ensureAppData(env);
  if (!userId) throw new Error('缺少要删除的账号。');
  if (userId === currentUser.id) throw new Error('不能删除当前登录账号。');
  const target = await db.prepare('SELECT id, role FROM users WHERE id = ?').bind(userId).first();
  if (!target) throw new Error('账号不存在或已经被删除。');
  if (target.role === 'admin') {
    const adminCount = await db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").first();
    if ((adminCount?.count ?? 0) <= 1) throw new Error('至少需要保留一个管理员账号。');
  }
  await deleteUserCascade(db, userId);
  return { deletedId: userId };
}
