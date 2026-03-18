-- Migration: Add recurring jar support to bucket_configs
-- is_recurring: whether this jar resets and rolls over on a schedule
-- recurring_interval: 'weekly' | 'biweekly' | 'monthly' | 'quarterly'

ALTER TABLE bucket_configs
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurring_interval text DEFAULT NULL;

-- Constraint: recurring_interval must be valid when is_recurring is true
ALTER TABLE bucket_configs
  ADD CONSTRAINT chk_recurring_interval
  CHECK (
    (is_recurring = false)
    OR (is_recurring = true AND recurring_interval IN ('weekly', 'biweekly', 'monthly', 'quarterly'))
  );

-- RPC: advance_jar_due_date
-- Called after "Mark as Paid". Withdraws the full balance and advances
-- the due_date by the recurring_interval. Returns the new due date.
CREATE OR REPLACE FUNCTION advance_jar_due_date(
  p_bucket_id uuid,
  p_user_id uuid
)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bucket   bucket_configs%ROWTYPE;
  v_balance  numeric;
  v_new_due  date;
BEGIN
  -- Fetch the bucket (locked for update)
  SELECT * INTO v_bucket
    FROM bucket_configs
    WHERE id = p_bucket_id AND user_id = p_user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jar not found or not owned by user';
  END IF;

  IF NOT v_bucket.is_recurring THEN
    RAISE EXCEPTION 'Jar is not configured as recurring';
  END IF;

  IF v_bucket.due_date IS NULL THEN
    RAISE EXCEPTION 'Jar has no due date set';
  END IF;

  -- Get current balance from the view
  SELECT COALESCE(current_balance, 0) INTO v_balance
    FROM bucket_balances
    WHERE bucket_id = p_bucket_id AND user_id = p_user_id;

  -- Record a withdrawal for the full balance (only if > 0)
  IF v_balance > 0 THEN
    INSERT INTO bucket_transactions (user_id, bucket_id, amount, type, description)
    VALUES (
      p_user_id,
      p_bucket_id,
      v_balance,
      'withdrawal',
      'Recurring jar paid — ' || v_bucket.name
    );
  END IF;

  -- Advance the due date by the interval
  -- If the current due_date is in the past, advance from TODAY instead
  v_new_due := GREATEST(v_bucket.due_date, CURRENT_DATE);

  CASE v_bucket.recurring_interval
    WHEN 'weekly'    THEN v_new_due := v_new_due + INTERVAL '7 days';
    WHEN 'biweekly'  THEN v_new_due := v_new_due + INTERVAL '14 days';
    WHEN 'monthly'   THEN v_new_due := v_new_due + INTERVAL '1 month';
    WHEN 'quarterly' THEN v_new_due := v_new_due + INTERVAL '3 months';
    ELSE RAISE EXCEPTION 'Invalid recurring_interval: %', v_bucket.recurring_interval;
  END CASE;

  -- Update the bucket with the new due date
  UPDATE bucket_configs
    SET due_date = v_new_due, updated_at = now()
    WHERE id = p_bucket_id;

  RETURN v_new_due;
END;
$$;
