-- Simple key-value settings table for app-level config (e.g. stripe_mode)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Only service_role can read/write
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- No public access — only service_role (admin API routes) can touch this
DROP POLICY IF EXISTS "No public access" ON app_settings;
CREATE POLICY "No public access" ON app_settings FOR ALL USING (false);

-- Seed default stripe mode
INSERT INTO app_settings (key, value) VALUES ('stripe_mode', 'test')
ON CONFLICT (key) DO NOTHING;
