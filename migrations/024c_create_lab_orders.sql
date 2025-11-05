PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS lab_orders (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES vet_visits(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  lab_type_id TEXT NOT NULL REFERENCES lab_types(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lab_order_items_order ON lab_order_items(order_id);
