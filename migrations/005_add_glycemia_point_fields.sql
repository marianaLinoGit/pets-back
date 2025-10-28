ALTER TABLE glycemic_curve_points
  ADD COLUMN glucose_str TEXT CHECK (glucose_str IN ('HI'));

ALTER TABLE glycemic_curve_points
  ADD COLUMN dosage_clicks INTEGER;

ALTER TABLE glycemic_curve_points
  ADD COLUMN notes TEXT;
