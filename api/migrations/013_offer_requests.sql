-- Demandes de réservation de vols et de packs, suivies côté client et côté back-office.
CREATE TABLE offer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  offer_type TEXT NOT NULL,
  offer_title TEXT NOT NULL,
  summary TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  travelers INT NOT NULL DEFAULT 1,
  total NUMERIC(10, 2),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX offer_requests_email_idx ON offer_requests (lower(customer_email));
CREATE INDEX offer_requests_status_idx ON offer_requests (status, created_at DESC);
