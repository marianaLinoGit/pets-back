-- 017_change_unique_name_vaccine_type.sql
PRAGMA foreign_keys=OFF;

UPDATE vaccine_types
SET species = CASE
  WHEN species IN ('dog','cat','other') THEN species
  ELSE 'other'
END;

UPDATE vaccine_types
SET brand = COALESCE(brand, '');

CREATE INDEX ix_vaccine_types_species_name_brand
ON vaccine_types (species, name, brand);

PRAGMA foreign_keys=ON;
