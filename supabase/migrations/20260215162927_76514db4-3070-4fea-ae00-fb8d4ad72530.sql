
-- Add game progression columns to cars table
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_to_next integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS attribute_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS races_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS races_since_revision integer NOT NULL DEFAULT 0;

-- Add economy columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nitro_points integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS fuel_tanks integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS last_fuel_refill date NOT NULL DEFAULT CURRENT_DATE;
