-- ============================================
-- Migration: Jarless Expenses + Daily Tracking Reminders
-- ============================================

-- ============================================
-- A. JARLESS EXPENSES: Make bucket_id nullable
-- ============================================

-- Allow expenses without a jar (recorded against bank total only)
ALTER TABLE expenses ALTER COLUMN bucket_id DROP NOT NULL;

-- Update the bucket_balances view to exclude jarless expenses from jar totals
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
  WHERE bucket_id IS NOT NULL
  GROUP BY bucket_id
) e ON bc.id = e.bucket_id
GROUP BY bc.id, bc.user_id, bc.name, bc.color, bc.percentage, e.total_expenses;

-- ============================================
-- B. DAILY TRACKING REMINDERS: Notification preferences
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_tracking_reminder boolean DEFAULT false,
  reminder_time time DEFAULT '18:00',
  timezone text DEFAULT 'America/New_York',
  push_enabled boolean DEFAULT false,
  push_subscription jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_notification_prefs UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_reminder ON notification_preferences(daily_tracking_reminder, reminder_time);
