-- Update bucket_balances view to include expenses
CREATE OR REPLACE VIEW bucket_balances AS
SELECT 
  bc.id as bucket_id,
  bc.user_id,
  bc.name as bucket_name,
  bc.color,
  bc.percentage,
  COALESCE(SUM(CASE WHEN bt.type = 'deposit' THEN bt.amount ELSE 0 END), 0) as total_deposits,
  COALESCE(SUM(CASE WHEN bt.type = 'withdrawal' THEN bt.amount ELSE 0 END), 0) as total_withdrawals,
  COALESCE(e.total_expenses, 0) as total_expenses,
  COALESCE(SUM(CASE WHEN bt.type = 'deposit' THEN bt.amount ELSE -bt.amount END), 0) - COALESCE(e.total_expenses, 0) as current_balance
FROM bucket_configs bc
LEFT JOIN bucket_transactions bt ON bc.id = bt.bucket_id
LEFT JOIN (
  SELECT bucket_id, COALESCE(SUM(amount), 0) as total_expenses
  FROM expenses
  GROUP BY bucket_id
) e ON bc.id = e.bucket_id
GROUP BY bc.id, bc.user_id, bc.name, bc.color, bc.percentage, e.total_expenses;

-- Add policy for expenses table
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);
