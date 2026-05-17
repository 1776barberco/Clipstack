-- Skip jar allocation when income is deposited into a savings account.
-- Savings accounts hold money that's already earmarked and shouldn't
-- be split into the jar/bucket system.

CREATE OR REPLACE FUNCTION trigger_allocate_income()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_account_type text;
BEGIN
  -- Look up the account type for this income entry
  IF NEW.account_id IS NOT NULL THEN
    SELECT type INTO v_account_type
    FROM bank_accounts
    WHERE id = NEW.account_id;
  END IF;

  -- Skip jar allocation for savings accounts
  IF v_account_type = 'savings' THEN
    RETURN NEW;
  END IF;

  PERFORM allocate_income_to_buckets(NEW.user_id, NEW.id, NEW.amount);
  RETURN NEW;
END;
$$;
