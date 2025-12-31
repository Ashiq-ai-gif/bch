-- First, let's clean up ALL existing reminders to avoid duplicates
select cron.unschedule('reminder-930pm-ist');
select cron.unschedule('reminder-1030pm-ist');
select cron.unschedule('reminder-1130pm-ist');
-- Also unschedule the ones with different names if they exist (from previous attempts)
select cron.unschedule('reminder-930pm');
select cron.unschedule('reminder-1030pm');
select cron.unschedule('reminder-1130pm');

-- Now, schedule the CORRECT times
-- Calculation: IST is UTC + 5:30
-- 9:30 PM IST = 21:30. Deduct 5:30 = 16:00 UTC.
select cron.schedule(
  'reminder-930pm-ist',
  '0 16 * * *', 
  $$
  select
    net.http_post(
        url:='https://weruhmrdtlsrbzlwnakz.supabase.co/functions/v1/daily-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcnVobXJkdGxzcmJ6bHduYWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkyNDE3OSwiZXhwIjoyMDgxNTAwMTc5fQ.NbDR4QjXgja4bvMFvsdiPhG5Y7uPyMSKUbfdpjCmL18"}'::jsonb
    ) as request_id;
  $$
);

-- 10:30 PM IST = 22:30. Deduct 5:30 = 17:00 UTC.
select cron.schedule(
  'reminder-1030pm-ist',
  '0 17 * * *',
  $$
  select
    net.http_post(
        url:='https://weruhmrdtlsrbzlwnakz.supabase.co/functions/v1/daily-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcnVobXJkdGxzcmJ6bHduYWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkyNDE3OSwiZXhwIjoyMDgxNTAwMTc5fQ.NbDR4QjXgja4bvMFvsdiPhG5Y7uPyMSKUbfdpjCmL18"}'::jsonb
    ) as request_id;
  $$
);

-- 11:30 PM IST = 23:30. Deduct 5:30 = 18:00 UTC.
select cron.schedule(
  'reminder-1130pm-ist',
  '0 18 * * *',
  $$
  select
    net.http_post(
        url:='https://weruhmrdtlsrbzlwnakz.supabase.co/functions/v1/daily-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcnVobXJkdGxzcmJ6bHduYWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTkyNDE3OSwiZXhwIjoyMDgxNTAwMTc5fQ.NbDR4QjXgja4bvMFvsdiPhG5Y7uPyMSKUbfdpjCmL18"}'::jsonb
    ) as request_id;
  $$
);

-- Verify
select * from cron.job;
