-- Add optional jar grouping so users can roll related jars into views like
-- Personal, Business, Taxes, or Savings without changing allocation behavior.
ALTER TABLE public.bucket_configs
  ADD COLUMN IF NOT EXISTS group_name text;

CREATE INDEX IF NOT EXISTS idx_bucket_configs_user_group
  ON public.bucket_configs(user_id, group_name);

DROP VIEW IF EXISTS public.bucket_balances;

CREATE VIEW public.bucket_balances
WITH (security_invoker = true) AS
SELECT
  bc.id as bucket_id,
  bc.user_id,
  bc.name as bucket_name,
  bc.group_name,
  bc.color,
  bc.percentage,
  COALESCE(SUM(CASE WHEN bt.type = 'deposit' THEN bt.amount ELSE 0 END), 0) as total_deposits,
  COALESCE(SUM(CASE WHEN bt.type = 'withdrawal' THEN bt.amount ELSE 0 END), 0) as total_withdrawals,
  COALESCE(e.total_expenses, 0) as total_expenses,
  COALESCE(SUM(CASE WHEN bt.type = 'deposit' THEN bt.amount ELSE -bt.amount END), 0) - COALESCE(e.total_expenses, 0) as current_balance
FROM public.bucket_configs bc
LEFT JOIN public.bucket_transactions bt ON bc.id = bt.bucket_id
LEFT JOIN (
  SELECT bucket_id, COALESCE(SUM(amount), 0) as total_expenses
  FROM public.expenses
  WHERE bucket_id IS NOT NULL
  GROUP BY bucket_id
) e ON bc.id = e.bucket_id
GROUP BY bc.id, bc.user_id, bc.name, bc.group_name, bc.color, bc.percentage, e.total_expenses;
