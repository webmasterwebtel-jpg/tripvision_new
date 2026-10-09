-- La page Réglages disparaît : le prix de la protection se règle avec la franchise (page Annonces véhicules).
-- Les comptes qui pouvaient modifier les réglages gardent ce pouvoir via le droit « franchise ».
UPDATE users SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"franchise.manage": true}'::jsonb
 WHERE role IN ('manager', 'admin') AND (permissions->>'settings.manage') = 'true';
