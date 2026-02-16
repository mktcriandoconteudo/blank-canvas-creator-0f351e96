
-- Remove duplicates: keep only the oldest entry of each car name
DELETE FROM marketplace_cars
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id
  FROM marketplace_cars
  ORDER BY name, created_at ASC
);

-- Set Thunder Bolt stock to 10 so the user can test purchases
UPDATE marketplace_cars SET stock = 10 WHERE name = 'Thunder Bolt';
