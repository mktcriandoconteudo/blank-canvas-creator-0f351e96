
-- ============================================================
-- ECONOMIA DEFLACIONÁRIA: Tabelas de controle
-- ============================================================

-- Estado global da economia (single-row)
CREATE TABLE public.economy_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  max_supply BIGINT NOT NULL DEFAULT 100000000,        -- Hard cap: 100M NP
  total_minted BIGINT NOT NULL DEFAULT 0,              -- Total já emitido
  total_burned BIGINT NOT NULL DEFAULT 0,              -- Total queimado
  reward_pool_balance BIGINT NOT NULL DEFAULT 0,       -- Saldo do RewardPool
  treasury_balance BIGINT NOT NULL DEFAULT 0,          -- Saldo do Treasury
  last_emission_reset DATE NOT NULL DEFAULT CURRENT_DATE, -- Último reset de emissão diária
  daily_emitted BIGINT NOT NULL DEFAULT 0,             -- Emitido hoje
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir estado inicial
INSERT INTO public.economy_state (max_supply, total_minted, total_burned, reward_pool_balance, treasury_balance)
VALUES (100000000, 0, 0, 0, 0);

-- Histórico de eventos econômicos
CREATE TABLE public.economy_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,           -- 'burn', 'mint', 'reward_distribute', 'treasury_transfer', 'transaction'
  amount BIGINT NOT NULL DEFAULT 0,
  burn_amount BIGINT NOT NULL DEFAULT 0,
  reward_amount BIGINT NOT NULL DEFAULT 0,
  treasury_amount BIGINT NOT NULL DEFAULT 0,
  wallet TEXT,                        -- wallet envolvida (opcional)
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configuração de emissão (single-row, ajustável)
CREATE TABLE public.emission_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_daily_limit BIGINT NOT NULL DEFAULT 50000,       -- Limite diário base
  decay_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 2.0, -- Redução % por semana
  min_daily_limit BIGINT NOT NULL DEFAULT 5000,          -- Piso mínimo diário
  active_player_bonus NUMERIC(5,2) NOT NULL DEFAULT 0.5, -- Bônus % por jogador ativo
  max_player_bonus_cap NUMERIC(5,2) NOT NULL DEFAULT 50.0, -- Cap do bônus de jogadores
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.emission_config (base_daily_limit, decay_rate_percent, min_daily_limit)
VALUES (50000, 2.0, 5000);

-- RLS
ALTER TABLE public.economy_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_config ENABLE ROW LEVEL SECURITY;

-- Todos podem ler o estado da economia (transparência)
CREATE POLICY "Economy state readable by all" ON public.economy_state FOR SELECT USING (true);
CREATE POLICY "Economy events readable by all" ON public.economy_events FOR SELECT USING (true);
CREATE POLICY "Emission config readable by all" ON public.emission_config FOR SELECT USING (true);

-- Apenas sistema (service role) pode escrever - as operações são feitas via funções internas
-- Para o client, usaremos RPC functions

