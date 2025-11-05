-- amplia species para aceitar 'dog_cat' em vaccine_types
PRAGMA foreign_keys = OFF;

PRAGMA foreign_keys=OFF;

CREATE TABLE _vaccine_types_new (
  id           TEXT PRIMARY KEY NOT NULL,
  name         TEXT NOT NULL,                -- livre, não-único
  name_biz     TEXT NOT NULL,                -- usado na UI e em unique composta
  species      TEXT NOT NULL CHECK (species IN ('dog','cat','dog_cat','other')),
  total_doses  INTEGER NOT NULL,
  brand        TEXT,
  description  TEXT,
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO _vaccine_types_new (
  id, name, name_biz, species, total_doses, brand, description, notes, created_at, updated_at
)
SELECT
  id, name, name_biz, species, total_doses, brand, description, notes, created_at, updated_at
FROM vaccine_types;

DROP TABLE vaccine_types;
ALTER TABLE _vaccine_types_new RENAME TO vaccine_types;

-- mesma regra de unicidade composta (espécie + name_biz + brand normalizada)
CREATE UNIQUE INDEX IF NOT EXISTS ux_vt_species_name_brand
  ON vaccine_types (species, name_biz, COALESCE(brand,''));

PRAGMA foreign_keys=ON;

PRAGMA foreign_keys = ON;
