# Cron job configuration for Supabase
# Add this to your Supabase dashboard under Database > Cron Jobs

# Booth rent reminder - runs daily at 9 AM
SELECT cron.schedule(
  'booth-rent-reminder',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/booth-rent-reminder',
    headers:='{"Authorization": "Bearer your-service-role-key", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

# Weekly snapshot - runs every Sunday at 11:59 PM
SELECT cron.schedule(
  'weekly-snapshot',
  '59 23 * * 0',
  $$
  INSERT INTO weekly_snapshots (user_id, week_start, week_end, total_income, bucket_balances, stability_score)
  SELECT 
    p.id,
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer,
    CURRENT_DATE,
    COALESCE(SUM(ie.amount), 0),
    jsonb_object_agg(bb.bucket_id, bb.current_balance),
    (SELECT get_stability_score(p.id))
  FROM profiles p
  LEFT JOIN income_entries ie ON p.id = ie.user_id 
    AND ie.entry_date >= CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer
  LEFT JOIN bucket_balances bb ON p.id = bb.user_id
  GROUP BY p.id;
  $$
);
