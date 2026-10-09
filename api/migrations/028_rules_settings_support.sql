-- 1) Réglages du site : prix fixe de la protection de la franchise, identique pour toutes les voitures.
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);
INSERT INTO site_settings (key, value) VALUES ('franchise_protection_per_day', '7') ON CONFLICT (key) DO NOTHING;
UPDATE users SET permissions = permissions || '{"settings.manage": true}'::jsonb
  WHERE role = 'manager' AND (permissions->>'categories.manage') = 'true';

-- 2) Vols : adresse e-mail laissée par le visiteur avant l'ouverture du site de la compagnie.
CREATE TABLE IF NOT EXISTS flight_leads (
  id BIGSERIAL PRIMARY KEY,
  offer_id UUID,
  airline TEXT,
  route TEXT,
  email TEXT NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS flight_leads_created_idx ON flight_leads (created_at DESC);

-- 3) Messagerie : statuts (ouverte, en attente du client, clôturée), attribution, notes internes, réponses types, note de satisfaction.
ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS chat_threads_status_check;
ALTER TABLE chat_threads ADD CONSTRAINT chat_threads_status_check CHECK (status IN ('open', 'pending', 'closed'));
ALTER TABLE chat_threads
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_name TEXT,
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_comment TEXT,
  ADD COLUMN IF NOT EXISTS auto_closed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_check CHECK (sender IN ('partner', 'admin', 'system', 'note'));
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS author TEXT,
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE IF NOT EXISTS chat_canned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO chat_canned (title, body, created_by) VALUES
  ('Prise en charge', 'Bonjour, merci pour votre message. Nous prenons votre demande en charge et revenons vers vous très vite.', 'TripVision'),
  ('Précisions demandées', 'Bonjour, pour avancer pouvez-vous nous préciser la référence de la réservation concernée et ce que vous avez constaté ?', 'TripVision'),
  ('Problème résolu', 'Bonjour, le point est réglé de notre côté. N’hésitez pas à nous écrire si besoin, bonne continuation !', 'TripVision');
