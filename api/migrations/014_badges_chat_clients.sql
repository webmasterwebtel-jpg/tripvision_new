-- Suivi « vu / non vu » pour les badges, et messagerie ouverte aux clients.
ALTER TABLE bookings
  ADD COLUMN status_changed_at TIMESTAMPTZ,
  ADD COLUMN staff_seen_at TIMESTAMPTZ,
  ADD COLUMN partner_seen_at TIMESTAMPTZ,
  ADD COLUMN client_seen_at TIMESTAMPTZ;
-- Les réservations déjà présentes sont considérées comme vues.
UPDATE bookings SET staff_seen_at = now(), partner_seen_at = now(), client_seen_at = now();

ALTER TABLE offer_requests
  ADD COLUMN status_changed_at TIMESTAMPTZ,
  ADD COLUMN staff_seen_at TIMESTAMPTZ,
  ADD COLUMN client_seen_at TIMESTAMPTZ;
UPDATE offer_requests SET staff_seen_at = now(), client_seen_at = now();

ALTER TABLE chat_threads ADD COLUMN kind TEXT NOT NULL DEFAULT 'partner' CHECK (kind IN ('partner', 'client'));
