-- Activation du compte par e-mail, commission TripVision payée en ligne, mailing réservé aux réservations de vols.
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
UPDATE users SET email_verified_at = now();

ALTER TABLE auth_tokens DROP CONSTRAINT IF EXISTS auth_tokens_purpose_check;
ALTER TABLE auth_tokens ADD CONSTRAINT auth_tokens_purpose_check CHECK (purpose IN ('invite', 'reset', 'verify'));

-- Montant payé en ligne (commission) ; le solde se règle au loueur au retrait du véhicule.
ALTER TABLE bookings ADD COLUMN commission_amount NUMERIC(10, 2);

-- Le carnet de contacts ne garde que les personnes ayant réservé un vol.
DELETE FROM contacts WHERE NOT ('vol' = ANY(sources));
UPDATE contacts SET sources = ARRAY['vol'];
