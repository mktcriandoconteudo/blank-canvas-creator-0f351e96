
-- ═══ 1. RENTAL CARS TABLE ═══
CREATE TABLE public.rental_cars (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  model text NOT NULL DEFAULT 'standard',
  rarity text NOT NULL DEFAULT 'common',
  rental_price integer NOT NULL DEFAULT 50,
  races_limit integer NOT NULL DEFAULT 5,
  speed_base integer NOT NULL DEFAULT 50,
  acceleration_base integer NOT NULL DEFAULT 50,
  handling_base integer NOT NULL DEFAULT 50,
  durability integer NOT NULL DEFAULT 80,
  image_key text NOT NULL DEFAULT 'car-thunder',
  available boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rental_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rental cars readable by all" ON public.rental_cars FOR SELECT USING (true);
CREATE POLICY "Admins can insert rental cars" ON public.rental_cars FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update rental cars" ON public.rental_cars FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- ═══ 2. ACTIVE RENTALS TABLE ═══
CREATE TABLE public.active_rentals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  rental_car_id uuid NOT NULL REFERENCES public.rental_cars(id),
  owner_wallet text NOT NULL,
  races_remaining integer NOT NULL DEFAULT 5,
  rented_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.active_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rentals" ON public.active_rentals FOR SELECT USING (true);
CREATE POLICY "System can insert rentals" ON public.active_rentals FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update rentals" ON public.active_rentals FOR UPDATE USING (true);

-- ═══ 3. INSERT THUNDER BOLT RENTAL ═══
INSERT INTO public.rental_cars (name, model, rarity, rental_price, races_limit, speed_base, acceleration_base, handling_base, durability, image_key, available)
VALUES ('Thunder Bolt', 'sport', 'common', 80, 5, 55, 50, 60, 75, 'car-thunder', true);

-- ═══ 4. RENT CAR RPC WITH DEFLATION ═══
CREATE OR REPLACE FUNCTION public.rent_car(_rental_car_id uuid, _wallet text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _rental RECORD;
  _balance integer;
  _token_id text;
  _car_id uuid;
  _burn_amount integer;
  _reward_amount integer;
  _treasury_amount integer;
BEGIN
  -- Buscar carro de aluguel
  SELECT * INTO _rental FROM rental_cars WHERE id = _rental_car_id AND available = true;
  IF _rental IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'rental_not_available');
  END IF;

  -- Verificar se já tem aluguel ativo
  IF EXISTS (SELECT 1 FROM active_rentals WHERE owner_wallet = _wallet AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_renting');
  END IF;

  -- Verificar saldo
  SELECT nitro_points INTO _balance FROM users WHERE wallet_address = _wallet;
  IF _balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;
  IF _balance < _rental.rental_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
  END IF;

  -- Gerar token_id
  _token_id := '#R' || floor(random() * 99999 + 1)::int;

  -- Deduzir NP
  UPDATE users SET nitro_points = nitro_points - _rental.rental_price WHERE wallet_address = _wallet;

  -- Deflação: 15% burn, 25% reward pool, 60% treasury (mais agressivo que compra)
  _burn_amount := GREATEST(1, (_rental.rental_price * 15) / 100);
  _reward_amount := GREATEST(1, (_rental.rental_price * 25) / 100);
  _treasury_amount := _rental.rental_price - _burn_amount - _reward_amount;

  UPDATE economy_state SET
    total_burned = total_burned + _burn_amount,
    reward_pool_balance = reward_pool_balance + _reward_amount,
    treasury_balance = treasury_balance + _treasury_amount,
    updated_at = now()
  WHERE id = (SELECT id FROM economy_state LIMIT 1);

  -- Criar carro temporário (stats reduzidos vs compra)
  INSERT INTO cars (token_id, owner_wallet, name, model, speed_base, acceleration_base, handling_base, durability, engine_health, level, xp, total_km, fuel_tanks)
  VALUES (_token_id, _wallet, _rental.name || ' (Aluguel)', _rental.model, _rental.speed_base, _rental.acceleration_base, _rental.handling_base, _rental.durability, 85, 1, 0, 0, _rental.races_limit)
  RETURNING id INTO _car_id;

  -- Criar registro de aluguel
  INSERT INTO active_rentals (car_id, rental_car_id, owner_wallet, races_remaining)
  VALUES (_car_id, _rental_car_id, _wallet, _rental.races_limit);

  -- Registrar evento econômico
  INSERT INTO economy_events (event_type, amount, burn_amount, reward_amount, treasury_amount, wallet, description)
  VALUES ('transaction', _rental.rental_price, _burn_amount, _reward_amount, _treasury_amount, _wallet, 'rental_' || _rental.name);

  RETURN jsonb_build_object(
    'success', true,
    'car_name', _rental.name,
    'races_limit', _rental.races_limit,
    'price_paid', _rental.rental_price,
    'remaining_balance', _balance - _rental.rental_price,
    'burned', _burn_amount
  );
END;
$function$;

-- ═══ 5. ADD fuel_tanks COLUMN TO cars IF NOT EXISTS ═══
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'fuel_tanks') THEN
    ALTER TABLE public.cars ADD COLUMN fuel_tanks integer NOT NULL DEFAULT 5;
  END IF;
END $$;

-- ═══ 6. RESET ALL PLAYERS ═══
-- Remove all cars
DELETE FROM active_rentals;
DELETE FROM collision_events;
DELETE FROM car_insurance;
DELETE FROM insurance_claims;
DELETE FROM cars;

-- Set NP to 100 (enough to rent at 80, not enough to buy at 500+)
UPDATE users SET nitro_points = 100, total_races = 0, total_wins = 0, total_losses = 0, fuel_tanks = 5;

-- ═══ 7. UPDATE handle_new_user TO GIVE 100 NP ═══
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _wallet text;
BEGIN
  _wallet := '0x' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);

  INSERT INTO public.users (auth_id, wallet_address, username, nitro_points)
  VALUES (
    NEW.id,
    _wallet,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Piloto'),
    100
  );

  RETURN NEW;
END;
$function$;
