-- Fix Plaid expense assignments so they reduce jar balances exactly once.
--
-- bucket_balances already subtracts rows in expenses. The previous Plaid
-- expense assignment also inserted a negative withdrawal into bucket_transactions,
-- which canceled the expense subtraction in the balance view.

DELETE FROM public.bucket_transactions bt
USING public.plaid_transaction_allocations pta
WHERE pta.allocation_type = 'expense_withdrawal'
  AND bt.user_id = pta.user_id
  AND bt.bucket_id = pta.bucket_id
  AND bt.type = 'withdrawal'
  AND bt.amount = -pta.amount
  AND bt.created_at BETWEEN pta.created_at - interval '10 minutes' AND pta.created_at + interval '10 minutes'
  AND (
    bt.description ILIKE 'Synced expense:%'
    OR bt.description ILIKE 'Plaid expense:%'
  );

CREATE OR REPLACE FUNCTION public.assign_plaid_expense_to_bucket(
  p_user_id uuid,
  p_transaction_id uuid,
  p_bucket_id uuid,
  p_amount numeric DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction public.plaid_transactions%ROWTYPE;
  v_expense_id uuid;
  v_amount numeric;
BEGIN
  SELECT * INTO v_transaction
  FROM public.plaid_transactions
  WHERE id = p_transaction_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plaid transaction not found';
  END IF;

  IF v_transaction.transaction_type != 'expense'
     AND NOT (
       v_transaction.transaction_type = 'transfer'
       AND v_transaction.primary_category = 'TRANSFER_OUT'
       AND v_transaction.amount > 0
     ) THEN
    RAISE EXCEPTION 'Plaid transaction is not an expense';
  END IF;

  IF v_transaction.review_status = 'assigned' THEN
    RAISE EXCEPTION 'Plaid transaction is already assigned';
  END IF;

  v_amount := COALESCE(p_amount, ABS(v_transaction.amount));

  IF v_amount <= 0 OR v_amount > ABS(v_transaction.amount) + 0.01 THEN
    RAISE EXCEPTION 'Invalid expense amount';
  END IF;

  INSERT INTO public.expenses (user_id, bucket_id, amount, description, category, entry_date)
  VALUES (
    p_user_id,
    p_bucket_id,
    v_amount,
    COALESCE(p_note, COALESCE(v_transaction.merchant_name, v_transaction.name, 'Plaid expense')),
    COALESCE(v_transaction.primary_category, v_transaction.detailed_category, 'Plaid'),
    v_transaction.date
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO public.plaid_transaction_allocations (user_id, plaid_transaction_id, bucket_id, amount, allocation_type, expense_id)
  VALUES (p_user_id, p_transaction_id, p_bucket_id, v_amount, 'expense_withdrawal', v_expense_id);

  UPDATE public.plaid_transactions
  SET review_status = 'assigned',
      transaction_type = 'expense',
      expense_id = v_expense_id,
      matched_bucket_id = p_bucket_id,
      assignment_note = p_note,
      assigned_at = now(),
      updated_at = now()
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object('expense_id', v_expense_id, 'amount', v_amount);
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_plaid_expense_to_bucket(uuid, uuid, uuid, numeric, text) TO authenticated;
