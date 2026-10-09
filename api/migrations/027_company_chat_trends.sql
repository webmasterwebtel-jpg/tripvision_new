-- 1) Nom de l'entreprise auprès de laquelle l'offre a été prise (affiché dans le back-office).
ALTER TABLE offer_requests ADD COLUMN partner_name TEXT;
UPDATE offer_requests r SET partner_name = COALESCE(NULLIF(btrim(o.partner_name), ''), NULLIF(o.details->'flight'->>'airline', ''), 'TripVision')
FROM offers o WHERE o.id = r.offer_id;
UPDATE offer_requests SET partner_name = 'TripVision' WHERE partner_name IS NULL;

-- 2) Messagerie : plusieurs conversations par compte, ouvertes ou clôturées.
ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS chat_threads_partner_user_id_key;
ALTER TABLE chat_threads
  ADD COLUMN subject TEXT NOT NULL DEFAULT 'Conversation',
  ADD COLUMN status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  ADD COLUMN closed_at TIMESTAMPTZ,
  ADD COLUMN closed_by TEXT;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_check CHECK (sender IN ('partner', 'admin', 'system'));
CREATE INDEX chat_threads_user_idx ON chat_threads (partner_user_id, updated_at DESC);

-- 3) Tendances : pages vues, clics vers les compagnies, recherches (agrégés par mois côté serveur).
CREATE TABLE site_events (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  key TEXT NOT NULL,
  city TEXT,
  country TEXT,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX site_events_kind_idx ON site_events (kind, created_at DESC);
CREATE INDEX site_events_created_idx ON site_events (created_at DESC);
