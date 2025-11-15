/*
# [Migration] Enable pg_net and Finalize Cron Jobs

This script resolves the "schema 'net' does not exist" error by ensuring the `pg_net` extension is enabled before scheduling jobs. It also includes permissions and robustly re-creates the cron jobs for email notifications.

## Query Description:
This operation is safe to run. It enables necessary database extensions (`pg_cron`, `pg_net`) and sets up scheduled tasks. It will first attempt to remove any old, conflicting jobs before creating the new ones. No data will be lost.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by unscheduling the jobs and disabling the extensions)

## Structure Details:
- Enables `pg_cron` extension.
- Enables `pg_net` extension.
- Grants necessary permissions to the `postgres` role.
- Schedules two cron jobs: `send-task-reminders` and `check-streaks`.

## Security Implications:
- RLS Status: Not Applicable
- Policy Changes: No
- Auth Requirements: This script should be run by a user with permissions to manage extensions and cron jobs (e.g., `postgres`).

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. Adds two lightweight scheduled tasks.
*/

BEGIN;

-- 1. Enable required extensions if they are not already enabled.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Grant necessary permissions to the 'postgres' role, which pg_cron runs as.
-- This allows pg_cron to use pg_net to make HTTP requests.
GRANT USAGE ON SCHEMA net TO postgres;

-- 3. Unschedule any potentially conflicting jobs from previous attempts.
-- This makes the script idempotent and safe to re-run.
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('send-task-reminders', 'check-streaks');

-- 4. Schedule the 'send-task-reminders' job to run every 5 minutes.
-- This function will check for tasks starting soon and send email reminders.
SELECT cron.schedule(
  'send-task-reminders',
  '*/5 * * * *', -- Cron syntax for "every 5 minutes"
  $$
    SELECT net.http_post(
      url:='https://viffevnyaocrnkpgxpgj.supabase.co/functions/v1/send-task-reminders',
      headers:='{"Content-Type": "application/json"}'::jsonb
    )
  $$
);

-- 5. Schedule the 'check-streaks' job to run once a day at midnight UTC.
-- This function checks for broken streaks and notifies users.
SELECT cron.schedule(
  'check-streaks',
  '0 0 * * *', -- Cron syntax for "at midnight (00:00) every day"
  $$
    SELECT net.http_post(
      url:='https://viffevnyaocrnkpgxpgj.supabase.co/functions/v1/check-streaks',
      headers:='{"Content-Type": "application/json"}'::jsonb
    )
  $$
);

COMMIT;
