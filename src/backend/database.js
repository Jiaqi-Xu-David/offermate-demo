import {
  CANDIDATES,
  JOBS,
  SAMPLE_RESUME_TEXT,
  STUDENT_PROFILE,
  analyzeJobDescription,
  buildScoreExplanation,
  parseResumeText,
  rankJobs,
} from '../matcher.js';
import { hashPassword } from './auth.js';
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
        id, user_id, file_name, raw_text, profile_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind('resume-seed-davide', 'user-student-davide', 'davide-sample-resume.txt', SAMPLE_RESUME_TEXT, JSON.stringify(STUDENT_PROFILE), nowIso())
    .run();
}

export async function ensureAppData(env) {
  const db = dbFromEnv(env);
  await executeSchema(db);
  await seedUsers(db);
  await seedJobs(db);
  await seedSampleResume(db);
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

export async function createResumeAndMatchRun(env, user, { fileName, rawText }) {
  const db = await ensureAppData(env);
  const profile = parseResumeText(rawText);
  const resumeId = createId('resume');
  const runId = createId('match');
  const createdAt = nowIso();
  const jobs = await listJobs(env);
  const rankings = rankJobs(profile, jobs);

  await db
    .prepare('INSERT INTO resumes (id, user_id, file_name, raw_text, profile_json, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(resumeId, user.id, fileName, rawText, JSON.stringify(profile), createdAt)
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

  return { resume: { id: resumeId, fileName, createdAt, profile }, run: { id: runId, createdAt, scores: rankings } };
}

export async function listStudentHistory(env, user) {
  const db = await ensureAppData(env);
  const resumes = await db
    .prepare('SELECT id, file_name, profile_json, created_at FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
    .bind(user.id)
    .all();
  const runs = await db
    .prepare(
      `SELECT match_runs.id, match_runs.resume_id, match_runs.created_at, resumes.file_name
       FROM match_runs
       JOIN resumes ON resumes.id = match_runs.resume_id
       WHERE match_runs.user_id = ?
       ORDER BY match_runs.created_at DESC
       LIMIT 20`,
    )
    .bind(user.id)
    .all();

  return {
    resumes: (resumes.results ?? []).map((row) => ({
      id: row.id,
      fileName: row.file_name,
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
  const uploaded = await db
    .prepare(
      `SELECT users.id AS user_id, users.name, users.email, resumes.id AS resume_id,
              resumes.file_name, resumes.profile_json, resumes.created_at
       FROM users
       LEFT JOIN resumes ON resumes.user_id = users.id
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
      profile: parseJson(row.profile_json, {}),
      createdAt: row.created_at,
      scores: latestRun ? await listScoresForRun(db, latestRun.id) : [],
    });
  }

  return {
    seededCandidates: CANDIDATES,
    uploadedCandidates,
  };
}
