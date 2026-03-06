-- Milestone events: track when users hit savings targets
CREATE TABLE IF NOT EXISTS milestone_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bucket_id uuid NOT NULL REFERENCES bucket_configs(id) ON DELETE CASCADE,
  milestone_pct integer NOT NULL CHECK (milestone_pct IN (25, 50, 75, 100)),
  achieved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, bucket_id, milestone_pct)
);

ALTER TABLE milestone_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones"
  ON milestone_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones"
  ON milestone_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_milestone_events_user ON milestone_events(user_id);
