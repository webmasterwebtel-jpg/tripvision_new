-- Carnet de contacts pour le mailing : une ligne par adresse e-mail (vols sans compte, comptes, packs, voitures, newsletter, messages).
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  sources TEXT[] NOT NULL DEFAULT '{}',
  consent BOOLEAN NOT NULL DEFAULT false,
  consent_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  requests_count INT NOT NULL DEFAULT 0,
  unsub_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '') UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX contacts_email_idx ON contacts (lower(email));
CREATE INDEX contacts_seen_idx ON contacts (last_seen_at DESC);

-- Reprise de l'existant (sans accord marketing sauf inscription à la newsletter).
INSERT INTO contacts (email, name, phone, sources, consent, consent_at, requests_count, created_at, last_seen_at)
SELECT lower(customer_email), max(customer_name), max(customer_phone), ARRAY[CASE WHEN max(offer_type) = 'flight' THEN 'vol' ELSE 'pack' END], false, NULL, count(*), min(created_at), max(created_at)
FROM offer_requests GROUP BY lower(customer_email)
ON CONFLICT DO NOTHING;
INSERT INTO contacts (email, name, phone, sources, requests_count, created_at, last_seen_at)
SELECT lower(customer_email), max(customer_name), max(customer_phone), ARRAY['voiture'], count(*), min(created_at), max(created_at)
FROM bookings GROUP BY lower(customer_email)
ON CONFLICT (lower(email)) DO UPDATE SET sources = (SELECT array_agg(DISTINCT x) FROM unnest(contacts.sources || ARRAY['voiture']) x);
INSERT INTO contacts (email, name, sources, created_at, last_seen_at)
SELECT lower(email), name, ARRAY['compte'], created_at, created_at FROM users WHERE role = 'client' AND deleted_at IS NULL
ON CONFLICT (lower(email)) DO UPDATE SET sources = (SELECT array_agg(DISTINCT x) FROM unnest(contacts.sources || ARRAY['compte']) x), name = COALESCE(contacts.name, EXCLUDED.name);
INSERT INTO contacts (email, sources, consent, consent_at, created_at, last_seen_at)
SELECT lower(email), ARRAY['newsletter'], true, created_at, created_at, created_at FROM newsletter_subscribers
ON CONFLICT (lower(email)) DO UPDATE SET consent = true, consent_at = COALESCE(contacts.consent_at, now()), sources = (SELECT array_agg(DISTINCT x) FROM unnest(contacts.sources || ARRAY['newsletter']) x);

-- Les managers existants peuvent consulter et exporter les contacts.
UPDATE users SET permissions = permissions || '{"mailing.export": true}'::jsonb WHERE role = 'manager';
