-- Schedule Weekly Report: Every Saturday at 9:30 AM IST (4:00 AM UTC)
-- 9:30 AM IST = 04:00 UTC
select cron.schedule(
  'weekly-report-sat-930am',
  '0 4 * * 6', 
  $$
  select
    net.http_get(
        url:='https://weruhmrdtlsrbzlwnakz.supabase.co/functions/v1/send-weekly-report',
        headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcnVobXJkdGxzcmJ6bHduYWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkyNDE3OSwiZXhwIjoyMDgxNTAwMTc5fQ.NbDR4QjXgja4bvMFvsdiPhG5Y7uPyMSKUbfdpjCmL18"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule Monthly Report: 1st of every month at 9:30 AM IST (4:00 AM UTC)
-- This logic relies on the function checking "Previous Month" automatically
select cron.schedule(
  'monthly-report-1st-930am',
  '0 4 1 * *', 
  $$
  select
    net.http_get(
        url:='https://weruhmrdtlsrbzlwnakz.supabase.co/functions/v1/send-monthly-report',
        headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcnVobXJkdGxzcmJ6bHduYWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkyNDE3OSwiZXhwIjoyMDgxNTAwMTc5fQ.NbDR4QjXgja4bvMFvsdiPhG5Y7uPyMSKUbfdpjCmL18"}'::jsonb
    ) as request_id;
  $$
);

-- Note: You need to replace SERVICE_ROLE_KEY with your actual service role key
-- found in Supabase Dashboard > Settings > API
