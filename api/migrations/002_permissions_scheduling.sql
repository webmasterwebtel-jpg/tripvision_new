ALTER TABLE users
  ADD COLUMN permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN reset_requested_at TIMESTAMPTZ;

UPDATE users SET permissions = '{"vehicles.edit":true,"offers.create":true,"offers.edit":true,"bookings.manage":true}'::jsonb
WHERE role = 'admin';

ALTER TABLE offers
  ADD COLUMN publish_at TIMESTAMPTZ,
  ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE vehicles
  ADD COLUMN publish_at TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
CREATE UNIQUE INDEX users_email_active_idx ON users(email) WHERE deleted_at IS NULL;
