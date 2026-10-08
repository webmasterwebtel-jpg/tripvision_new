-- Type de billet choisi par le client (aller simple ou aller-retour) sur un même vol.
ALTER TABLE offer_requests ADD COLUMN trip_type TEXT CHECK (trip_type IN ('roundtrip', 'oneway'));
