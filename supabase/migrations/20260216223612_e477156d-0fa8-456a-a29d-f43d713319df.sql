-- Add per-car fuel system
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS fuel_tanks integer NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS last_fuel_refill timestamptz NOT NULL DEFAULT now();

-- Initialize existing cars with full fuel
UPDATE public.cars SET fuel_tanks = 5, last_fuel_refill = now() WHERE fuel_tanks = 5;