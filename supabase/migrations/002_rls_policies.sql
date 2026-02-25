-- RLS Policies for ClipStack

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Bucket configs policies
CREATE POLICY "Users can view own bucket configs"
  ON bucket_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bucket configs"
  ON bucket_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bucket configs"
  ON bucket_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bucket configs"
  ON bucket_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Income entries policies
CREATE POLICY "Users can view own income entries"
  ON income_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own income entries"
  ON income_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income entries"
  ON income_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income entries"
  ON income_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Expenses policies
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

-- Bucket transactions policies
CREATE POLICY "Users can view own transactions"
  ON bucket_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON bucket_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON bucket_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON bucket_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Weekly snapshots policies
CREATE POLICY "Users can view own weekly snapshots"
  ON weekly_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weekly snapshots"
  ON weekly_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Bucket balances view policy
CREATE POLICY "Users can view own bucket balances"
  ON bucket_balances FOR SELECT
  USING (auth.uid() = user_id);
