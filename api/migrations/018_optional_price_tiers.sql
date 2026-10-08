-- Les tarifs semaine et mois sont facultatifs : c'est le loueur qui décide des paliers qu'il propose (le tarif annuel est stocké dans les détails).
ALTER TABLE vehicles ALTER COLUMN price_week DROP NOT NULL, ALTER COLUMN price_month DROP NOT NULL;
