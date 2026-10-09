-- Réservation d'un pack avec paiement en ligne (Stripe Checkout) : même suivi que les réservations de voitures.
ALTER TABLE offer_requests
  ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN stripe_session_id TEXT,
  ADD COLUMN stripe_payment_intent TEXT,
  ADD COLUMN paid_amount NUMERIC(10,2),
  ADD COLUMN paid_at TIMESTAMPTZ,
  ADD COLUMN cancel_token TEXT;
CREATE INDEX offer_requests_session_idx ON offer_requests (stripe_session_id);
