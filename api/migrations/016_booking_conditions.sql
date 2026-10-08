-- Réservation : conditions du loueur acceptées (figées au jour de la réservation), options et total estimé.
ALTER TABLE bookings
  ADD COLUMN extras JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN conditions_snapshot JSONB,
  ADD COLUMN conditions_accepted_at TIMESTAMPTZ,
  ADD COLUMN total_estimate NUMERIC(10, 2);
