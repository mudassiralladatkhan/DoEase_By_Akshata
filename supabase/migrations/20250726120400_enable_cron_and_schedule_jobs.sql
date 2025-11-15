/*
  # [Enable pg_cron and Schedule Jobs]
  This migration enables the `pg_cron` extension if it's not already active and then schedules the necessary jobs for sending email notifications. This script is idempotent and safe to run multiple times.

  ## Query Description:
  - Enables the `pg_cron` extension, which is required for all scheduled tasks.
  - Unschedules any potentially conflicting old jobs to ensure a clean setup.
  - Schedules a job to check for task reminders every 5 minutes.
  - Schedules a job to check for broken streaks once daily.
  - This operation is critical for the notification system to work but has no impact on existing user data.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (jobs can be unscheduled, extension can be disabled)
*/

-- Step 1: Enable the pg_cron extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Step 2: Grant usage permissions to the postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Step 3: Grant permissions for pg_net to the postgres role
-- This allows cron jobs to make HTTP requests to our Edge Functions
GRANT USAGE ON SCHEMA net TO postgres;


-- Step 4: Safely unschedule any existing jobs to prevent conflicts
-- The `if_exists` parameter is not available on all pg_cron versions, so we query the job table.
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'send-task-reminders';
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'check-streaks';


-- Step 5: Schedule the 'send-task-reminders' job to run every 5 minutes
-- This job calls the send-task-reminders Edge Function.
SELECT cron.schedule(
  'send-task-reminders',
  '*/5 * * * *', -- every 5 minutes
  $$
    SELECT net.http_post(
      url:='https://viffevnyaocrnkpgxpgj.supabase.co/functions/v1/send-task-reminders',
      headers:='{"Content-Type": "application/json"}'::jsonb
    )
  $$
);

-- Step 6: Schedule the 'check-streaks' job to run daily at midnight UTC
-- This job calls the check-streaks Edge Function.
SELECT cron.schedule(
  'check-streaks',
  '0 0 * * *', -- daily at midnight UTC
  $$
    SELECT net.http_post(
      url:='https://viffevnyaocrnkpgxpgj.supabase.co/functions/v1/check-streaks',
      headers:='{"Content-Type": "application/json"}'::jsonb
    )
  $$
);
