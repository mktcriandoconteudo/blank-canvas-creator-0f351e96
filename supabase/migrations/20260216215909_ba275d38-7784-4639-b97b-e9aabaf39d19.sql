
-- 1. Add license_plate and purchased_at to cars
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS license_plate TEXT UNIQUE;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- 2. Generate license plates for existing cars that don't have one
CREATE OR REPLACE FUNCTION public.generate_license_plate()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _plate TEXT;
  _exists BOOLEAN;
BEGIN
  LOOP
    -- Formato Mercosul: ABC1D23
    _plate := chr(65 + floor(random() * 26)::int)
           || chr(65 + floor(random() * 26)::int)
           || chr(65 + floor(random() * 26)::int)
           || floor(random() * 10)::int::text
           || chr(65 + floor(random() * 26)::int)
           || floor(random() * 10)::int::text
           || floor(random() * 10)::int::text;
    SELECT EXISTS(SELECT 1 FROM cars WHERE license_plate = _plate) INTO _exists;
    EXIT WHEN NOT _exists;
  END LOOP;
  RETURN _plate;
END;
$$;

-- Set plates for existing cars
UPDATE public.cars SET license_plate = public.generate_license_plate() WHERE license_plate IS NULL;

-- Make license_plate NOT NULL after backfill
ALTER TABLE public.cars ALTER COLUMN license_plate SET NOT NULL;
ALTER TABLE public.cars ALTER COLUMN license_plate SET DEFAULT '';

-- 3. Auto-generate plate on insert via trigger
CREATE OR REPLACE FUNCTION public.auto_generate_license_plate()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.license_plate IS NULL OR NEW.license_plate = '' THEN
    NEW.license_plate := public.generate_license_plate();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_license_plate
BEFORE INSERT ON public.cars
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_license_plate();

-- 4. Used marketplace table
CREATE TABLE public.used_car_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.cars(id),
  seller_wallet TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sold_at TIMESTAMP WITH TIME ZONE,
  buyer_wallet TEXT
);

ALTER TABLE public.used_car_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings readable by all" ON public.used_car_listings FOR SELECT USING (true);
CREATE POLICY "Sellers can insert listings" ON public.used_car_listings FOR INSERT
  WITH CHECK (seller_wallet = ((current_setting('request.headers', true))::json ->> 'x-wallet-address'));
CREATE POLICY "Sellers can update own listings" ON public.used_car_listings FOR UPDATE
  USING (seller_wallet = ((current_setting('request.headers', true))::json ->> 'x-wallet-address'));

-- 5. RPC: List car for sale (with 7-day check + ownership check)
CREATE OR REPLACE FUNCTION public.list_car_for_sale(_car_id UUID, _wallet TEXT, _price INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _car RECORD;
  _owned_count INTEGER;
BEGIN
  -- Check car ownership
  SELECT * INTO _car FROM cars WHERE id = _car_id AND owner_wallet = _wallet;
  IF _car IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'car_not_owned');
  END IF;

  -- Check 7-day cooldown
  IF _car.purchased_at + interval '7 days' > now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'cooldown_active',
      'days_remaining', CEIL(EXTRACT(EPOCH FROM (_car.purchased_at + interval '7 days' - now())) / 86400));
  END IF;

  -- Check not already listed
  IF EXISTS (SELECT 1 FROM used_car_listings WHERE car_id = _car_id AND status = 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_listed');
  END IF;

  -- Check not a rental car
  IF EXISTS (SELECT 1 FROM active_rentals WHERE car_id = _car_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'is_rental');
  END IF;

  -- Must have at least 1 car remaining after sale
  SELECT COUNT(*) INTO _owned_count FROM cars WHERE owner_wallet = _wallet
    AND id NOT IN (SELECT ucl.car_id FROM used_car_listings ucl WHERE ucl.status = 'active');
  IF _owned_count <= 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'must_keep_one_car');
  END IF;

  -- Create listing
  INSERT INTO used_car_listings (car_id, seller_wallet, price)
  VALUES (_car_id, _wallet, _price);

  RETURN jsonb_build_object('success', true, 'car_name', _car.name, 'price', _price);
END;
$$;

