-- ============================================
-- ADD STARTING BALANCE TO PROFILES
-- Allows users to set their initial bank balance
-- before they started tracking with TipJars.
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS starting_balance decimal(10,2) DEFAULT 0;

-- Add a comment for documentation
COMMENT ON COLUMN profiles.starting_balance IS 'User''s initial bank balance before using TipJars. Used to calculate current bank total.';
