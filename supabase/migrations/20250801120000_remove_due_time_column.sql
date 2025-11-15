/*
# [Schema Cleanup]
This operation removes the redundant `due_time` column from the `tasks` table.

## Query Description: 
This operation will permanently delete the `due_time` column and all its data from the `tasks` table. The `due_date` column should be used instead. This change helps to clean up the database schema and avoid confusion.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- Table affected: `tasks`
- Column removed: `due_time`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The operation might lock the table briefly.
*/

ALTER TABLE public.tasks
DROP COLUMN IF EXISTS due_time;
