
-- Tabela de pacotes de NP disponíveis para compra
CREATE TABLE public.np_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  np_amount BIGINT NOT NULL,
  price_brl NUMERIC(10,2) NOT NULL,
  bonus_percent INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.np_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
ON public.np_packages FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage packages"
ON public.np_packages FOR ALL
USING (public.check_is_admin());

-- Tabela de compras/transações PIX
CREATE TABLE public.np_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  package_id UUID REFERENCES public.np_packages(id),
  np_amount BIGINT NOT NULL,
  price_brl NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  pix_code TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.np_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
ON public.np_purchases FOR SELECT
USING (
  wallet_address = (
    SELECT wallet_address FROM public.users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can create purchases"
ON public.np_purchases FOR INSERT
WITH CHECK (
  wallet_address = (
    SELECT wallet_address FROM public.users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can update own pending purchases"
ON public.np_purchases FOR UPDATE
USING (
  wallet_address = (
    SELECT wallet_address FROM public.users WHERE auth_id = auth.uid()
  ) AND status = 'pending'
);

-- Função para confirmar compra simulada e creditar NP
CREATE OR REPLACE FUNCTION public.confirm_np_purchase(_purchase_id UUID, _wallet TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _purchase RECORD;
BEGIN
  SELECT * INTO _purchase FROM np_purchases
  WHERE id = _purchase_id AND wallet_address = _wallet AND status = 'pending'
  FOR UPDATE;

  IF _purchase IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'purchase_not_found');
  END IF;

  -- Creditar NP ao jogador
  UPDATE users SET nitro_points = nitro_points + _purchase.np_amount
  WHERE wallet_address = _wallet;

  -- Atualizar status da compra
  UPDATE np_purchases SET status = 'confirmed', confirmed_at = now()
  WHERE id = _purchase_id;

  -- Registrar evento econômico (mint)
  INSERT INTO economy_events (event_type, amount, wallet, description)
  VALUES ('mint', _purchase.np_amount, _wallet, 'pix_purchase_' || _purchase.np_amount || 'NP');

  -- Atualizar total_minted no economy_state
  UPDATE economy_state SET
    total_minted = total_minted + _purchase.np_amount,
    updated_at = now()
  WHERE id = (SELECT id FROM economy_state LIMIT 1);

  RETURN jsonb_build_object(
    'success', true,
    'np_credited', _purchase.np_amount,
    'price_brl', _purchase.price_brl
  );
END;
$$;

-- Inserir pacotes iniciais
INSERT INTO public.np_packages (name, np_amount, price_brl, bonus_percent, sort_order) VALUES
  ('Starter', 100, 5.00, 0, 1),
  ('Popular', 500, 20.00, 10, 2),
  ('Pro', 1000, 35.00, 15, 3),
  ('Elite', 2500, 75.00, 20, 4),
  ('Whale', 5000, 130.00, 30, 5);

-- Trigger para updated_at
CREATE TRIGGER update_np_packages_updated_at
BEFORE UPDATE ON public.np_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
