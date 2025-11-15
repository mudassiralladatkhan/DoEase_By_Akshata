/*
# [ADD_DUE_TIME_COLUMN]
This migration adds the `due_time` column to the `tasks` table to store the due date for each task. This is essential for scheduling and filtering tasks by date and resolves the error when creating a new task.

## Query Description: [This operation adds a new `due_time` column to the `tasks` table. Existing tasks will have a `NULL` value for this new column, which is safe. No data will be lost.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table: `public.tasks`
- Column Added: `due_time` (type: `date`)

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Existing RLS policies on the `tasks` table will automatically apply to this new column.]

## Performance Impact:
- Indexes: [None added. An index on `due_time` might be beneficial in the future if queries filtering by this column become slow.]
- Triggers: [None]
- Estimated Impact: [Low. The operation will be fast on tables of small to medium size.]
*/

-- Add the due_time column to the tasks table to store the date for a task.
ALTER TABLE public.tasks
ADD COLUMN due_time date;
