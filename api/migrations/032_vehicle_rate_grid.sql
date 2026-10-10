-- Tarifs des voitures : une grille de 5 paliers (prix par jour selon la durée totale), des saisons et des règles.
-- Les annonces existantes gardent leur prix par jour sur tous les paliers (même prix qu'avant pour le client).
UPDATE vehicles
   SET details = COALESCE(details, '{}'::jsonb) || jsonb_build_object('rates', jsonb_build_object(
         'tiers', jsonb_build_array(price_day, price_day, price_day, price_day, price_day),
         'seasons', '[]'::jsonb, 'minDays', 1, 'maxDays', 30, 'grace', 59, 'smoothing', true))
 WHERE NOT (COALESCE(details, '{}'::jsonb) ? 'rates') AND price_day IS NOT NULL;
