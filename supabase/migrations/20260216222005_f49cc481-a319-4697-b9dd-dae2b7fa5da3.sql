
-- Tabela para rastrear compras de caixa surpresa (cooldown 30 dias)
CREATE TABLE public.mystery_box_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  car_id UUID REFERENCES public.cars(id),
  car_name TEXT NOT NULL DEFAULT '',
  rarity TEXT NOT NULL DEFAULT 'common',
  price_paid INTEGER NOT NULL DEFAULT 800,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mystery_box_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own box purchases"
  ON public.mystery_box_purchases FOR SELECT
  USING (wallet_address = (current_setting('request.headers'::text, true)::json ->> 'x-wallet-address'));

CREATE POLICY "System can insert box purchases"
  ON public.mystery_box_purchases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all box purchases"
  ON public.mystery_box_purchases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RPC para comprar caixa surpresa
CREATE OR REPLACE FUNCTION public.buy_mystery_box(_wallet TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _balance INTEGER;
  _price INTEGER := 800;
  _owned_count INTEGER;
  _last_purchase TIMESTAMP WITH TIME ZONE;
  _days_remaining INTEGER;
  _roll NUMERIC;
  _rarity TEXT;
  _car RECORD;
  _token_id TEXT;
  _new_car_id UUID;
  _burn_amount INTEGER;
  _reward_amount INTEGER;
  _treasury_amount INTEGER;
BEGIN
  -- Check garage limit (max 2 owned, excluding rentals)
  SELECT COUNT(*) INTO _owned_count FROM cars WHERE owner_wallet = _wallet
    AND id NOT IN (SELECT ar.car_id FROM active_rentals ar WHERE ar.is_active = true);
  IF _owned_count >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'garage_full');
  END IF;

  -- Check 30-day cooldown
  SELECT created_at INTO _last_purchase FROM mystery_box_purchases
    WHERE wallet_address = _wallet ORDER BY created_at DESC LIMIT 1;
  IF _last_purchase IS NOT NULL AND _last_purchase + interval '30 days' > now() THEN
    _days_remaining := CEIL(EXTRACT(EPOCH FROM (_last_purchase + interval '30 days' - now())) / 86400);
    RETURN jsonb_build_object('success', false, 'error', 'cooldown_active', 'days_remaining', _days_remaining);
  END IF;

  -- Check balance
  SELECT nitro_points INTO _balance FROM users WHERE wallet_address = _wallet;
  IF _balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;
  IF _balance < _price THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
  END IF;

  -- Roll rarity: 60% common, 25% uncommon, 10% rare, 5% legendary
  _roll := random() * 100;
  IF _roll < 5 THEN
    _rarity := 'legendary';
  ELSIF _roll < 15 THEN
    _rarity := 'rare';
  ELSIF _roll < 40 THEN
    _rarity := 'uncommon';
  ELSE
    _rarity := 'common';
  END IF;

  -- Pick random car from marketplace matching rarity (with stock > 0 and active)
  SELECT * INTO _car FROM marketplace_cars
    WHERE rarity = _rarity AND sale_active = true AND stock > 0
    ORDER BY random() LIMIT 1;

  -- Fallback: if no car found for that rarity, try any available car
  IF _car IS NULL THEN
    SELECT * INTO _car FROM marketplace_cars
      WHERE sale_active = true AND stock > 0
      ORDER BY random() LIMIT 1;
  END IF;

  IF _car IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_cars_available');
  END IF;

  -- Deduct NP
  UPDATE users SET nitro_points = nitro_points - _price WHERE wallet_address = _wallet;

  -- Deflation: 15% burn, 20% reward pool, 65% treasury (more aggressive than normal purchase)
  _burn_amount := GREATEST(1, (_price * 15) / 100);
  _reward_amount := GREATEST(1, (_price * 20) / 100);
  _treasury_amount := _price - _burn_amount - _reward_amount;

  UPDATE economy_state SET
    total_burned = total_burned + _burn_amount,
    reward_pool_balance = reward_pool_balance + _reward_amount,
    treasury_balance = treasury_balance + _treasury_amount,
    updated_at = now()
  WHERE id = (SELECT id FROM economy_state LIMIT 1);

  -- Reduce stock
  UPDATE marketplace_cars SET stock = stock - 1 WHERE id = _car.id;

  -- Generate token_id
  _token_id := '#M' || floor(random() * 99999 + 1)::int;

  -- Create car for player
  INSERT INTO cars (token_id, owner_wallet, name, model, speed_base, acceleration_base, handling_base, durability, engine_health, level, xp, total_km)
  VALUES (_token_id, _wallet, _car.name, _car.model, _car.speed_base, _car.acceleration_base, _car.handling_base, _car.durability, 100, 1, 0, 0)
  RETURNING id INTO _new_car_id;

  -- Record box purchase
  INSERT INTO mystery_box_purchases (wallet_address, car_id, car_name, rarity, price_paid)
  VALUES (_wallet, _new_car_id, _car.name, _rarity, _price);

  -- Economy event
  INSERT INTO economy_events (event_type, amount, burn_amount, reward_amount, treasury_amount, wallet, description)
  VALUES ('transaction', _price, _burn_amount, _reward_amount, _treasury_amount, _wallet, 'mystery_box_' || _rarity);

  RETURN jsonb_build_object(
    'success', true,
    'car_name', _car.name,
    'rarity', _rarity,
    'model', _car.model,
    'image_key', _car.image_key,
    'speed', _car.speed_base,
    'acceleration', _car.acceleration_base,
    'handling', _car.handling_base,
    'price_paid', _price,
    'remaining_balance', _balance - _price,
    'burned', _burn_amount
  );
END;
$$;
