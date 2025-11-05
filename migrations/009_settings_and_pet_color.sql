PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  theme_color TEXT,
  created_at TEXT,
  updated_at TEXT
);

INSERT OR IGNORE INTO app_settings (id, created_at, updated_at)
VALUES ('app', datetime('now'), datetime('now'));

ALTER TABLE pets ADD COLUMN theme_color TEXT;

PRAGMA foreign_keys = ON;
