BEGIN TRANSACTION;

ALTER TABLE vaccine_types ADD COLUMN name_biz TEXT;

UPDATE vaccine_types
   SET name_biz = COALESCE(name_biz, name);

CREATE INDEX IF NOT EXISTS ix_vaccine_types_species_namebiz_brand
  ON vaccine_types (species, name_biz, brand);

COMMIT;
