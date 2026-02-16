-- 1. Ajustar decay para 1.5% (menos agressivo) e min_daily_limit para 10.000
UPDATE emission_config SET
  decay_rate_percent = 1.5,
  min_daily_limit = 10000,
  active_player_bonus = 0.75,
  updated_at = now();

-- 2. Adicionar coluna de burn rate dinâmico na economy_state para válvula de segurança
ALTER TABLE economy_state ADD COLUMN IF NOT EXISTS dynamic_burn_rate numeric NOT NULL DEFAULT 10.0;

-- 3. Criar função de válvula anti-deflação automática
CREATE OR REPLACE FUNCTION public.get_dynamic_burn_rate()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _circulating BIGINT;
  _burn_rate NUMERIC;
BEGIN
  SELECT (total_minted - total_burned) INTO _circulating FROM economy_state LIMIT 1;
  
  -- Válvula de segurança: reduz burn quando circulante cai
  IF _circulating < 2000000 THEN
    _burn_rate := 3.0;  -- Emergência: burn mínimo
  ELSIF _circulating < 5000000 THEN
    _burn_rate := 5.0;  -- Alerta: burn reduzido
  ELSIF _circulating < 10000000 THEN
    _burn_rate := 7.0;  -- Caução: burn moderado
  ELSE
    _burn_rate := 10.0; -- Normal
  END IF;
  
  -- Atualizar na tabela para visibilidade no admin
  UPDATE economy_state SET dynamic_burn_rate = _burn_rate
  WHERE id = (SELECT id FROM economy_state LIMIT 1);
  
  RETURN _burn_rate;
END;
$$;

-- 4. Atualizar process_deflationary_transaction para usar burn dinâmico
CREATE OR REPLACE FUNCTION public.process_deflationary_transaction(_amount bigint, _wallet text DEFAULT NULL::text, _description text DEFAULT 'transaction'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _burn_pct NUMERIC;
  _burn_amount BIGINT;
  _reward_amount BIGINT;
  _treasury_amount BIGINT;
  _state RECORD;
BEGIN
  -- Obter burn rate dinâmico (válvula anti-deflação)
  _burn_pct := public.get_dynamic_burn_rate();
  
  -- Calcular divisão com burn dinâmico
  _burn_amount := GREATEST(1, (_amount * _burn_pct::integer) / 100);
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
  INSERT INTO economy_events (event_type, amount, burn_amount, reward_amount, treasury_amount, wallet, description, metadata)
  VALUES ('transaction', _amount, _burn_amount, _reward_amount, _treasury_amount, _wallet, _description,
    jsonb_build_object('burn_rate_pct', _burn_pct));

  -- Retornar resultado
  SELECT * INTO _state FROM economy_state LIMIT 1;

  RETURN jsonb_build_object(
    'burned', _burn_amount,
    'to_reward_pool', _reward_amount,
    'to_treasury', _treasury_amount,
    'burn_rate_applied', _burn_pct,
    'total_burned', _state.total_burned,
    'reward_pool', _state.reward_pool_balance,
    'treasury', _state.treasury_balance
  );
END;
$$;
