-- Treat outgoing Plaid transfers as spendable review items.

UPDATE plaid_transactions
SET transaction_type = 'expense',
    updated_at = now()
WHERE transaction_type = 'transfer'
  AND primary_category = 'TRANSFER_OUT'
  AND amount > 0
  AND review_status = 'needs_review';

CREATE OR REPLACE FUNCTION assign_plaid_expense_to_bucket(
  p_user_id uuid,
  p_transaction_id uuid,
  p_bucket_id uuid,
  p_amount numeric DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_transaction plaid_transactions%ROWTYPE;
  v_expense_id uuid;
  v_amount numeric;
BEGIN
  SELECT * INTO v_transaction
  FROM plaid_transactions
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

  INSERT INTO expenses (user_id, bucket_id, amount, description, category, entry_date)
  VALUES (
    p_user_id,
    p_bucket_id,
    v_amount,
    COALESCE(p_note, COALESCE(v_transaction.merchant_name, v_transaction.name, 'Plaid expense')),
    COALESCE(v_transaction.primary_category, v_transaction.detailed_category, 'Plaid'),
    v_transaction.date
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO bucket_transactions (user_id, bucket_id, amount, type, description)
  VALUES (
    p_user_id,
    p_bucket_id,
    -v_amount,
    'withdrawal',
    COALESCE(p_note, 'Plaid expense') || ': ' || COALESCE(v_transaction.merchant_name, v_transaction.name)
  );

  INSERT INTO plaid_transaction_allocations (user_id, plaid_transaction_id, bucket_id, amount, allocation_type, expense_id)
  VALUES (p_user_id, p_transaction_id, p_bucket_id, v_amount, 'expense_withdrawal', v_expense_id);

  UPDATE plaid_transactions
  SET review_status = 'assigned',
      expense_id = v_expense_id,
      matched_bucket_id = p_bucket_id,
      assignment_note = p_note,
      assigned_at = now(),
      updated_at = now()
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object('expense_id', v_expense_id, 'amount', v_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
