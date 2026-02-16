
-- ============================================================
-- 1. COOLDOWN PROGRESSIVO DE SAQUE
-- ============================================================

-- Tabela para tracking de quando NP foi ganho (vesting)
CREATE TABLE IF NOT EXISTS public.np_vesting (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL,
  amount bigint NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'race', -- race_win, race_loss, reward, purchase
  earned_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(), -- when 100% available
  withdrawn boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.np_vesting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vesting" ON public.np_vesting
  FOR SELECT USING (wallet_address = (current_setting('request.headers'::text, true)::json ->> 'x-wallet-address'));

CREATE POLICY "System can insert vesting" ON public.np_vesting
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update vesting" ON public.np_vesting
  FOR UPDATE USING (true);

CREATE INDEX idx_np_vesting_wallet ON public.np_vesting(wallet_address);
CREATE INDEX idx_np_vesting_earned ON public.np_vesting(earned_at);

-- Função para calcular taxa de saque baseada na idade do NP
CREATE OR REPLACE FUNCTION public.calculate_withdrawal_fee(_earned_at timestamptz)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _days_held integer;
BEGIN
  _days_held := EXTRACT(DAY FROM (now() - _earned_at));
  IF _days_held >= 30 THEN RETURN 0.0;
  ELSIF _days_held >= 7 THEN RETURN 10.0;
  ELSE RETURN 20.0;
  END IF;
END;
$$;

-- ============================================================
-- 2. SISTEMA ANTI-BOT
-- ============================================================

-- Tabela de sessão de corridas diárias por carro
CREATE TABLE IF NOT EXISTS public.daily_race_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL,
  car_id uuid NOT NULL,
  race_number integer NOT NULL DEFAULT 1, -- nth race today
  np_earned integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  race_duration_ms integer NOT NULL DEFAULT 0,
  raced_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_race_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own race log" ON public.daily_race_log
  FOR SELECT USING (wallet_address = (current_setting('request.headers'::text, true)::json ->> 'x-wallet-address'));

CREATE POLICY "System can insert race log" ON public.daily_race_log
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_daily_race_wallet_date ON public.daily_race_log(wallet_address, raced_at);

-- Função de recompensa decrescente
-- Corrida 1-3: 100% | 4-5: 70% | 6-7: 40% | 8+: 10%
CREATE OR REPLACE FUNCTION public.get_diminishing_reward_multiplier(_race_number integer)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  IF _race_number <= 3 THEN RETURN 1.0;
  ELSIF _race_number <= 5 THEN RETURN 0.7;
  ELSIF _race_number <= 7 THEN RETURN 0.4;
  ELSE RETURN 0.1;
  END IF;
END;
$$;

-- Função para contar corridas do dia e verificar cooldown
CREATE OR REPLACE FUNCTION public.check_race_eligibility(_wallet text, _car_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _today_count integer;
  _last_race timestamptz;
  _cooldown_seconds integer := 120; -- 2 min entre corridas
  _seconds_since_last integer;
  _multiplier numeric;
BEGIN
  -- Contar corridas do dia para este carro
  SELECT COUNT(*), MAX(raced_at) INTO _today_count, _last_race
  FROM daily_race_log
  WHERE wallet_address = _wallet
    AND car_id = _car_id
    AND raced_at >= CURRENT_DATE;

  -- Cooldown de 2 min
  IF _last_race IS NOT NULL THEN
    _seconds_since_last := EXTRACT(EPOCH FROM (now() - _last_race))::integer;
    IF _seconds_since_last < _cooldown_seconds THEN
      RETURN jsonb_build_object(
        'eligible', false,
        'reason', 'cooldown',
        'wait_seconds', _cooldown_seconds - _seconds_since_last
      );
    END IF;
  END IF;

  _multiplier := get_diminishing_reward_multiplier(_today_count + 1);

  RETURN jsonb_build_object(
    'eligible', true,
    'race_number', _today_count + 1,
    'reward_multiplier', _multiplier,
    'next_multiplier', get_diminishing_reward_multiplier(_today_count + 2)
  );
END;
$$;

-- ============================================================
-- 3. REINVESTIMENTO OBRIGATÓRIO PARCIAL
-- ============================================================

-- Adicionar saldo bloqueado (upgrade-only) na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS locked_np integer NOT NULL DEFAULT 0;

-- Função para dividir recompensa: 60% livre + 40% locked
CREATE OR REPLACE FUNCTION public.split_reward(_wallet text, _total_np integer, _xp integer, _source text DEFAULT 'race')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _free_np integer;
  _locked_np integer;
BEGIN
  _free_np := (_total_np * 60) / 100;
  _locked_np := _total_np - _free_np;

  -- Creditar livre
  UPDATE users SET nitro_points = nitro_points + _free_np,
                   locked_np = locked_np + _locked_np
  WHERE wallet_address = _wallet;

  -- Registrar vesting
  INSERT INTO np_vesting (wallet_address, amount, source, earned_at)
  VALUES (_wallet, _free_np, _source, now());

  RETURN jsonb_build_object(
    'total', _total_np,
    'free', _free_np,
    'locked', _locked_np,
    'source', _source
  );
END;
$$;

-- Função para gastar locked_np em upgrades (reparo, óleo, etc.)
CREATE OR REPLACE FUNCTION public.spend_locked_np(_wallet text, _amount integer, _reason text DEFAULT 'upgrade')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _available integer;
BEGIN
  SELECT locked_np INTO _available FROM users WHERE wallet_address = _wallet;
  IF _available IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  IF _available < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_locked_np', 'available', _available);
  END IF;

  UPDATE users SET locked_np = locked_np - _amount WHERE wallet_address = _wallet;

  RETURN jsonb_build_object('success', true, 'spent', _amount, 'remaining_locked', _available - _amount);
END;
$$;
