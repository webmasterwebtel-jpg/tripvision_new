-- Centre de notifications : une liste par interface (équipe, partenaire, client).
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL CHECK (audience IN ('staff', 'user')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  ref_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX notifications_user_idx ON notifications (user_id, read_at, created_at DESC);
CREATE INDEX notifications_staff_idx ON notifications (audience, read_at, created_at DESC);

-- Les messages de contact non traités deviennent des notifications de l'équipe.
INSERT INTO notifications (audience, kind, title, body, ref_id, created_at)
SELECT 'staff', 'contact', 'Message de contact', name, id::text, created_at FROM contact_messages WHERE handled_at IS NULL;
