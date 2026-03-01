-- Update allocate_income_to_buckets to support fixed-amount jars
-- Fixed-amount jars (target_amount > 0) get their set amount first,
-- then remaining income is split by percentage across %-based jars.

CREATE OR REPLACE FUNCTION allocate_income_to_buckets(
  p_user_id uuid,
  p_income_entry_id uuid,
  p_amount decimal
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bucket record;
  v_allocation decimal;
  v_remaining decimal := p_amount;
  v_pct_total decimal := 0;
BEGIN
  -- Authorization check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- PASS 1: Allocate fixed-amount jars first
  FOR v_bucket IN
    SELECT id, target_amount
    FROM bucket_configs
    WHERE user_id = p_user_id
      AND target_amount IS NOT NULL
      AND target_amount > 0
    ORDER BY priority DESC, created_at ASC
  LOOP
    v_allocation := LEAST(v_bucket.target_amount, v_remaining);

    IF v_allocation > 0 THEN
      INSERT INTO bucket_transactions (
        user_id, bucket_id, income_entry_id, amount, type, description
      ) VALUES (
        p_user_id,
        v_bucket.id,
        p_income_entry_id,
        v_allocation,
        'deposit',
        'Auto-allocation (fixed amount)'
      );
      v_remaining := v_remaining - v_allocation;
    END IF;
  END LOOP;

  -- PASS 2: Split remaining income across percentage-based jars
  IF v_remaining > 0 THEN
    -- Get total percentage for normalization
    SELECT COALESCE(SUM(percentage), 0) INTO v_pct_total
    FROM bucket_configs
    WHERE user_id = p_user_id
      AND (target_amount IS NULL OR target_amount = 0)
      AND percentage > 0;

    IF v_pct_total > 0 THEN
      FOR v_bucket IN
        SELECT id, percentage, is_tax_bucket
        FROM bucket_configs
        WHERE user_id = p_user_id
          AND (target_amount IS NULL OR target_amount = 0)
          AND percentage > 0
        ORDER BY priority DESC, created_at ASC
      LOOP
        v_allocation := ROUND(v_remaining * (v_bucket.percentage / v_pct_total), 2);

        IF v_allocation > 0 THEN
          INSERT INTO bucket_transactions (
            user_id, bucket_id, income_entry_id, amount, type, description
          ) VALUES (
            p_user_id,
            v_bucket.id,
            p_income_entry_id,
            v_allocation,
            'deposit',
            'Auto-allocation from income entry'
          );
        END IF;
      END LOOP;
    END IF;
  END IF;
END;
$$;
