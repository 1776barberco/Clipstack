-- Streak tracking columns on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_streak_week date;

-- Function to update a user's streak based on income entries
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start date;
  v_has_income boolean;
  v_last_streak_week date;
  v_current_streak integer;
  v_longest_streak integer;
BEGIN
  -- Current week start (Sunday)
  -- EXTRACT(DOW FROM ...) returns 0 for Sunday, 1 for Monday, etc.
  v_week_start := now()::date - EXTRACT(DOW FROM now())::integer;

  -- Check if user has any income entries this week (Sunday to Saturday)
  SELECT EXISTS (
    SELECT 1 FROM income_entries
    WHERE user_id = p_user_id
      AND entry_date >= v_week_start
      AND entry_date < v_week_start + 7
  ) INTO v_has_income;

  -- If no income this week, do nothing
  IF NOT v_has_income THEN
    RETURN;
  END IF;

  -- Get current streak data
  SELECT current_streak, longest_streak, last_streak_week
  INTO v_current_streak, v_longest_streak, v_last_streak_week
  FROM profiles
  WHERE id = p_user_id;

  -- Already updated for this week
  IF v_last_streak_week = v_week_start THEN
    RETURN;
  END IF;

  IF v_last_streak_week = v_week_start - 7 THEN
    -- Last streak week was exactly last week: increment
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    -- Gap (or first time): reset to 1
    v_current_streak := 1;
  END IF;

  -- Update longest streak if new record
  IF v_current_streak > COALESCE(v_longest_streak, 0) THEN
    v_longest_streak := v_current_streak;
  END IF;

  UPDATE profiles
  SET current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_streak_week = v_week_start
  WHERE id = p_user_id;
END;
$$;
