-- ============================================
-- CLIPSTACK DATABASE SETUP - FIXED MIGRATION
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  booth_rent_amount decimal(10,2),
  booth_rent_due_day integer CHECK (booth_rent_due_day BETWEEN 1 AND 31),
  tax_rate decimal(5,4) DEFAULT 0.2500,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bucket_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  percentage decimal(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  target_amount decimal(10,2),
  is_tax_bucket boolean DEFAULT false,
  priority integer DEFAULT 0,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS income_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  source text,
  notes text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bucket_id uuid NOT NULL REFERENCES bucket_configs(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  description text,
  category text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bucket_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bucket_id uuid NOT NULL REFERENCES bucket_configs(id) ON DELETE CASCADE,
  income_entry_id uuid REFERENCES income_entries(id) ON DELETE SET NULL,
  amount decimal(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weekly_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_income decimal(10,2) NOT NULL DEFAULT 0,
  bucket_balances jsonb NOT NULL DEFAULT '{}',
  stability_score decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_snapshots_user_week 
ON weekly_snapshots(user_id, week_start);

CREATE INDEX IF NOT EXISTS idx_bucket_configs_user ON bucket_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_income_entries_user_date ON income_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_expenses_bucket ON expenses(bucket_id);
CREATE INDEX IF NOT EXISTS idx_bucket_transactions_user ON bucket_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bucket_transactions_bucket ON bucket_transactions(bucket_id);
CREATE INDEX IF NOT EXISTS idx_bucket_transactions_income ON bucket_transactions(income_entry_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- ============================================
-- 3. VIEW
-- ============================================

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

-- ============================================
-- 4. FUNCTIONS
-- ============================================

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
  v_tax_bucket_id uuid;
BEGIN
  -- Authorization check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id INTO v_tax_bucket_id
  FROM bucket_configs
  WHERE user_id = p_user_id AND is_tax_bucket = true
  LIMIT 1;

  FOR v_bucket IN 
    SELECT id, percentage, is_tax_bucket
    FROM bucket_configs
    WHERE user_id = p_user_id
    ORDER BY priority DESC, created_at ASC
  LOOP
    v_allocation := ROUND(p_amount * (v_bucket.percentage / 100), 2);
    
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
      
      v_remaining := v_remaining - v_allocation;
    END IF;
  END LOOP;

  IF v_remaining > 0 THEN
    INSERT INTO bucket_transactions (
      user_id, bucket_id, income_entry_id, amount, type, description
    )
    SELECT 
      p_user_id,
      id,
      p_income_entry_id,
      v_remaining,
      'deposit',
      'Remaining allocation'
    FROM bucket_configs
    WHERE user_id = p_user_id AND is_tax_bucket = false
    ORDER BY priority DESC, created_at ASC
    LIMIT 1;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_stability_score(p_user_id uuid)
RETURNS decimal
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_weekly_income decimal;
  v_current_week_income decimal;
  v_score decimal;
  v_week_start date;
BEGIN
  SELECT AVG(total_income) INTO v_avg_weekly_income
  FROM weekly_snapshots
  WHERE user_id = p_user_id
  AND week_start >= CURRENT_DATE - INTERVAL '8 weeks';

  v_week_start := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer;
  
  SELECT COALESCE(SUM(amount), 0) INTO v_current_week_income
  FROM income_entries
  WHERE user_id = p_user_id
  AND entry_date >= v_week_start;

  IF v_avg_weekly_income IS NULL OR v_avg_weekly_income = 0 THEN
    v_score := 50;
  ELSE
    v_score := LEAST(100, GREATEST(0, (v_current_week_income / v_avg_weekly_income) * 50 + 50));
  END IF;

  RETURN v_score;
END;
$$;

-- Trigger function for auto-allocation
CREATE OR REPLACE FUNCTION trigger_allocate_income()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM allocate_income_to_buckets(NEW.user_id, NEW.id, NEW.amount);
  RETURN NEW;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- 5. TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS allocate_income_trigger ON income_entries;
CREATE TRIGGER allocate_income_trigger
  AFTER INSERT ON income_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_allocate_income();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bucket_configs_updated_at ON bucket_configs;
CREATE TRIGGER update_bucket_configs_updated_at
  BEFORE UPDATE ON bucket_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_income_entries_updated_at ON income_entries;
CREATE TRIGGER update_income_entries_updated_at
  BEFORE UPDATE ON income_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ENABLE RLS
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES (with DROP IF EXISTS to avoid duplicates)
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Bucket configs
DROP POLICY IF EXISTS "Users can view own bucket configs" ON bucket_configs;
CREATE POLICY "Users can view own bucket configs" ON bucket_configs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bucket configs" ON bucket_configs;
CREATE POLICY "Users can create own bucket configs" ON bucket_configs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bucket configs" ON bucket_configs;
CREATE POLICY "Users can update own bucket configs" ON bucket_configs FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bucket configs" ON bucket_configs;
CREATE POLICY "Users can delete own bucket configs" ON bucket_configs FOR DELETE USING (auth.uid() = user_id);

-- Income entries
DROP POLICY IF EXISTS "Users can view own income entries" ON income_entries;
CREATE POLICY "Users can view own income entries" ON income_entries FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own income entries" ON income_entries;
CREATE POLICY "Users can create own income entries" ON income_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own income entries" ON income_entries;
CREATE POLICY "Users can update own income entries" ON income_entries FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own income entries" ON income_entries;
CREATE POLICY "Users can delete own income entries" ON income_entries FOR DELETE USING (auth.uid() = user_id);

-- Expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own expenses" ON expenses;
CREATE POLICY "Users can create own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Bucket transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON bucket_transactions;
CREATE POLICY "Users can view own transactions" ON bucket_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own transactions" ON bucket_transactions;
CREATE POLICY "Users can create own transactions" ON bucket_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON bucket_transactions;
CREATE POLICY "Users can update own transactions" ON bucket_transactions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON bucket_transactions;
CREATE POLICY "Users can delete own transactions" ON bucket_transactions FOR DELETE USING (auth.uid() = user_id);

-- Weekly snapshots
DROP POLICY IF EXISTS "Users can view own weekly snapshots" ON weekly_snapshots;
CREATE POLICY "Users can view own weekly snapshots" ON weekly_snapshots FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own weekly snapshots" ON weekly_snapshots;
CREATE POLICY "Users can create own weekly snapshots" ON weekly_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 8. CRON JOBS (run separately if pg_cron is enabled)
-- Uncomment and update YOUR-PROJECT-REF and YOUR-SERVICE-ROLE-KEY
-- ============================================

-- SELECT cron.schedule(
--   'booth-rent-reminder',
--   '0 9 * * *',
--   $$
--   SELECT net.http_post(
--     url:='https://YOUR-PROJECT-REF.supabase.co/functions/v1/booth-rent-reminder',
--     headers:='{"Authorization": "Bearer YOUR-SERVICE-ROLE-KEY", "Content-Type": "application/json"}'::jsonb
--   ) AS request_id;
--   $$
-- );

-- SELECT cron.schedule(
--   'weekly-snapshot',
--   '59 23 * * 0',
--   $$
--   INSERT INTO weekly_snapshots (user_id, week_start, week_end, total_income, bucket_balances, stability_score)
--   SELECT 
--     p.id,
--     CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer,
--     CURRENT_DATE,
--     COALESCE(SUM(ie.amount), 0),
--     jsonb_object_agg(bb.bucket_id, bb.current_balance),
--     (SELECT get_stability_score(p.id))
--   FROM profiles p
--   LEFT JOIN income_entries ie ON p.id = ie.user_id 
--     AND ie.entry_date >= CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer
--   LEFT JOIN bucket_balances bb ON p.id = bb.user_id
--   GROUP BY p.id;
--   $$
-- );

-- ============================================
-- SETUP COMPLETE! ✅
-- Tables: profiles, bucket_configs, income_entries, expenses,
--         bucket_transactions, weekly_snapshots, notifications
-- View:   bucket_balances
-- ============================================
