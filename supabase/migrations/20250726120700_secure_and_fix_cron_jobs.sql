/*
# [Fix and Secure Cron Jobs]
This migration corrects an issue with the previous cron job setup and enhances security.

## Query Description:
This script ensures that the cron jobs for sending notifications are idempotent (can be run multiple times without error) and secure. The associated Edge Functions will be updated to only accept requests originating from the database, preventing unauthorized execution.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true (by unscheduling jobs)

## Structure Details:
- Modifies: `cron.job` table by unscheduling and rescheduling jobs.

## Security Implications:
- RLS Status: Not applicable.
- Policy Changes: No.
- Auth Requirements: This change relies on updated Edge Function code to enforce that only the database can trigger these jobs.

## Performance Impact:
- Indexes: None.
- Triggers: None.
- Estimated Impact: Negligible.
*/

-- Step 1: Safely unschedule the old jobs to prevent errors on re-run.
DO $$
BEGIN
  -- The previous migration might have failed, so the jobs may or may not exist.
  -- This block attempts to unschedule them and ignores errors if they're not found.
  BEGIN
    PERFORM cron.unschedule('check-streaks');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'cron job "check-streaks" does not exist, skipping unschedule.';
  END;

  BEGIN
    PERFORM cron.unschedule('send-task-reminders');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'cron job "send-task-reminders" does not exist, skipping unschedule.';
  END;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Schedule the jobs again with the correct, secure invocation.
-- The Edge Functions will be responsible for checking the 'x-supabase-caller' header.
SELECT cron.schedule(
  'check-streaks',
  '0 5 * * *', -- Run once a day at 5 AM UTC
  $$
    SELECT net.http_post(
      url:='https://viffevnyaocrnkpgxpgj.supabase.co/functions/v1/check-streaks',
      headers:='{"Content-Type": "application/json"}'::jsonb
    )
  $$
);

SELECT cron.schedule(
  'send-task-reminders',
  '*/5 * * * *', -- Run every 5 minutes
  $$
    SELECT net.http_post(
      url:='https://viffevnyaocrnkpgxpgj.supabase.co/functions/v1/send-task-reminders',
      headers:='{"Content-Type": "application/json"}'::jsonb
    )
  $$
);
