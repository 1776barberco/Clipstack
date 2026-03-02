-- Add due_date to bucket_configs for jar goal deadlines
ALTER TABLE bucket_configs ADD COLUMN IF NOT EXISTS due_date date;
