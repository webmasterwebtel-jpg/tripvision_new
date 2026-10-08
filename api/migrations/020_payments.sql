-- Paiement en ligne (Stripe Checkout) des réservations de voitures.
-- none : réservation sans paiement en ligne ; awaiting : en cours de paiement ; paid ; failed ; refunded.
ALTER TABLE bookings
  ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'none' CHECK (payment_status IN ('none', 'awaiting', 'paid', 'failed', 'refunded')),
  ADD COLUMN stripe_session_id TEXT,
  ADD COLUMN stripe_payment_intent TEXT,
  ADD COLUMN paid_amount NUMERIC(10, 2),
  ADD COLUMN paid_at TIMESTAMPTZ,
  ADD COLUMN cancel_token TEXT;
CREATE INDEX bookings_stripe_session_idx ON bookings (stripe_session_id);
CREATE INDEX bookings_payment_idx ON bookings (payment_status, created_at);
