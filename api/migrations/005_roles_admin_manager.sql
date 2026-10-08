-- Rôles : l'ancien « admin » (droits réglables) devient « manager », l'ancien « superadmin » devient « admin ».
ALTER TYPE account_role RENAME VALUE 'admin' TO 'manager';
ALTER TYPE account_role RENAME VALUE 'superadmin' TO 'admin';

UPDATE users SET email = 'manager@tripvision.fr'
WHERE email = 'admin@tripvision.fr' AND role::text = 'manager' AND deleted_at IS NULL;

UPDATE users SET email = 'admin@tripvision.fr'
WHERE email = 'superadmin@tripvision.fr' AND role::text = 'admin' AND deleted_at IS NULL;

UPDATE users SET name = 'Manager TripVision', first_name = 'Manager', last_name = 'TripVision'
WHERE email = 'manager@tripvision.fr' AND name = 'Admin TripVision';

UPDATE users SET name = 'Admin TripVision', first_name = 'Admin', last_name = 'TripVision'
WHERE email = 'admin@tripvision.fr' AND name = 'Super Admin TripVision';
