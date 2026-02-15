
-- Adiciona coluna auth_id para vincular auth.users ao public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE;

-- Função que cria o registro em public.users quando um novo usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wallet text;
BEGIN
  -- Gera um wallet_address único baseado no auth.uid
  _wallet := '0x' || encode(gen_random_bytes(8), 'hex');

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

-- Trigger no signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
