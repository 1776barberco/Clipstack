-- The account balance triggers now reverse income/expense deletes automatically.
-- Keep the explicit delete RPCs focused on authorization + cleanup so single
-- deletes do not adjust the selected bank account twice.

CREATE OR REPLACE FUNCTION public.delete_income_entry(
  p_income_entry_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_income record;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id, user_id, amount, account_id
    INTO v_income
  FROM public.income_entries
  WHERE id = p_income_entry_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Income entry not found';
  END IF;

  -- Remove jar deposits created for this income before deleting the income.
  DELETE FROM public.bucket_transactions
  WHERE user_id = p_user_id
    AND income_entry_id = p_income_entry_id;

  -- The account balance delete trigger reverses the bank balance.
  DELETE FROM public.income_entries
  WHERE id = p_income_entry_id
    AND user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_expense_entry(
  p_expense_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expense record;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id, user_id, amount, account_id
    INTO v_expense
  FROM public.expenses
  WHERE id = p_expense_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  -- The account balance delete trigger reverses the bank balance.
  DELETE FROM public.expenses
  WHERE id = p_expense_id
    AND user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_income_entry(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expense_entry(uuid, uuid) TO authenticated;
