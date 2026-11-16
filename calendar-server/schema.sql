CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  events TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
