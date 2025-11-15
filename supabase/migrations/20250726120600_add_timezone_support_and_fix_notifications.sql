/*
          # [Operation Name]
          Add Timezone Support and Fix Notification Logic

          ## Query Description: This migration makes the application timezone-aware to fix email notifications. It adds a 'timezone' column to user profiles, updates the new user trigger to capture it, and creates a robust database function to find tasks needing reminders based on each user's local time. This resolves the core bug where notifications were not being sent at the correct time.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Adds column `timezone` to `public.profiles`.
          - Re-creates function `public.handle_new_user()` to include timezone.
          - Creates function `public.get_tasks_to_notify()` for reliable notification querying.

          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: No
          - Auth Requirements: None

          ## Performance Impact:
          - Indexes: None
          - Triggers: Modified
          - Estimated Impact: Low. The new function is efficient and improves the performance of the notification Edge Function.
          */

-- 1. Add timezone column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- 2. Update the function to handle new user creation with timezone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, mobile, email, timezone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'mobile',
    new.email,
    new.raw_user_meta_data->>'timezone'
  );
  RETURN new;
END;
$$;

-- 3. Create a robust function to get tasks that need notification
CREATE OR REPLACE FUNCTION get_tasks_to_notify()
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  email TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    p.username,
    p.email
  FROM
    public.tasks AS t
  JOIN
    public.profiles AS p ON t.user_id = p.id
  WHERE
    p.email_notifications_enabled = true
    AND t.completed = false
    AND t.start_time IS NOT NULL
    AND t.due_time IS NOT NULL
    AND p.timezone IS NOT NULL
    -- This is the key logic: convert the task's local time to a UTC timestamp
    -- and check if it falls within the next 5 minutes from the current time (now()).
    AND (t.due_time + t.start_time) AT TIME ZONE p.timezone >= now()
    AND (t.due_time + t.start_time) AT TIME ZONE p.timezone < now() + interval '5 minutes';
END;
$$;
