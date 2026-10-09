-- Annulation d'une location par le client : frais fixés par le loueur, déduits de l'acompte déjà réglé.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancel_fee NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_session_id TEXT;