-- 6. RPC: Buy used car (with garage limit check + deflation)
CREATE OR REPLACE FUNCTION public.buy_used_car(_listing_id UUID, _wallet TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _listing RECORD;
  _balance INTEGER;
  _owned_count INTEGER;
  _burn_amount INTEGER;
  _reward_amount INTEGER;
  _treasury_amount INTEGER;
  _seller_receives INTEGER;
BEGIN
  -- Lock listing
  SELECT * INTO _listing FROM used_car_listings WHERE id = _listing_id AND status = 'active' FOR UPDATE;
  IF _listing IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'listing_not_found');
  END IF;

  -- Can't buy own car
  IF _listing.seller_wallet = _wallet THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_buy_own');
  END IF;

  -- Check garage limit (max 2 owned cars, excluding rentals)
  SELECT COUNT(*) INTO _owned_count FROM cars WHERE owner_wallet = _wallet
    AND id NOT IN (SELECT ar.car_id FROM active_rentals ar WHERE ar.is_active = true);
  IF _owned_count >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'garage_full');
  END IF;

  -- Check balance
  SELECT nitro_points INTO _balance FROM users WHERE wallet_address = _wallet;
  IF _balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;
  IF _balance < _listing.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
  END IF;

  -- Deflation: 10% burn, 10% reward pool, 80% to seller
  _burn_amount := GREATEST(1, (_listing.price * 10) / 100);
  _reward_amount := GREATEST(1, (_listing.price * 10) / 100);
  _treasury_amount := 0;
  _seller_receives := _listing.price - _burn_amount - _reward_amount;

  -- Deduct from buyer
  UPDATE users SET nitro_points = nitro_points - _listing.price WHERE wallet_address = _wallet;
  -- Credit seller (minus fees)
  UPDATE users SET nitro_points = nitro_points + _seller_receives WHERE wallet_address = _listing.seller_wallet;

  -- Economy
  UPDATE economy_state SET
    total_burned = total_burned + _burn_amount,
    reward_pool_balance = reward_pool_balance + _reward_amount,
    updated_at = now()
  WHERE id = (SELECT id FROM economy_state LIMIT 1);

  -- Transfer car ownership + reset purchased_at
  UPDATE cars SET owner_wallet = _wallet, purchased_at = now() WHERE id = _listing.car_id;

  -- Mark listing as sold
  UPDATE used_car_listings SET status = 'sold', sold_at = now(), buyer_wallet = _wallet WHERE id = _listing_id;

  -- Economy event
  INSERT INTO economy_events (event_type, amount, burn_amount, reward_amount, treasury_amount, wallet, description)
  VALUES ('transaction', _listing.price, _burn_amount, _reward_amount, _treasury_amount, _wallet, 'used_car_purchase');

  RETURN jsonb_build_object(
    'success', true,
    'price_paid', _listing.price,
    'seller_received', _seller_receives,
    'burned', _burn_amount,
    'remaining_balance', _balance - _listing.price
  );
END;
$$;

-- 7. Update buy_marketplace_car to enforce garage limit of 2
CREATE OR REPLACE FUNCTION public.buy_marketplace_car(_car_id uuid, _wallet text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _car RECORD;
  _balance integer;
  _token_id text;
  _burn_amount integer;
  _reward_amount integer;
  _treasury_amount integer;
  _owned_count integer;
BEGIN
  -- Check garage limit (max 2 owned, excluding rentals)
  SELECT COUNT(*) INTO _owned_count FROM cars WHERE owner_wallet = _wallet
    AND id NOT IN (SELECT ar.car_id FROM active_rentals ar WHERE ar.is_active = true);
  IF _owned_count >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'garage_full');
  END IF;

  SELECT * INTO _car FROM marketplace_cars WHERE id = _car_id AND sale_active = true FOR UPDATE;
  IF _car IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'car_not_available');
  END IF;

  IF _car.stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'out_of_stock');
  END IF;

  SELECT nitro_points INTO _balance FROM users WHERE wallet_address = _wallet;
  IF _balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;
  IF _balance < _car.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
  END IF;

  _token_id := '#' || floor(random() * 99999 + 1)::int;

  UPDATE users SET nitro_points = nitro_points - _car.price WHERE wallet_address = _wallet;
  UPDATE marketplace_cars SET stock = stock - 1 WHERE id = _car_id;

  _burn_amount := GREATEST(1, (_car.price * 10) / 100);
  _reward_amount := GREATEST(1, (_car.price * 20) / 100);
  _treasury_amount := _car.price - _burn_amount - _reward_amount;

  UPDATE economy_state SET
    total_burned = total_burned + _burn_amount,
    reward_pool_balance = reward_pool_balance + _reward_amount,
    treasury_balance = treasury_balance + _treasury_amount,
    updated_at = now()
  WHERE id = (SELECT id FROM economy_state LIMIT 1);

  INSERT INTO cars (token_id, owner_wallet, name, model, speed_base, acceleration_base, handling_base, durability, engine_health, level, xp, total_km)
  VALUES (_token_id, _wallet, _car.name, _car.model, _car.speed_base, _car.acceleration_base, _car.handling_base, _car.durability, 100, 1, 0, 0);

  INSERT INTO economy_events (event_type, amount, burn_amount, reward_amount, treasury_amount, wallet, description)
  VALUES ('transaction', _car.price, _burn_amount, _reward_amount, _treasury_amount, _wallet, 'marketplace_purchase_' || _car.name);

  RETURN jsonb_build_object(
    'success', true,
    'car_name', _car.name,
    'price_paid', _car.price,
    'remaining_balance', _balance - _car.price,
    'burned', _burn_amount,
    'to_reward_pool', _reward_amount,
    'to_treasury', _treasury_amount,
    'stock_remaining', _car.stock - 1
  );
END;
$$;
