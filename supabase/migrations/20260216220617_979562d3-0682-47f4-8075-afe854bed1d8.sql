
-- 1. Race rewards history table
CREATE TABLE public.race_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  car_id UUID NOT NULL,
  car_name TEXT NOT NULL DEFAULT '',
  race_id TEXT,
  victory BOOLEAN NOT NULL DEFAULT false,
  np_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  tokens_earned NUMERIC NOT NULL DEFAULT 0,
  race_duration_seconds INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 2,
  collisions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.race_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards" ON public.race_rewards
  FOR SELECT USING (wallet_address = ((current_setting('request.headers', true))::json ->> 'x-wallet-address'));

CREATE POLICY "System can insert rewards" ON public.race_rewards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all rewards" ON public.race_rewards
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_race_rewards_wallet ON public.race_rewards(wallet_address);
CREATE INDEX idx_race_rewards_created ON public.race_rewards(created_at DESC);

-- 2. Withdrawal config (admin-controlled)
CREATE TABLE public.withdrawal_config (
  id TEXT NOT NULL DEFAULT 'default' PRIMARY KEY,
  token_name TEXT NOT NULL DEFAULT 'KLEIN',
  withdrawals_enabled BOOLEAN NOT NULL DEFAULT false,
  unlock_date TIMESTAMP WITH TIME ZONE,
  min_withdrawal NUMERIC NOT NULL DEFAULT 100,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT
);

ALTER TABLE public.withdrawal_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config readable by all" ON public.withdrawal_config FOR SELECT USING (true);
CREATE POLICY "Admins can update config" ON public.withdrawal_config FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.withdrawal_config (id, token_name, withdrawals_enabled, unlock_date)
VALUES ('default', 'KLEIN', false, NULL);

-- 3. Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  token_name TEXT NOT NULL DEFAULT 'KLEIN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by TEXT
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (wallet_address = ((current_setting('request.headers', true))::json ->> 'x-wallet-address'));
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (wallet_address = ((current_setting('request.headers', true))::json ->> 'x-wallet-address'));
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update withdrawals" ON public.withdrawal_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Token balance tracking per user (accumulated from races, separate from NP)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS token_balance NUMERIC NOT NULL DEFAULT 0;
