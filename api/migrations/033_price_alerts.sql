-- Alertes prix des clients : un trajet (départ facultatif, destination), un prix maximum facultatif.
-- Chaque offre de vol qui correspond n'est signalée qu'une fois par alerte (price_alert_hits).
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_city TEXT,
  to_city TEXT NOT NULL,
  max_price NUMERIC(10,2),
  trip_type TEXT NOT NULL DEFAULT 'any' CHECK (trip_type IN ('any', 'roundtrip', 'oneway')),
  direct_only BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  hits INTEGER NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS price_alerts_user_idx ON price_alerts(user_id);

CREATE TABLE IF NOT EXISTS price_alert_hits (
  alert_id UUID NOT NULL REFERENCES price_alerts(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (alert_id, offer_id)
);
