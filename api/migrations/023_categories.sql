-- Catégories de véhicules gérées par l'IT et les managers (nom + image affichés sur le site public).
CREATE TABLE vehicle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image TEXT,
  position INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX vehicle_categories_name_idx ON vehicle_categories (lower(name));

INSERT INTO vehicle_categories (name, position) VALUES
  ('Mini (A)', 1), ('Économique (B)', 2), ('Compacte (C)', 3), ('Intermédiaire (D)', 4),
  ('Routière (E)', 5), ('SUV et Break', 6), ('Monospace ou Minibus', 7), ('Utilitaire / Van', 8);
-- Les catégories déjà utilisées par des annonces existantes restent disponibles.
INSERT INTO vehicle_categories (name, position)
SELECT DISTINCT category, 20 FROM vehicles WHERE deleted_at IS NULL AND category IS NOT NULL AND lower(category) NOT IN (SELECT lower(name) FROM vehicle_categories);

UPDATE users SET permissions = permissions || '{"categories.manage": true}'::jsonb WHERE role = 'manager';
