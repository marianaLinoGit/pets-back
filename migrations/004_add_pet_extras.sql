ALTER TABLE pets ADD COLUMN coat TEXT;
ALTER TABLE pets ADD COLUMN microchip TEXT;
ALTER TABLE pets ADD COLUMN adoption_date TEXT;
CREATE INDEX IF NOT EXISTS idx_pets_microchip ON pets(microchip);
