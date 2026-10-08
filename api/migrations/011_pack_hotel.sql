-- Un pack inclut la réservation d'un hôtel.
ALTER TABLE offers
  ADD COLUMN hotel_name TEXT,
  ADD COLUMN hotel_stars SMALLINT,
  ADD COLUMN hotel_nights SMALLINT,
  ADD COLUMN hotel_board TEXT;
