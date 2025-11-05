PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS pets_new;

CREATE TABLE pets_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  gender TEXT,
  coat TEXT,
  microchip TEXT,
  birth_date TEXT,
  adoption_date TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

INSERT INTO pets_new (
  id, name, species, breed, gender, coat, microchip, birth_date, adoption_date, is_active, created_at, updated_at
)
SELECT
  id,
  name,
  species,
  breed,
  gender,
  coat,
  microchip,
  CASE
    WHEN birth_year IS NOT NULL AND birth_month IS NOT NULL AND birth_day IS NOT NULL
    THEN printf('%04d-%02d-%02d', birth_year, birth_month, birth_day)
    ELSE NULL
  END AS birth_date,
  adoption_date,
  1 AS is_active,
  created_at,
  updated_at
FROM pets;

DROP TABLE pets;
ALTER TABLE pets_new RENAME TO pets;

CREATE INDEX IF NOT EXISTS idx_pets_name ON pets(name);
CREATE INDEX IF NOT EXISTS idx_pets_birth_date ON pets(birth_date);
CREATE INDEX IF NOT EXISTS idx_pets_adoption_date ON pets(adoption_date);
CREATE INDEX IF NOT EXISTS idx_pets_species ON pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_gender ON pets(gender);

PRAGMA foreign_keys = ON;
