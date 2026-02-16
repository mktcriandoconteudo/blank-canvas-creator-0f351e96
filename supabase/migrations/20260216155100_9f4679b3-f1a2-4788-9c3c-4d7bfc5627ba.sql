
-- ============================================================
-- SISTEMA DE SEGURO DE CARRO
-- ============================================================
-- Planos: Básico, Standard, Premium
-- Cada apólice tem validade (em corridas ou dias)
-- Cobertura cobre % do custo de reparo/manutenção
-- Pagamentos passam pelo sistema deflacionário

-- Tabela de apólices de seguro ativas/expiradas
CREATE TABLE public.car_insurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL,
  owner_wallet TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'basic',          -- 'basic', 'standard', 'premium'
  coverage_percent INTEGER NOT NULL DEFAULT 30,      -- % de cobertura no reparo
  premium_paid BIGINT NOT NULL DEFAULT 0,            -- Valor pago pelo seguro
  max_claims INTEGER NOT NULL DEFAULT 3,             -- Máximo de acionamentos
  claims_used INTEGER NOT NULL DEFAULT 0,            -- Acionamentos já usados
  races_remaining INTEGER NOT NULL DEFAULT 30,       -- Corridas restantes na apólice
  expires_at TIMESTAMPTZ NOT NULL,                   -- Data de expiração
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Histórico de sinistros (claims)
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_id UUID NOT NULL REFERENCES public.car_insurance(id),
  car_id UUID NOT NULL,
  owner_wallet TEXT NOT NULL,
  claim_type TEXT NOT NULL,             -- 'repair', 'oil_change', 'engine_failure'
  original_cost BIGINT NOT NULL,        -- Custo original do reparo
  covered_amount BIGINT NOT NULL,       -- Quanto o seguro cobriu
  player_paid BIGINT NOT NULL,          -- Quanto o jogador pagou
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.car_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

-- Leitura pública (transparência)
CREATE POLICY "Insurance viewable by everyone" ON public.car_insurance FOR SELECT USING (true);
CREATE POLICY "Claims viewable by everyone" ON public.insurance_claims FOR SELECT USING (true);

-- Escrita via wallet header (RLS)
CREATE POLICY "Owners can insert insurance" ON public.car_insurance FOR INSERT
  WITH CHECK (owner_wallet = (current_setting('request.headers'::text, true)::json ->> 'x-wallet-address'));

CREATE POLICY "Owners can update own insurance" ON public.car_insurance FOR UPDATE
  USING (owner_wallet = (current_setting('request.headers'::text, true)::json ->> 'x-wallet-address'));

CREATE POLICY "Owners can insert claims" ON public.insurance_claims FOR INSERT
  WITH CHECK (owner_wallet = (current_setting('request.headers'::text, true)::json ->> 'x-wallet-address'));

-- Indexes
CREATE INDEX idx_car_insurance_car ON public.car_insurance (car_id, is_active);
CREATE INDEX idx_car_insurance_wallet ON public.car_insurance (owner_wallet, is_active);
CREATE INDEX idx_insurance_claims_insurance ON public.insurance_claims (insurance_id);

-- Trigger updated_at
CREATE TRIGGER update_car_insurance_updated_at
BEFORE UPDATE ON public.car_insurance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RPC: Contratar seguro (atômico: deduz NP + cria apólice)
-- ============================================================
CREATE OR REPLACE FUNCTION public.purchase_insurance(
  _car_id UUID,
  _wallet TEXT,
  _plan_type TEXT,
  _coverage_percent INTEGER,
  _premium BIGINT,
  _max_claims INTEGER,
  _races_limit INTEGER,
  _duration_days INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _balance INTEGER;
  _existing RECORD;
  _new_id UUID;
BEGIN
  -- Verificar saldo
  SELECT nitro_points INTO _balance FROM users WHERE wallet_address = _wallet;
  IF _balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;
  IF _balance < _premium THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_funds');
  END IF;

  -- Verificar se o carro pertence ao jogador
  IF NOT EXISTS (SELECT 1 FROM cars WHERE id = _car_id AND owner_wallet = _wallet) THEN
    RETURN jsonb_build_object('success', false, 'error', 'car_not_owned');
  END IF;

  -- Desativar seguro anterior ativo do mesmo carro (upgrade)
  UPDATE car_insurance SET is_active = false
  WHERE car_id = _car_id AND owner_wallet = _wallet AND is_active = true;

  -- Deduzir NP
  UPDATE users SET nitro_points = nitro_points - _premium WHERE wallet_address = _wallet;

  -- Criar apólice
  INSERT INTO car_insurance (car_id, owner_wallet, plan_type, coverage_percent, premium_paid, max_claims, races_remaining, expires_at)
  VALUES (_car_id, _wallet, _plan_type, _coverage_percent, _premium, _max_claims, _races_limit, now() + (_duration_days || ' days')::interval)
  RETURNING id INTO _new_id;

  -- Registrar evento econômico
  INSERT INTO economy_events (event_type, amount, wallet, description)
  VALUES ('transaction', _premium, _wallet, 'insurance_purchase_' || _plan_type);

  RETURN jsonb_build_object(
    'success', true,
    'insurance_id', _new_id,
    'plan', _plan_type,
    'coverage', _coverage_percent,
    'expires_in_days', _duration_days
  );
END;
$$;

-- ============================================================
-- RPC: Acionar seguro (claim)
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_insurance(
  _car_id UUID,
  _wallet TEXT,
  _claim_type TEXT,
  _original_cost BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ins RECORD;
  _covered BIGINT;
  _player_pays BIGINT;
BEGIN
  -- Buscar apólice ativa válida
  SELECT * INTO _ins FROM car_insurance
  WHERE car_id = _car_id
    AND owner_wallet = _wallet
    AND is_active = true
    AND expires_at > now()
    AND claims_used < max_claims
    AND races_remaining > 0
  ORDER BY coverage_percent DESC
  LIMIT 1;

  IF _ins IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_insurance', 'covered', 0, 'player_pays', _original_cost);
  END IF;

  -- Calcular cobertura
  _covered := (_original_cost * _ins.coverage_percent) / 100;
  _player_pays := _original_cost - _covered;

  -- Atualizar apólice
  UPDATE car_insurance SET
    claims_used = claims_used + 1,
    is_active = CASE WHEN claims_used + 1 >= max_claims THEN false ELSE true END
  WHERE id = _ins.id;

  -- Registrar sinistro
  INSERT INTO insurance_claims (insurance_id, car_id, owner_wallet, claim_type, original_cost, covered_amount, player_paid)
  VALUES (_ins.id, _car_id, _wallet, _claim_type, _original_cost, _covered, _player_pays);

  RETURN jsonb_build_object(
    'success', true,
    'covered', _covered,
    'player_pays', _player_pays,
    'claims_remaining', _ins.max_claims - _ins.claims_used - 1,
    'plan', _ins.plan_type
  );
END;
$$;
