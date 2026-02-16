
-- Tabela de catálogo de carros do marketplace (carros 0km à venda)
CREATE TABLE public.marketplace_cars (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  model text NOT NULL DEFAULT 'standard',
  rarity text NOT NULL DEFAULT 'common',
  price integer NOT NULL DEFAULT 500,
  speed_base integer NOT NULL DEFAULT 50,
  acceleration_base integer NOT NULL DEFAULT 50,
  handling_base integer NOT NULL DEFAULT 50,
  durability integer NOT NULL DEFAULT 100,
  image_key text NOT NULL DEFAULT 'car-thunder',
  sale_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.marketplace_cars ENABLE ROW LEVEL SECURITY;

-- Todos podem ler
CREATE POLICY "Marketplace cars readable by all"
ON public.marketplace_cars FOR SELECT
USING (true);

-- Apenas admins podem inserir
CREATE POLICY "Admins can insert marketplace cars"
ON public.marketplace_cars FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar (toggle sale_active)
CREATE POLICY "Admins can update marketplace cars"
ON public.marketplace_cars FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_marketplace_cars_updated_at
BEFORE UPDATE ON public.marketplace_cars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir o Thunder Bolt como primeiro carro disponível
INSERT INTO public.marketplace_cars (name, model, rarity, price, speed_base, acceleration_base, handling_base, durability, image_key, sale_active)
VALUES ('Thunder Bolt', 'classic', 'rare', 350, 55, 50, 60, 100, 'car-thunder', true);

-- Função para comprar carro do marketplace
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

  -- Deduzir NP
  UPDATE users SET nitro_points = nitro_points - _car.price WHERE wallet_address = _wallet;

  -- Criar o carro para o jogador (0km, novo)
  INSERT INTO cars (token_id, owner_wallet, name, model, speed_base, acceleration_base, handling_base, durability, engine_health, level, xp, total_km)
  VALUES (_token_id, _wallet, _car.name, _car.model, _car.speed_base, _car.acceleration_base, _car.handling_base, _car.durability, 100, 1, 0, 0);

  -- Registrar evento econômico
  INSERT INTO economy_events (event_type, amount, wallet, description)
  VALUES ('transaction', _car.price, _wallet, 'marketplace_purchase_' || _car.name);

  RETURN jsonb_build_object(
    'success', true,
    'car_name', _car.name,
    'price_paid', _car.price,
    'remaining_balance', _balance - _car.price
  );
END;
$function$;
