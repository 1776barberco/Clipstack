
-- 1. Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'checking',
  starting_balance decimal(12,2) DEFAULT 0,
  current_balance decimal(12,2) DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Add account_id to income_entries and expenses
ALTER TABLE income_entries ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES bank_accounts(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES bank_accounts(id);

-- 3. Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own accounts" ON bank_accounts 
  FOR ALL USING (auth.uid() = user_id);

-- 4. Initial backfill: Create a 'Primary' account for existing users from their profile balance
INSERT INTO bank_accounts (user_id, name, type, starting_balance, current_balance, is_primary)
SELECT id, 'Primary Checking', 'checking', starting_balance, starting_balance, true
FROM profiles
ON CONFLICT DO NOTHING;
