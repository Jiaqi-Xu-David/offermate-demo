CREATE TABLE IF NOT EXISTS visit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visited_at TEXT NOT NULL,
  method TEXT NOT NULL,
  host TEXT NOT NULL,
  path TEXT NOT NULL,
  query_present INTEGER NOT NULL DEFAULT 0,
  ip TEXT NOT NULL,
  visitor_cipher TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  colo TEXT,
  as_organization TEXT,
  device_type TEXT,
  browser_family TEXT,
  os_family TEXT,
  user_agent TEXT,
  referer TEXT,
  status INTEGER
);

CREATE INDEX IF NOT EXISTS idx_visit_logs_visited_at ON visit_logs (visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visit_logs_path ON visit_logs (path);

CREATE TABLE IF NOT EXISTS users (
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
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  city TEXT NOT NULL,
  salary TEXT NOT NULL,
  description TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  hard_requirements_json TEXT NOT NULL,
  soft_skills_json TEXT NOT NULL,
  language_requirements_json TEXT NOT NULL,
  responsibilities_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'seed',
  created_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  raw_text_cipher TEXT,
  file_data_base64 TEXT,
  file_data_cipher TEXT,
  mime_type TEXT,
  text_source TEXT,
  extraction_warning TEXT,
  profile_json TEXT NOT NULL,
  profile_json_cipher TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resume_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES resumes (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_scores (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  matched_tags_json TEXT NOT NULL,
  reasons_json TEXT NOT NULL,
  explanation_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES match_runs (id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  resume_id TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES resumes (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lookup ON users (email_lookup) WHERE email_lookup IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_runs_user_id ON match_runs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_scores_run_id ON match_scores (run_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications (user_id, created_at DESC);
