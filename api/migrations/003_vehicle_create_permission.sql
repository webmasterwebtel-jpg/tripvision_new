UPDATE users
SET permissions = permissions || '{"vehicles.create":true}'::jsonb
WHERE role = 'admin' AND permissions->>'vehicles.edit' = 'true';
