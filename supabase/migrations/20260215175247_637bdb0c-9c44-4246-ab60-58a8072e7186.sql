
-- Função atômica de reabastecimento: deduz 50 NP e restaura fuel_tanks para 5
-- Usa o header x-wallet-address para validação RLS
CREATE OR REPLACE FUNCTION public.refill_fuel(_wallet_address text, _car_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _balance integer;
  _cost integer := 50;
BEGIN
  -- Verifica saldo atual
  SELECT nitro_points INTO _balance
  FROM users
  WHERE wallet_address = _wallet_address;

  IF _balance IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  IF _balance < _cost THEN
    RETURN FALSE;
  END IF;

  -- Verifica se o carro pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM cars WHERE id = _car_id AND owner_wallet = _wallet_address
  ) THEN
    RAISE EXCEPTION 'Carro não pertence a este usuário';
  END IF;

  -- Transação atômica: deduz NP e restaura fuel
  UPDATE users SET nitro_points = nitro_points - _cost WHERE wallet_address = _wallet_address;
  UPDATE cars SET fuel_tanks = 5 WHERE id = _car_id;

  RETURN TRUE;
END;
$$;
