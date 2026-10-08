-- Une annonce peut appartenir à TripVision lui-même (aucun partenaire).
ALTER TABLE vehicles ALTER COLUMN partner_id DROP NOT NULL;
