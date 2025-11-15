/*
          # [Operation Name]
          Add Email Notification System

          [This migration adds the necessary database infrastructure for a scheduled email notification system. It adds a preference column to user profiles and sets up two cron jobs to trigger server-less functions for sending task and streak-related emails.]

          ## Query Description: [This operation will add a new column to the `profiles` table and enable the `pg_cron` extension to schedule automated tasks. It is a non-destructive operation, but it introduces new, automated background processes to your project. It relies on Supabase Edge Functions being deployed separately.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables Modified: `public.profiles` (adds `email_notifications_enabled` column)
          - Extensions Enabled: `pg_cron`
          - Cron Jobs Created: `check-streaks`, `send-task-reminders`
          
          ## Security Implications:
          - RLS Status: [No change]
          - Policy Changes: [No]
          - Auth Requirements: [The cron jobs use a secret (`service_role_key`) which must be configured in the Supabase Vault for secure function invocation.]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Low. The cron jobs run in the background. The `send-task-reminders` job runs every 5 minutes, so it is designed to be lightweight.]
          */

-- 1. Add notification preference column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- 2. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 3. Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- 4. Remove old jobs if they exist, to make this script idempotent
SELECT cron.unschedule('check-streaks');
SELECT cron.unschedule('send-task-reminders');

-- 5. Schedule a cron job to run the streak checker function every day at 1 AM UTC
-- This requires a 'service_role_key' to be saved in the Supabase Vault.
SELECT cron.schedule(
  'check-streaks',
  '0 1 * * *',
  $$
    SELECT net.http_post(
      url:='https://viffevnyaocrnkpgxpgj.supabase.co/functions/v1/check-streaks',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || secrets.get('service_role_key') || '"}'::jsonb
    )
  $$
);

-- 6. Schedule a cron job to run the task reminder function every 5 minutes.
-- This also requires the 'service_role_key' secret.
SELECT cron.schedule(
  'send-task-reminders',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url:='https://viffevnyaocrnkpgxpgj.supabase.co/functions/v1/send-task-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || secrets.get('service_role_key') || '"}'::jsonb
    )
  $$
);
