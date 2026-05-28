-- Plaid transaction review and jar assignment workflow.

ALTER TABLE plaid_transactions
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'needs_review' CHECK (review_status IN ('needs_review', 'assigned', 'ignored')),
  ADD COLUMN IF NOT EXISTS income_entry_id uuid REFERENCES income_entries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignment_note text,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

CREATE TABLE IF NOT EXISTS plaid_transaction_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_transaction_id uuid NOT NULL REFERENCES plaid_transactions(id) ON DELETE CASCADE,
  bucket_id uuid NOT NULL REFERENCES bucket_configs(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  allocation_type text NOT NULL CHECK (allocation_type IN ('income_split', 'expense_withdrawal')),
  income_entry_id uuid REFERENCES income_entries(id) ON DELETE SET NULL,
  expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plaid_transactions_review_status_idx ON plaid_transactions(user_id, review_status, date DESC);
CREATE INDEX IF NOT EXISTS plaid_transaction_allocations_transaction_idx ON plaid_transaction_allocations(plaid_transaction_id);
CREATE INDEX IF NOT EXISTS plaid_transaction_allocations_user_idx ON plaid_transaction_allocations(user_id, created_at DESC);

ALTER TABLE plaid_transaction_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own Plaid allocations" ON plaid_transaction_allocations;
CREATE POLICY "Users can manage own Plaid allocations" ON plaid_transaction_allocations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION assign_plaid_income_to_buckets(
  p_user_id uuid,
  p_transaction_id uuid,
  p_allocations jsonb,
  p_note text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_transaction plaid_transactions%ROWTYPE;
  v_income_entry_id uuid;
  v_bucket_id uuid;
  v_amount numeric;
  v_total numeric := 0;
BEGIN
  SELECT * INTO v_transaction
  FROM plaid_transactions
  WHERE id = p_transaction_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plaid transaction not found';
  END IF;

  IF v_transaction.transaction_type != 'income' THEN
    RAISE EXCEPTION 'Plaid transaction is not income';
  END IF;

  IF v_transaction.review_status = 'assigned' THEN
    RAISE EXCEPTION 'Plaid transaction is already assigned';
  END IF;

  SELECT COALESCE(SUM(value::numeric), 0) INTO v_total
  FROM jsonb_each_text(p_allocations);

  IF v_total <= 0 OR v_total > ABS(v_transaction.amount) + 0.01 THEN
    RAISE EXCEPTION 'Invalid allocation total';
  END IF;

  INSERT INTO income_entries (user_id, amount, source, notes, entry_date)
  VALUES (
    p_user_id,
    v_total,
    COALESCE(v_transaction.merchant_name, v_transaction.name, 'Plaid income'),
    COALESCE(p_note, 'Imported from Plaid transaction') || ' · Plaid transaction: ' || v_transaction.plaid_transaction_id,
    v_transaction.date
  )
  RETURNING id INTO v_income_entry_id;

  FOR v_bucket_id, v_amount IN
    SELECT key::uuid, value::numeric
    FROM jsonb_each_text(p_allocations)
  LOOP
    IF v_amount > 0 THEN
      INSERT INTO bucket_transactions (user_id, bucket_id, income_entry_id, amount, type, description)
      VALUES (
        p_user_id,
        v_bucket_id,
        v_income_entry_id,
        v_amount,
        'deposit',
        COALESCE(p_note, 'Plaid income split') || ': ' || COALESCE(v_transaction.merchant_name, v_transaction.name)
      );

      INSERT INTO plaid_transaction_allocations (user_id, plaid_transaction_id, bucket_id, amount, allocation_type, income_entry_id)
      VALUES (p_user_id, p_transaction_id, v_bucket_id, v_amount, 'income_split', v_income_entry_id);
    END IF;
  END LOOP;

  UPDATE plaid_transactions
  SET review_status = 'assigned',
      income_entry_id = v_income_entry_id,
      assignment_note = p_note,
      matched_bucket_id = NULL,
      assigned_at = now(),
      updated_at = now()
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object('income_entry_id', v_income_entry_id, 'allocated_total', v_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  IF v_transaction.transaction_type != 'expense' THEN
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
