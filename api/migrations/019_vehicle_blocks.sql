-- Périodes pendant lesquelles un véhicule n'est pas disponible (saisies par le loueur).
-- Dates locales sans fuseau : ce sont des horaires d'agence.
CREATE TABLE vehicle_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX vehicle_blocks_idx ON vehicle_blocks (vehicle_id, start_at, end_at);
