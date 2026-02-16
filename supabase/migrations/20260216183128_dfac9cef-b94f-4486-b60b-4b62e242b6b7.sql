
-- Add stock column to marketplace_cars
ALTER TABLE public.marketplace_cars ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;

-- Insert all 8 car models if they don't exist yet
INSERT INTO public.marketplace_cars (name, model, rarity, price, speed_base, acceleration_base, handling_base, durability, image_key, sale_active, stock)
VALUES
  ('Phantom X9', 'hypercar', 'legendary', 2500, 55, 88, 70, 100, 'car-phantom', false, 0),
  ('Inferno GT', 'muscle', 'epic', 1200, 78, 92, 65, 100, 'car-inferno', false, 0),
  ('Solar Flare', 'racer', 'legendary', 3200, 98, 85, 75, 100, 'car-solar', false, 0),
  ('Blaze Runner', 'turbo', 'legendary', 2800, 92, 95, 68, 100, 'car-blaze', false, 0),
  ('Frost Byte', 'gt_sport', 'epic', 1450, 85, 80, 82, 100, 'car-frost', false, 0),
  ('Venom Strike', 'street', 'epic', 980, 82, 78, 72, 100, 'car-venom', false, 0),
  ('Eclipse Nova', 'coupe', 'rare', 750, 70, 68, 78, 100, 'car-eclipse', false, 0),
  ('Thunder Bolt', 'sport', 'common', 500, 60, 55, 65, 100, 'car-thunder', false, 0)
ON CONFLICT DO NOTHING;

-- Update buy_marketplace_car to check and decrement stock
CREATE OR REPLACE FUNCTION public.buy_marketplace_car(_car_id uuid, _wallet text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _car RECORD;
  _balance integer;
  _token_id text;
  _burn_amount integer;
  _reward_amount integer;
  _treasury_amount integer;
BEGIN
  -- Buscar carro no catálogo (lock row for update)
  SELECT * INTO _car FROM marketplace_cars WHERE id = _car_id AND sale_active = true FOR UPDATE;
  IF _car IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'car_not_available');
  END IF;

  -- Verificar estoque
  IF _car.stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'out_of_stock');
  END IF;

  -- Verificar saldo
  SELECT nitro_points INTO _balance FROM users WHERE wallet_address = _wallet;
  IF _balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;
  IF _balance < _car.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
  END IF;

  -- Gerar token_id único
  _token_id := '#' || floor(random() * 99999 + 1)::int;

  -- Deduzir NP do jogador
  UPDATE users SET nitro_points = nitro_points - _car.price WHERE wallet_address = _wallet;

  -- Decrementar estoque
  UPDATE marketplace_cars SET stock = stock - 1 WHERE id = _car_id;

  -- Aplicar divisão deflacionária: 10% burn, 20% reward pool, 70% treasury
  _burn_amount := GREATEST(1, (_car.price * 10) / 100);
  _reward_amount := GREATEST(1, (_car.price * 20) / 100);
  _treasury_amount := _car.price - _burn_amount - _reward_amount;

  UPDATE economy_state SET
    total_burned = total_burned + _burn_amount,
    reward_pool_balance = reward_pool_balance + _reward_amount,
    treasury_balance = treasury_balance + _treasury_amount,
    updated_at = now()
  WHERE id = (SELECT id FROM economy_state LIMIT 1);

  -- Criar o carro para o jogador (0km, novo)
  INSERT INTO cars (token_id, owner_wallet, name, model, speed_base, acceleration_base, handling_base, durability, engine_health, level, xp, total_km)
  VALUES (_token_id, _wallet, _car.name, _car.model, _car.speed_base, _car.acceleration_base, _car.handling_base, _car.durability, 100, 1, 0, 0);

  -- Registrar evento econômico com divisão
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
$function$;
