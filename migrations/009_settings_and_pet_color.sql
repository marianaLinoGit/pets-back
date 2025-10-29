BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  theme_color TEXT,
  created_at TEXT,
  updated_at TEXT
);

INSERT INTO app_settings (id, created_at, updated_at)
SELECT 'app', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE id = 'app');

PRAGMA table_info(pets);
-- adiciona coluna se ainda não existir
ALTER TABLE pets ADD COLUMN theme_color TEXT;

COMMIT;
