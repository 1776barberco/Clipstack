-- Fix: "function allocate_income_to_buckets(uuid, uuid, numeric) is not unique"
--
-- The 20260301 migration created a 3-param version (uuid, uuid, decimal)
-- and 20260303 added a 4-param version (uuid, uuid, decimal, jsonb DEFAULT '{}').
-- CREATE OR REPLACE with a different signature doesn't replace — it creates an overload.
-- When called with 3 args, Postgres can't decide which to use → "not unique" error.
--
-- Fix: Drop the old 3-param version. The 4-param version with DEFAULT handles both cases.

DROP FUNCTION IF EXISTS allocate_income_to_buckets(uuid, uuid, decimal);
DROP FUNCTION IF EXISTS allocate_income_to_buckets(uuid, uuid, numeric);

-- Re-create the correct 4-param version (manual fixed-jar splits)
CREATE OR REPLACE FUNCTION allocate_income_to_buckets(
  p_user_id uuid,
  p_income_entry_id uuid,
  p_amount decimal,
  p_fixed_allocations jsonb DEFAULT '{}'::jsonb
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
  v_fixed_amount decimal;
  v_bucket_id text;
BEGIN
  -- Authorization check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- PASS 1: Apply manual fixed-jar allocations from the UI
  -- p_fixed_allocations is a JSON object like {"bucket-uuid": 50.00, "bucket-uuid2": 25.00}
  IF p_fixed_allocations IS NOT NULL AND p_fixed_allocations != '{}'::jsonb THEN
    FOR v_bucket_id, v_fixed_amount IN
      SELECT key, value::decimal
      FROM jsonb_each_text(p_fixed_allocations)
    LOOP
      -- Only allocate if the bucket belongs to this user and amount is positive
      IF v_fixed_amount > 0 AND EXISTS (
        SELECT 1 FROM bucket_configs WHERE id = v_bucket_id::uuid AND user_id = p_user_id
      ) THEN
        INSERT INTO bucket_transactions (
          user_id, bucket_id, income_entry_id, amount, type, description
        ) VALUES (
          p_user_id,
          v_bucket_id::uuid,
          p_income_entry_id,
          LEAST(v_fixed_amount, v_remaining),
          'deposit',
          'Manual allocation (fixed jar)'
        );
        v_remaining := v_remaining - LEAST(v_fixed_amount, v_remaining);
      END IF;
    END LOOP;
  END IF;

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
