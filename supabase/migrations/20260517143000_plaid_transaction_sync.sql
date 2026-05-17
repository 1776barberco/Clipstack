-- Plaid Transaction Sync v1 (read-only imports; no money movement)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS plaid_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id text NOT NULL UNIQUE,
  access_token text NOT NULL,
  institution_id text,
  institution_name text,
  products text[] NOT NULL DEFAULT ARRAY['transactions']::text[],
  available_products text[] DEFAULT ARRAY[]::text[],
  billed_products text[] DEFAULT ARRAY[]::text[],
  transactions_cursor text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'revoked', 'removed')),
  error_code text,
  error_message text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plaid_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id uuid NOT NULL REFERENCES plaid_items(id) ON DELETE CASCADE,
  plaid_account_id text NOT NULL UNIQUE,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
  name text NOT NULL,
  official_name text,
  mask text,
  type text,
  subtype text,
  verification_status text,
  current_balance numeric(12,2),
  available_balance numeric(12,2),
  iso_currency_code text DEFAULT 'USD',
  unofficial_currency_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plaid_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id uuid NOT NULL REFERENCES plaid_items(id) ON DELETE CASCADE,
  plaid_account_id uuid NOT NULL REFERENCES plaid_accounts(id) ON DELETE CASCADE,
  plaid_transaction_id text NOT NULL UNIQUE,
  name text NOT NULL,
  merchant_name text,
  amount numeric(12,2) NOT NULL,
  iso_currency_code text DEFAULT 'USD',
  unofficial_currency_code text,
  date date NOT NULL,
  authorized_date date,
  pending boolean NOT NULL DEFAULT false,
  pending_transaction_id text,
  payment_channel text,
  category text[] DEFAULT ARRAY[]::text[],
  category_id text,
  primary_category text,
  detailed_category text,
  transaction_type text NOT NULL DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  personal_finance_category jsonb,
  location jsonb,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  ignored boolean NOT NULL DEFAULT false,
  matched_bucket_id uuid REFERENCES bucket_configs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plaid_transaction_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  match_type text NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains', 'exact', 'regex')),
  match_value text NOT NULL,
  direction text NOT NULL DEFAULT 'expense' CHECK (direction IN ('income', 'expense', 'both')),
  bucket_id uuid REFERENCES bucket_configs(id) ON DELETE SET NULL,
  auto_ignore boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plaid_items_user_id_idx ON plaid_items(user_id);
CREATE INDEX IF NOT EXISTS plaid_accounts_user_id_idx ON plaid_accounts(user_id);
CREATE INDEX IF NOT EXISTS plaid_accounts_item_id_idx ON plaid_accounts(plaid_item_id);
CREATE INDEX IF NOT EXISTS plaid_transactions_user_date_idx ON plaid_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS plaid_transactions_account_date_idx ON plaid_transactions(plaid_account_id, date DESC);
CREATE INDEX IF NOT EXISTS plaid_transaction_rules_user_idx ON plaid_transaction_rules(user_id, is_active, priority);

ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_transaction_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Plaid items" ON plaid_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own Plaid accounts" ON plaid_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own Plaid transactions" ON plaid_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own Plaid transaction rules" ON plaid_transaction_rules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_plaid_items_updated_at BEFORE UPDATE ON plaid_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plaid_accounts_updated_at BEFORE UPDATE ON plaid_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plaid_transactions_updated_at BEFORE UPDATE ON plaid_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plaid_transaction_rules_updated_at BEFORE UPDATE ON plaid_transaction_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
