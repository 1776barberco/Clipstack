-- Coach chat messages table
CREATE TABLE IF NOT EXISTS coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tone text DEFAULT 'motivator',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_messages_user ON coach_messages(user_id, created_at DESC);

-- RLS: users can only see their own messages
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coach messages" ON coach_messages;
CREATE POLICY "Users can view own coach messages" ON coach_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own coach messages" ON coach_messages;
CREATE POLICY "Users can insert own coach messages" ON coach_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coach tone preferences (stored on profile)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_tone text DEFAULT 'motivator';
