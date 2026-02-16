
-- Add penalty columns to behavior_scores
ALTER TABLE public.behavior_scores
  ADD COLUMN IF NOT EXISTS penalty_tier TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS reward_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS forced_cooldown_seconds INTEGER NOT NULL DEFAULT 120;

-- Enhanced function: calculates score AND applies penalties
CREATE OR REPLACE FUNCTION public.calculate_behavior_score(_wallet TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _interval_score INT := 100;
  _variability_score INT := 100;
  _winrate_score INT := 100;
  _pattern_score INT := 100;
  _final_score INT;
  _flagged BOOLEAN := false;
  _penalty_tier TEXT := 'none';
  _reward_mult NUMERIC := 1.0;
  _blocked_until TIMESTAMPTZ := NULL;
  _forced_cooldown INT := 120;
  _race_count INT;
  _avg_interval NUMERIC;
  _stddev_interval NUMERIC;
  _cv NUMERIC;
  _win_rate NUMERIC;
  _total_wins INT;
  _total_races INT;
  _max_streak INT;
  _consecutive_same INT;
  _prev_np INT;
  _np_values INT[];
  _intervals NUMERIC[];
  _rec RECORD;
  _prev_ts TIMESTAMPTZ;
  _i INT;
  _prev_score INT;
  _consecutive_flags INT;
BEGIN
  SELECT COUNT(*) INTO _race_count
  FROM daily_race_log
  WHERE wallet_address = _wallet
    AND raced_at > now() - INTERVAL '7 days';

  IF _race_count < 5 THEN
    RETURN json_build_object(
      'score', 100, 'interval_score', 100, 'variability_score', 100,
      'winrate_score', 100, 'pattern_score', 100, 'flagged', false,
      'penalty_tier', 'none', 'reward_multiplier', 1.0,
      'blocked_until', NULL, 'forced_cooldown_seconds', 120,
      'reason', 'insufficient_data'
    );
  END IF;

  -- 1. INTERVAL ANALYSIS
  _intervals := ARRAY[]::NUMERIC[];
  _prev_ts := NULL;
  FOR _rec IN
    SELECT raced_at FROM daily_race_log
    WHERE wallet_address = _wallet AND raced_at > now() - INTERVAL '7 days'
    ORDER BY raced_at ASC
  LOOP
    IF _prev_ts IS NOT NULL THEN
      _intervals := array_append(_intervals, EXTRACT(EPOCH FROM (_rec.raced_at - _prev_ts)));
    END IF;
    _prev_ts := _rec.raced_at;
  END LOOP;

  IF array_length(_intervals, 1) > 1 THEN
    SELECT AVG(v), STDDEV(v) INTO _avg_interval, _stddev_interval
    FROM unnest(_intervals) AS v;
    IF _avg_interval > 0 THEN
      _cv := COALESCE(_stddev_interval, 0) / _avg_interval;
    ELSE _cv := 0;
    END IF;
    IF _cv < 0.05 THEN _interval_score := 10;
    ELSIF _cv < 0.10 THEN _interval_score := 30;
    ELSIF _cv < 0.15 THEN _interval_score := 50;
    ELSIF _cv < 0.25 THEN _interval_score := 75;
    ELSE _interval_score := 100;
    END IF;
    IF _avg_interval BETWEEN 115 AND 130 AND _cv < 0.1 THEN
      _interval_score := LEAST(_interval_score, 15);
    END IF;
  END IF;

  -- 2. DURATION VARIABILITY
  SELECT STDDEV(race_duration_ms), AVG(race_duration_ms)
  INTO _stddev_interval, _avg_interval
  FROM daily_race_log
  WHERE wallet_address = _wallet AND raced_at > now() - INTERVAL '7 days';
  IF _avg_interval > 0 THEN
    _cv := COALESCE(_stddev_interval, 0) / _avg_interval;
    IF _cv < 0.02 THEN _variability_score := 10;
    ELSIF _cv < 0.05 THEN _variability_score := 30;
    ELSIF _cv < 0.10 THEN _variability_score := 60;
    ELSE _variability_score := 100;
    END IF;
  END IF;

  -- 3. WIN RATE
  SELECT COUNT(*), SUM(CASE WHEN xp_earned >= 80 THEN 1 ELSE 0 END)
  INTO _total_races, _total_wins
  FROM daily_race_log
  WHERE wallet_address = _wallet AND raced_at > now() - INTERVAL '7 days';
  IF _total_races > 0 THEN
    _win_rate := _total_wins::NUMERIC / _total_races;
    IF _total_races >= 10 AND _win_rate > 0.90 THEN _winrate_score := 15;
    ELSIF _total_races >= 10 AND _win_rate > 0.85 THEN _winrate_score := 30;
    ELSIF _total_races >= 7 AND _win_rate > 0.80 THEN _winrate_score := 50;
    ELSIF _win_rate > 0.75 THEN _winrate_score := 70;
    ELSE _winrate_score := 100;
    END IF;
  END IF;

  -- 4. PATTERN
  _np_values := ARRAY[]::INT[];
  FOR _rec IN
    SELECT np_earned FROM daily_race_log
    WHERE wallet_address = _wallet AND raced_at > now() - INTERVAL '7 days'
    ORDER BY raced_at ASC
  LOOP
    _np_values := array_append(_np_values, _rec.np_earned);
  END LOOP;
  _max_streak := 1; _consecutive_same := 1; _prev_np := NULL;
  FOR _i IN 1..array_length(_np_values, 1) LOOP
    IF _prev_np IS NOT NULL AND _np_values[_i] = _prev_np THEN
      _consecutive_same := _consecutive_same + 1;
      _max_streak := GREATEST(_max_streak, _consecutive_same);
    ELSE _consecutive_same := 1;
    END IF;
    _prev_np := _np_values[_i];
  END LOOP;
  IF _max_streak >= 7 THEN _pattern_score := 10;
  ELSIF _max_streak >= 5 THEN _pattern_score := 30;
  ELSIF _max_streak >= 4 THEN _pattern_score := 60;
  ELSE _pattern_score := 100;
  END IF;

  -- FINAL SCORE
  _final_score := ROUND(
    _interval_score * 0.30 + _variability_score * 0.25 +
    _winrate_score * 0.25 + _pattern_score * 0.20
  );
  _flagged := _final_score < 40;

  -- ========== PROGRESSIVE PENALTIES ==========
  -- Check previous score for escalation
  SELECT score INTO _prev_score FROM behavior_scores WHERE wallet_address = _wallet;

  IF _final_score >= 70 THEN
    _penalty_tier := 'none';
    _reward_mult := 1.0;
    _forced_cooldown := 120;
    _blocked_until := NULL;
  ELSIF _final_score >= 50 THEN
    -- WARNING: reward reduction
    _penalty_tier := 'warning';
    _reward_mult := 0.50;
    _forced_cooldown := 300; -- 5 min cooldown
    _blocked_until := NULL;
  ELSIF _final_score >= 30 THEN
    -- SUSPECT: heavy reduction + longer cooldown
    _penalty_tier := 'suspect';
    _reward_mult := 0.25;
    _forced_cooldown := 600; -- 10 min cooldown
    _blocked_until := NULL;
  ELSIF _final_score >= 15 THEN
    -- FLAGGED: minimal rewards + temporary block
    _penalty_tier := 'flagged';
    _reward_mult := 0.10;
    _forced_cooldown := 900; -- 15 min cooldown
    -- Block for 1 hour if was already suspect
    IF _prev_score IS NOT NULL AND _prev_score < 40 THEN
      _blocked_until := now() + INTERVAL '1 hour';
    END IF;
  ELSE
    -- BOT: blocked for 24h
    _penalty_tier := 'blocked';
    _reward_mult := 0.0;
    _forced_cooldown := 3600;
    _blocked_until := now() + INTERVAL '24 hours';
  END IF;

  -- Upsert
  INSERT INTO behavior_scores (wallet_address, score, interval_score, variability_score,
    winrate_score, pattern_score, flagged, penalty_tier, reward_multiplier,
    blocked_until, forced_cooldown_seconds, last_calculated_at, updated_at)
  VALUES (_wallet, _final_score, _interval_score, _variability_score,
    _winrate_score, _pattern_score, _flagged, _penalty_tier, _reward_mult,
    _blocked_until, _forced_cooldown, now(), now())
  ON CONFLICT (wallet_address)
  DO UPDATE SET
    score = EXCLUDED.score,
    interval_score = EXCLUDED.interval_score,
    variability_score = EXCLUDED.variability_score,
    winrate_score = EXCLUDED.winrate_score,
    pattern_score = EXCLUDED.pattern_score,
    flagged = EXCLUDED.flagged,
    penalty_tier = EXCLUDED.penalty_tier,
    reward_multiplier = EXCLUDED.reward_multiplier,
    blocked_until = EXCLUDED.blocked_until,
    forced_cooldown_seconds = EXCLUDED.forced_cooldown_seconds,
    last_calculated_at = now(),
    updated_at = now();

  RETURN json_build_object(
    'score', _final_score,
    'interval_score', _interval_score,
    'variability_score', _variability_score,
    'winrate_score', _winrate_score,
    'pattern_score', _pattern_score,
    'flagged', _flagged,
    'penalty_tier', _penalty_tier,
    'reward_multiplier', _reward_mult,
    'blocked_until', _blocked_until,
    'forced_cooldown_seconds', _forced_cooldown
  );
END;
$$;

-- Function to check if player is blocked before racing
CREATE OR REPLACE FUNCTION public.check_behavior_block(_wallet TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bs RECORD;
BEGIN
  SELECT * INTO _bs FROM behavior_scores WHERE wallet_address = _wallet;

  IF _bs IS NULL THEN
    RETURN json_build_object('blocked', false, 'penalty_tier', 'none',
      'reward_multiplier', 1.0, 'forced_cooldown_seconds', 120);
  END IF;

  -- Check if currently blocked
  IF _bs.blocked_until IS NOT NULL AND _bs.blocked_until > now() THEN
    RETURN json_build_object(
      'blocked', true,
      'penalty_tier', _bs.penalty_tier,
      'reward_multiplier', _bs.reward_multiplier,
      'blocked_until', _bs.blocked_until,
      'wait_seconds', EXTRACT(EPOCH FROM (_bs.blocked_until - now()))::integer,
      'forced_cooldown_seconds', _bs.forced_cooldown_seconds,
      'score', _bs.score
    );
  END IF;

  RETURN json_build_object(
    'blocked', false,
    'penalty_tier', _bs.penalty_tier,
    'reward_multiplier', _bs.reward_multiplier,
    'forced_cooldown_seconds', _bs.forced_cooldown_seconds,
    'score', _bs.score
  );
END;
$$;
