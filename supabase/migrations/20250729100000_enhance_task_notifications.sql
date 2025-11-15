/*
# [Operation Name]
Enhance Task Notification Logic

## Query Description: [This operation replaces the existing `get_tasks_to_notify` function with an enhanced version. The new function identifies tasks that are either starting or ending within a specified time window (e.g., the next 5 minutes) and returns them along with the type of notification ('start' or 'end'). This allows the system to send more specific email reminders. This change does not affect existing data but modifies the business logic for notifications. No backup is required, and the change is reversible by reapplying the previous function definition.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Functions Affected: `public.get_tasks_to_notify`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [The function uses the service_role key to bypass RLS, but it correctly joins with the profiles table to fetch user-specific data.]

## Performance Impact:
- Indexes: [No changes]
- Triggers: [No changes]
- Estimated Impact: [Low. The query is efficient and runs on a small subset of tasks scheduled for the current day.]
*/

-- Drop the old function if it exists to ensure a clean replacement
DROP FUNCTION IF EXISTS public.get_tasks_to_notify();

-- Create the new, enhanced function
CREATE OR REPLACE FUNCTION public.get_tasks_to_notify()
RETURNS TABLE (
    id bigint,
    name text,
    user_id uuid,
    username text,
    email text,
    notification_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_window interval := '5 minutes'; -- How far in the future to look for tasks
BEGIN
    -- This function is designed to be called by a cron job every few minutes.
    -- It finds tasks that are either starting or ending within the `notification_window`.
    RETURN QUERY
    WITH tasks_in_window AS (
        -- Select tasks that have a due date of today (in the user's timezone)
        SELECT
            t.id,
            t.name,
            t.user_id,
            t.start_time,
            t.end_time,
            p.timezone,
            p.username,
            p.email
        FROM
            public.tasks t
        JOIN
            public.profiles p ON t.user_id = p.id
        WHERE
            p.email_notifications_enabled = TRUE -- Only for users who want emails
            AND t.completed = FALSE -- Only for incomplete tasks
            AND p.timezone IS NOT NULL -- Ensure timezone is available
            AND t.due_time = (now() AT TIME ZONE p.timezone)::date -- Task is due today in user's timezone
            AND (t.start_time IS NOT NULL OR t.end_time IS NOT NULL) -- Task must have a start or end time
    )
    -- Union of starting and ending tasks
    SELECT
        tiw.id,
        tiw.name,
        tiw.user_id,
        tiw.username,
        tiw.email,
        'start' AS notification_type
    FROM
        tasks_in_window tiw
    WHERE
        tiw.start_time IS NOT NULL
        AND (tiw.due_time + tiw.start_time) AT TIME ZONE tiw.timezone -- Construct full timestamp
            BETWEEN now() AND now() + notification_window

    UNION ALL

    SELECT
        tiw.id,
        tiw.name,
        tiw.user_id,
        tiw.username,
        tiw.email,
        'end' AS notification_type
    FROM
        tasks_in_window tiw
    WHERE
        tiw.end_time IS NOT NULL
        AND (tiw.due_time + tiw.end_time) AT TIME ZONE tiw.timezone -- Construct full timestamp
            BETWEEN now() AND now() + notification_window;
END;
$$;
