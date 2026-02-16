
-- 1) Remover o carro gratuito do trigger de novo usuário
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

  INSERT INTO public.users (auth_id, wallet_address, username)
  VALUES (
    NEW.id,
    _wallet,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Piloto')
  );

  -- NÃO cria mais carro gratuito. Jogador precisa comprar no Marketplace.
  RETURN NEW;
END;
$function$;

-- 2) Atualizar função de compra para usar sistema deflacionário
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
  -- Buscar carro no catálogo
  SELECT * INTO _car FROM marketplace_cars WHERE id = _car_id AND sale_active = true;
  IF _car IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'car_not_available');
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
    'to_treasury', _treasury_amount
  );
END;
$function$;

-- 3) Adicionar todos os carros ao marketplace (desativados por padrão, admin liga)
INSERT INTO public.marketplace_cars (name, model, rarity, price, speed_base, acceleration_base, handling_base, durability, image_key, sale_active)
VALUES 
  ('Phantom X9', 'legendary', 'legendary', 2500, 95, 88, 82, 90, 'car-phantom', false),
  ('Inferno GT', 'epic', 'epic', 1200, 78, 92, 65, 85, 'car-inferno', false),
  ('Solar Flare', 'legendary', 'legendary', 3200, 98, 85, 90, 75, 'car-solar', false),
  ('Venom Strike', 'epic', 'epic', 980, 82, 78, 88, 80, 'car-venom', false),
  ('Eclipse Nova', 'rare', 'rare', 650, 72, 70, 75, 78, 'car-eclipse', false),
  ('Frost Byte', 'epic', 'epic', 1450, 85, 80, 92, 82, 'car-frost', false),
  ('Blaze Runner', 'legendary', 'legendary', 2800, 92, 95, 78, 85, 'car-blaze', false)
ON CONFLICT DO NOTHING;
