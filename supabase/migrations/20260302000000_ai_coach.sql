-- Table to store generated coaching insights
CREATE TABLE IF NOT EXISTS coaching_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('weekly_recap', 'jar_recommendation', 'seasonal_forecast', 'spending_alert', 'money_tip')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coaching_insights_user ON coaching_insights(user_id, created_at DESC);

ALTER TABLE coaching_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights"
  ON coaching_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON coaching_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights"
  ON coaching_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Weekly aggregates materialized view for performance
CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_income_summary AS
SELECT
  user_id,
  DATE_TRUNC('week', entry_date::date) AS week_start,
  SUM(amount) AS total_income,
  COUNT(*) AS entry_count,
  AVG(amount) AS avg_per_entry
FROM income_entries
GROUP BY user_id, DATE_TRUNC('week', entry_date::date);

CREATE UNIQUE INDEX idx_weekly_income_user_week ON weekly_income_summary(user_id, week_start);

CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_expense_summary AS
SELECT
  user_id,
  DATE_TRUNC('week', entry_date::date) AS week_start,
  SUM(amount) AS total_expenses,
  COUNT(*) AS entry_count
FROM expenses
GROUP BY user_id, DATE_TRUNC('week', entry_date::date);

CREATE UNIQUE INDEX idx_weekly_expense_user_week ON weekly_expense_summary(user_id, week_start);
