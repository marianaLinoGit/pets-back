BEGIN TRANSACTION;

ALTER TABLE vaccine_applications ADD COLUMN brand TEXT;

UPDATE vaccine_applications AS a
SET brand = (
  SELECT COALESCE(t.brand, '')
  FROM vaccine_types t
  WHERE t.id = a.vaccine_type_id
)
WHERE brand IS NULL;

UPDATE vaccine_applications
SET brand = COALESCE(brand, '');

COMMIT;
