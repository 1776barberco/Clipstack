-- Enable Realtime for key tables so subscriptions actually fire
-- Without this, the postgres_changes subscriptions in the hooks are silent

ALTER PUBLICATION supabase_realtime ADD TABLE income_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE bucket_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE bucket_configs;