-- ============================================================
-- RPC: Processar transação deflacionária
-- Divide: 10% burn, 20% reward pool, 70% treasury
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_deflationary_transaction(
  _amount BIGINT,
  _wallet TEXT DEFAULT NULL,
  _description TEXT DEFAULT 'transaction'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _burn_amount BIGINT;
  _reward_amount BIGINT;
  _treasury_amount BIGINT;
  _state RECORD;
BEGIN
  -- Calcular divisão
  _burn_amount := GREATEST(1, (_amount * 10) / 100);
  _reward_amount := GREATEST(1, (_amount * 20) / 100);
  _treasury_amount := _amount - _burn_amount - _reward_amount;

  -- Atualizar estado da economia
  UPDATE economy_state SET
    total_burned = total_burned + _burn_amount,
    reward_pool_balance = reward_pool_balance + _reward_amount,
    treasury_balance = treasury_balance + _treasury_amount,
    updated_at = now()
  WHERE id = (SELECT id FROM economy_state LIMIT 1);

  -- Registrar evento
  INSERT INTO economy_events (event_type, amount, burn_amount, reward_amount, treasury_amount, wallet, description)
  VALUES ('transaction', _amount, _burn_amount, _reward_amount, _treasury_amount, _wallet, _description);

  -- Retornar resultado
  SELECT * INTO _state FROM economy_state LIMIT 1;

  RETURN jsonb_build_object(
    'burned', _burn_amount,
    'to_reward_pool', _reward_amount,
    'to_treasury', _treasury_amount,
    'total_burned', _state.total_burned,
    'reward_pool', _state.reward_pool_balance,
    'treasury', _state.treasury_balance
  );
END;
$$;

-- ============================================================
-- RPC: Emitir tokens com controle de supply e limite diário
-- ============================================================
CREATE OR REPLACE FUNCTION public.emit_tokens(
  _amount BIGINT,
  _wallet TEXT,
  _reason TEXT DEFAULT 'race_reward'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _state RECORD;
  _config RECORD;
  _circulating BIGINT;
  _effective_limit BIGINT;
  _weeks_elapsed INT;
  _active_players INT;
  _player_bonus NUMERIC;
  _actual_amount BIGINT;
BEGIN
  SELECT * INTO _state FROM economy_state LIMIT 1;
  SELECT * INTO _config FROM emission_config LIMIT 1;

  -- Reset diário se necessário
  IF _state.last_emission_reset < CURRENT_DATE THEN
    UPDATE economy_state SET daily_emitted = 0, last_emission_reset = CURRENT_DATE
    WHERE id = _state.id;
    _state.daily_emitted := 0;
  END IF;

  -- Calcular decay progressivo (reduz a cada semana desde o início)
  _weeks_elapsed := GREATEST(0, (CURRENT_DATE - _config.start_date) / 7);
  _effective_limit := GREATEST(
    _config.min_daily_limit,
    _config.base_daily_limit * POWER(1.0 - _config.decay_rate_percent / 100.0, _weeks_elapsed)
  );

  -- Bônus por jogadores ativos (últimas 24h)
  SELECT COUNT(DISTINCT owner_wallet) INTO _active_players
  FROM cars WHERE updated_at > now() - interval '24 hours';

  _player_bonus := LEAST(
    _config.max_player_bonus_cap,
    _active_players * _config.active_player_bonus
  );
  _effective_limit := _effective_limit + (_effective_limit * _player_bonus / 100);

  -- Limitar pela emissão diária restante
  _actual_amount := LEAST(_amount, _effective_limit - _state.daily_emitted);
  IF _actual_amount <= 0 THEN
    RETURN jsonb_build_object('emitted', 0, 'reason', 'daily_limit_reached');
  END IF;

  -- Limitar pelo hard cap
  _circulating := _state.total_minted - _state.total_burned;
  IF _circulating + _actual_amount > _state.max_supply THEN
    _actual_amount := GREATEST(0, _state.max_supply - _circulating);
  END IF;

  IF _actual_amount <= 0 THEN
    RETURN jsonb_build_object('emitted', 0, 'reason', 'hard_cap_reached');
  END IF;

  -- Emitir
  UPDATE economy_state SET
    total_minted = total_minted + _actual_amount,
    daily_emitted = daily_emitted + _actual_amount,
    updated_at = now()
  WHERE id = _state.id;

  -- Creditar ao jogador
  UPDATE users SET nitro_points = nitro_points + _actual_amount
  WHERE wallet_address = _wallet;

  -- Registrar evento
  INSERT INTO economy_events (event_type, amount, wallet, description)
  VALUES ('mint', _actual_amount, _wallet, _reason);

  RETURN jsonb_build_object(
    'emitted', _actual_amount,
    'daily_remaining', _effective_limit - _state.daily_emitted - _actual_amount,
    'effective_daily_limit', _effective_limit
  );
END;
$$;

-- ============================================================
-- RPC: Distribuir do RewardPool
-- ============================================================
CREATE OR REPLACE FUNCTION public.distribute_reward(
  _wallet TEXT,
  _amount BIGINT,
  _reason TEXT DEFAULT 'reward'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _pool_balance BIGINT;
BEGIN
  SELECT reward_pool_balance INTO _pool_balance FROM economy_state LIMIT 1;

  IF _pool_balance < _amount THEN
    RETURN FALSE; -- Saldo insuficiente no pool
  END IF;

  UPDATE economy_state SET
    reward_pool_balance = reward_pool_balance - _amount,
    updated_at = now()
  WHERE id = (SELECT id FROM economy_state LIMIT 1);

  UPDATE users SET nitro_points = nitro_points + _amount
  WHERE wallet_address = _wallet;

  INSERT INTO economy_events (event_type, amount, wallet, description)
  VALUES ('reward_distribute', _amount, _wallet, _reason);

  RETURN TRUE;
END;
$$;

-- ============================================================
-- RPC: Relatório econômico
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_economy_report()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _state RECORD;
  _config RECORD;
  _circulating BIGINT;
  _burn_rate NUMERIC;
  _days_active INT;
  _avg_daily_burn NUMERIC;
  _projected_days_to_zero NUMERIC;
BEGIN
  SELECT * INTO _state FROM economy_state LIMIT 1;
  SELECT * INTO _config FROM emission_config LIMIT 1;

  _circulating := _state.total_minted - _state.total_burned;
  _days_active := GREATEST(1, CURRENT_DATE - _config.start_date);
  _avg_daily_burn := CASE WHEN _days_active > 0 THEN _state.total_burned::NUMERIC / _days_active ELSE 0 END;
  _burn_rate := CASE WHEN _state.total_minted > 0 THEN (_state.total_burned::NUMERIC / _state.total_minted) * 100 ELSE 0 END;

  -- Projeção simples: dias até supply zero se burn continuar no ritmo atual
  _projected_days_to_zero := CASE WHEN _avg_daily_burn > 0 THEN _circulating / _avg_daily_burn ELSE -1 END;

  RETURN jsonb_build_object(
    'max_supply', _state.max_supply,
    'total_minted', _state.total_minted,
    'total_burned', _state.total_burned,
    'circulating_supply', _circulating,
    'reward_pool_balance', _state.reward_pool_balance,
    'treasury_balance', _state.treasury_balance,
    'burn_rate_percent', ROUND(_burn_rate, 2),
    'avg_daily_burn', ROUND(_avg_daily_burn, 2),
    'days_active', _days_active,
    'daily_emission_limit', _config.base_daily_limit,
    'daily_emitted_today', _state.daily_emitted,
    'projected_days_to_depletion', ROUND(_projected_days_to_zero, 0),
    'sustainability_score', CASE
      WHEN _burn_rate > 15 THEN 'HIGH_DEFLATION'
      WHEN _burn_rate > 5 THEN 'MODERATE_DEFLATION'
      WHEN _burn_rate > 0 THEN 'LOW_DEFLATION'
      ELSE 'NO_DATA'
    END
  );
END;
$$;

-- Trigger updated_at
CREATE TRIGGER update_economy_state_updated_at
BEFORE UPDATE ON public.economy_state
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emission_config_updated_at
BEFORE UPDATE ON public.emission_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index para consultas frequentes
CREATE INDEX idx_economy_events_type ON public.economy_events (event_type);
CREATE INDEX idx_economy_events_wallet ON public.economy_events (wallet);
CREATE INDEX idx_economy_events_created ON public.economy_events (created_at DESC);
