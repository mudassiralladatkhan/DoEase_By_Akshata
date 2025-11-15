/*
          # [Operation Name] Add Medium Priority and Secure Functions
          This migration adds a 'medium' priority level for tasks and enhances database security by setting a fixed search_path for existing functions, resolving a common security warning.

          ## Query Description: [This operation modifies the 'priority_level' type to include 'medium' and updates two functions ('handle_new_user', 'get_tasks_to_notify') to make them more secure. This change is non-destructive and fully backward compatible.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Types Modified: public.priority_level
          - Functions Modified: public.handle_new_user, public.get_tasks_to_notify
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None]
          */

-- Add 'medium' to the priority_level enum.
-- The check ensures this command doesn't fail if it has been run before.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'medium' AND enumtypid = 'public.priority_level'::regtype) THEN
    ALTER TYPE public.priority_level ADD VALUE 'medium' AFTER 'low';
  END IF;
END$$;

-- Secure the handle_new_user function by setting a search_path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, mobile, timezone)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.email, new.raw_user_meta_data->>'mobile', new.raw_user_meta_data->>'timezone');
  RETURN new;
END;
$$;

-- Secure the get_tasks_to_notify function by setting a search_path.
CREATE OR REPLACE FUNCTION public.get_tasks_to_notify()
RETURNS TABLE(id uuid, name text, email text, username text)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    p.email,
    p.username
  FROM
    tasks t
  JOIN
    profiles p ON t.user_id = p.id
  WHERE
    p.email_notifications_enabled = TRUE AND
    t.completed = FALSE AND
    t.start_time IS NOT NULL AND
    t.due_time IS NOT NULL AND
    -- Convert task's start time to the user's local timezone and check if it's in the past 5 minutes
    (t.due_time || ' ' || t.start_time)::timestamp AT TIME ZONE p.timezone <= NOW() AND
    (t.due_time || ' ' || t.start_time)::timestamp AT TIME ZONE p.timezone > NOW() - INTERVAL '5 minutes';
END;
$$;
