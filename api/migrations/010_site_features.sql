ALTER TABLE contact_messages ADD COLUMN subject TEXT;

CREATE TABLE partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  head_office TEXT NOT NULL,
  agencies TEXT NOT NULL,
  siret TEXT NOT NULL,
  booking_email TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  kbis_name TEXT,
  phone TEXT,
  city TEXT,
  login_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX partner_applications_status_idx ON partner_applications(status, created_at DESC);

CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_email TEXT NOT NULL,
  unread_admin INT NOT NULL DEFAULT 0,
  unread_partner INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('partner', 'admin')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_thread_idx ON chat_messages(thread_id, created_at);
