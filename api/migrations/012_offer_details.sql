-- Détails d'une offre : galerie d'images et horaires de vol (JSON).
ALTER TABLE offers ADD COLUMN details JSONB NOT NULL DEFAULT '{}'::jsonb;
