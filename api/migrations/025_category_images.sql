-- Images par défaut des catégories de voitures (modifiables dans le back-office).
UPDATE vehicle_categories SET image = '/assets/cat/mini.jpg' WHERE image IS NULL AND name = 'Mini (A)';
UPDATE vehicle_categories SET image = '/assets/cat/economique.jpg' WHERE image IS NULL AND name = 'Économique (B)';
UPDATE vehicle_categories SET image = '/assets/cat/compacte.jpg' WHERE image IS NULL AND name = 'Compacte (C)';
UPDATE vehicle_categories SET image = '/assets/cat/intermediaire.jpg' WHERE image IS NULL AND name = 'Intermédiaire (D)';
UPDATE vehicle_categories SET image = '/assets/cat/routiere.jpg' WHERE image IS NULL AND name = 'Routière (E)';
UPDATE vehicle_categories SET image = '/assets/cat/suv.jpg' WHERE image IS NULL AND name = 'SUV et Break';
UPDATE vehicle_categories SET image = '/assets/cat/monospace.jpg' WHERE image IS NULL AND name = 'Monospace ou Minibus';
UPDATE vehicle_categories SET image = '/assets/cat/utilitaire.jpg' WHERE image IS NULL AND name = 'Utilitaire / Van';
