-- Renouvellement automatique des brouillons de vols (toutes les 48 h) : mémoire de la dernière exécution.
-- La première exécution a lieu 48 h après la mise en place.
CREATE TABLE IF NOT EXISTS job_runs (
  name TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_created INTEGER NOT NULL DEFAULT 0,
  last_replaced INTEGER NOT NULL DEFAULT 0,
  last_by TEXT
);
INSERT INTO job_runs(name) VALUES ('auto_drafts') ON CONFLICT DO NOTHING;
