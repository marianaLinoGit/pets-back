ALTER TABLE vaccine_types ADD COLUMN species TEXT NOT NULL DEFAULT 'other' CHECK (species IN ('dog','cat','other'));
ALTER TABLE vaccine_types ADD COLUMN brand TEXT;
ALTER TABLE vaccine_types ADD COLUMN notes TEXT;

CREATE INDEX IF NOT EXISTS idx_vaccine_types_species ON vaccine_types(species);
