BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS user_settings (
  user_id    TEXT PRIMARY KEY,
  theme_color TEXT,
  email       TEXT,
  phone       TEXT,
  created_at  TEXT,
  updated_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_settings_email ON user_settings(email);

COMMIT;
