CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _wallet text;
BEGIN
  -- Gera um wallet_address único usando md5 + random (compatível sem pgcrypto)
  _wallet := '0x' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);

  INSERT INTO public.users (auth_id, wallet_address, username)
  VALUES (
    NEW.id,
    _wallet,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Piloto')
  );

  -- Cria um carro padrão para o novo usuário
  INSERT INTO public.cars (token_id, owner_wallet, name, model)
  VALUES (
    '#' || floor(random() * 9999 + 1)::int,
    _wallet,
    'Phantom X9',
    'legendary'
  );

  RETURN NEW;
END;
$$;