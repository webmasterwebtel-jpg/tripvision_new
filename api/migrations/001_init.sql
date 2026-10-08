CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE account_role AS ENUM ('it', 'superadmin', 'admin', 'partner', 'client');
CREATE TYPE partner_status AS ENUM ('pending', 'approved', 'inactive');
CREATE TYPE vehicle_status AS ENUM ('pending', 'approved', 'inactive');
CREATE TYPE offer_status AS ENUM ('active', 'inactive');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'inactive');
CREATE TYPE offer_type AS ENUM ('flight', 'pack');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role account_role NOT NULL,
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Qui a le droit de créer / suspendre quel rôle. Appliqué côté code (voir api/roles.js)
-- mais documenté ici : it -> it/superadmin/admin, superadmin -> admin, admin -> aucun compte.

CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status partner_status NOT NULL DEFAULT 'pending',
  legal_name TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  head_office TEXT,
  agencies TEXT,
  siret TEXT,
  booking_email TEXT NOT NULL,
  contact_email TEXT,
  manager_name TEXT NOT NULL,
  kbis_name TEXT,
  login_id TEXT,
  phone TEXT,
  city TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX partners_status_idx ON partners(status) WHERE deleted_at IS NULL;

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  status vehicle_status NOT NULL DEFAULT 'pending',
  model TEXT NOT NULL,
  category TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  price_day NUMERIC(10,2) NOT NULL,
  price_week NUMERIC(10,2) NOT NULL,
  price_month NUMERIC(10,2) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX vehicles_search_idx ON vehicles(status, category) WHERE deleted_at IS NULL;
CREATE INDEX vehicles_partner_idx ON vehicles(partner_id);

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type offer_type NOT NULL,
  title TEXT NOT NULL,
  from_city TEXT,
  to_city TEXT NOT NULL,
  country TEXT,
  badge TEXT,
  price NUMERIC(10,2) NOT NULL,
  old_price NUMERIC(10,2),
  partner_name TEXT,
  image TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status offer_status NOT NULL DEFAULT 'active',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX offers_status_idx ON offers(status, type);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  pickup_address TEXT,
  return_address TEXT,
  start_date DATE,
  start_time TEXT,
  end_date DATE,
  end_time TEXT,
  driver_age INT,
  message TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bookings_vehicle_idx ON bookings(vehicle_id);
CREATE INDEX bookings_email_idx ON bookings(customer_email);

-- Traçabilité (qui a fait quoi) — lu par les rôles superadmin/it.
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON audit_logs(created_at DESC);

-- Anti-bruteforce login (compteur glissant sur 15 min, voir api/security.js)
CREATE TABLE login_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_window_idx ON login_attempts(created_at);

-- Historique des connexions (qui, quand, depuis où) — visible par IT.
CREATE TABLE login_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX login_history_user_idx ON login_history(user_id, created_at DESC);
