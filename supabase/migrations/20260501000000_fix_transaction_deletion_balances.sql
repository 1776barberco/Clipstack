-- Fix stale jar balances when income/expense history is deleted.
--
-- Jar balances are calculated from bucket_transactions + expenses. The old
-- delete endpoint removed income_entries/expenses but income deletes left
-- bucket_transactions behind because income_entry_id used ON DELETE SET NULL.
-- This migration adds explicit cleanup/reversal RPCs so single deletes and
-- bulk history clears keep jar balances and bank balances correct.

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

  -- Remove the jar deposits created for this income before deleting the income.
  DELETE FROM public.bucket_transactions
  WHERE user_id = p_user_id
    AND income_entry_id = p_income_entry_id;

  -- Reverse the bank balance change if this income was tied to an account.
  IF v_income.account_id IS NOT NULL THEN
    PERFORM public.adjust_account_balance(v_income.account_id, -v_income.amount);
  END IF;

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

  -- Reverse the bank balance change if this expense was tied to an account.
  IF v_expense.account_id IS NOT NULL THEN
    PERFORM public.adjust_account_balance(v_expense.account_id, v_expense.amount);
  END IF;

  DELETE FROM public.expenses
  WHERE id = p_expense_id
    AND user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_user_transaction_history(
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Remove jar transactions first so income deletes cannot orphan deposits.
  DELETE FROM public.bucket_transactions
  WHERE user_id = p_user_id;

  -- Clear logged spending and income.
  DELETE FROM public.expenses
  WHERE user_id = p_user_id;

  DELETE FROM public.income_entries
  WHERE user_id = p_user_id;

  -- With all logged income/expenses gone, bank account running balances should
  -- return to starting balances too.
  UPDATE public.bank_accounts
  SET current_balance = starting_balance,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_income_entry(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expense_entry(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_user_transaction_history(uuid) TO authenticated;
