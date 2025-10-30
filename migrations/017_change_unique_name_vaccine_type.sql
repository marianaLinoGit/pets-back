BEGIN TRANSACTION;

/* 1) Garante a coluna updated_at (a created_at você já tem) */
ALTER TABLE vaccine_types ADD COLUMN updated_at TEXT;

/* 2) Backfill de updated_at */
UPDATE vaccine_types
   SET updated_at = COALESCE(updated_at, strftime('%Y-%m-%d','now'));

/* 3) Normalizações leves que não quebram FK */
UPDATE vaccine_types
   SET species = CASE WHEN species IN ('dog','cat','other') THEN species ELSE 'other' END;

UPDATE vaccine_types
   SET brand = COALESCE(brand, '');

/* 4) Índice para buscas — NÃO é UNIQUE */
CREATE INDEX IF NOT EXISTS ix_vaccine_types_species_name_brand
  ON vaccine_types (species, name, brand);

/* 5) Trigger p/ atualizar updated_at a cada UPDATE */
DROP TRIGGER IF EXISTS trg_vaccine_types_updated_at;
CREATE TRIGGER trg_vaccine_types_updated_at
AFTER UPDATE ON vaccine_types
BEGIN
  UPDATE vaccine_types
     SET updated_at = strftime('%Y-%m-%d','now')
   WHERE id = NEW.id;
END;

COMMIT;
