CREATE TABLE IF NOT EXISTS utm_entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  base       TEXT    NOT NULL,
  source     TEXT    NOT NULL,
  campaign   TEXT    NOT NULL,
  content    TEXT    NOT NULL,
  url        TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
