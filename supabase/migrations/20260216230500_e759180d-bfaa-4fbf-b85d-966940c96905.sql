
-- Table to store behavior scores per player
CREATE TABLE public.behavior_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 100,
  interval_score INTEGER NOT NULL DEFAULT 100,
  variability_score INTEGER NOT NULL DEFAULT 100,
  winrate_score INTEGER NOT NULL DEFAULT 100,
  pattern_score INTEGER NOT NULL DEFAULT 100,
  flagged BOOLEAN NOT NULL DEFAULT false,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address)
);

ALTER TABLE public.behavior_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own behavior score"
  ON public.behavior_scores FOR SELECT
  USING (wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address');

CREATE POLICY "Admins can view all behavior scores"
  ON public.behavior_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Function to calculate behavior score from daily_race_log
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
BEGIN
  SELECT COUNT(*) INTO _race_count
  FROM daily_race_log
  WHERE wallet_address = _wallet
    AND raced_at > now() - INTERVAL '7 days';

  IF _race_count < 5 THEN
    RETURN json_build_object(
      'score', 100, 'interval_score', 100, 'variability_score', 100,
      'winrate_score', 100, 'pattern_score', 100, 'flagged', false,
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
    ELSE
      _cv := 0;
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

  -- 3. WIN RATE ANALYSIS
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

  -- 4. PATTERN REPETITION
  _np_values := ARRAY[]::INT[];
  FOR _rec IN
    SELECT np_earned FROM daily_race_log
    WHERE wallet_address = _wallet AND raced_at > now() - INTERVAL '7 days'
    ORDER BY raced_at ASC
  LOOP
    _np_values := array_append(_np_values, _rec.np_earned);
  END LOOP;

  _max_streak := 1;
  _consecutive_same := 1;
  _prev_np := NULL;
  FOR _i IN 1..array_length(_np_values, 1) LOOP
    IF _prev_np IS NOT NULL AND _np_values[_i] = _prev_np THEN
      _consecutive_same := _consecutive_same + 1;
      _max_streak := GREATEST(_max_streak, _consecutive_same);
    ELSE
      _consecutive_same := 1;
    END IF;
    _prev_np := _np_values[_i];
  END LOOP;

  IF _max_streak >= 7 THEN _pattern_score := 10;
  ELSIF _max_streak >= 5 THEN _pattern_score := 30;
  ELSIF _max_streak >= 4 THEN _pattern_score := 60;
  ELSE _pattern_score := 100;
  END IF;

  -- FINAL SCORE (interval 30%, variability 25%, winrate 25%, pattern 20%)
  _final_score := ROUND(
    _interval_score * 0.30 +
    _variability_score * 0.25 +
    _winrate_score * 0.25 +
    _pattern_score * 0.20
  );

  _flagged := _final_score < 40;

  INSERT INTO behavior_scores (wallet_address, score, interval_score, variability_score, winrate_score, pattern_score, flagged, last_calculated_at, updated_at)
  VALUES (_wallet, _final_score, _interval_score, _variability_score, _winrate_score, _pattern_score, _flagged, now(), now())
  ON CONFLICT (wallet_address)
  DO UPDATE SET
    score = EXCLUDED.score,
    interval_score = EXCLUDED.interval_score,
    variability_score = EXCLUDED.variability_score,
    winrate_score = EXCLUDED.winrate_score,
    pattern_score = EXCLUDED.pattern_score,
    flagged = EXCLUDED.flagged,
    last_calculated_at = now(),
    updated_at = now();

  RETURN json_build_object(
    'score', _final_score,
    'interval_score', _interval_score,
    'variability_score', _variability_score,
    'winrate_score', _winrate_score,
    'pattern_score', _pattern_score,
    'flagged', _flagged
  );
END;
$$;
