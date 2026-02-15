
-- Corrige a função refill_fuel: fuel_tanks está na tabela users, não em cars
CREATE OR REPLACE FUNCTION public.refill_fuel(_wallet_address text)
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

  -- Transação atômica: deduz 50 NP e restaura fuel para 5
  UPDATE users
  SET nitro_points = nitro_points - _cost,
      fuel_tanks = 5
  WHERE wallet_address = _wallet_address;

  RETURN TRUE;
END;
$$;
