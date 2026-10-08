ALTER TABLE users
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT,
  ADD COLUMN phone TEXT;

UPDATE users
SET first_name = split_part(name, ' ', 1),
    last_name = NULLIF(btrim(substr(name, length(split_part(name, ' ', 1)) + 1)), '')
WHERE first_name IS NULL;
