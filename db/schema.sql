CREATE TABLE IF NOT EXISTS visit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visited_at TEXT NOT NULL,
  method TEXT NOT NULL,
  host TEXT NOT NULL,
  path TEXT NOT NULL,
  query_present INTEGER NOT NULL DEFAULT 0,
  ip TEXT NOT NULL,
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
