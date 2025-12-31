-- Enable the pg_cron extension to schedule jobs
create extension if not exists pg_cron;
-- Enable pg_net for HTTP requests
create extension if not exists pg_net;

-- Schedule the daily reminder function
-- Note: pg_cron uses UTC time.
-- IST is UTC+5:30.
-- 9:30 PM IST = 16:00 UTC
-- 10:30 PM IST = 17:00 UTC
-- 11:30 PM IST = 18:00 UTC

-- Job 1: 9:30 PM IST
select
  cron.schedule(
    'reminder-930pm',
    '0 16 * * *',
    $$
    select
      net.http_post(
        url:='https://weruhmrdtlsrbzlwnakz.supabase.co/functions/v1/daily-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.headers')::json->>'apikey' || '"}'::jsonb
      ) as request_id;
    $$
  );

-- Job 2: 10:30 PM IST
select
  cron.schedule(
    'reminder-1030pm',
    '0 17 * * *',
    $$
    select
      net.http_post(
        url:='https://weruhmrdtlsrbzlwnakz.supabase.co/functions/v1/daily-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.headers')::json->>'apikey' || '"}'::jsonb
      ) as request_id;
    $$
  );

-- Job 3: 11:30 PM IST
select
  cron.schedule(
    'reminder-1130pm',
    '0 18 * * *',
    $$
    select
      net.http_post(
        url:='https://weruhmrdtlsrbzlwnakz.supabase.co/functions/v1/daily-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.headers')::json->>'apikey' || '"}'::jsonb
      ) as request_id;
    $$
  );
