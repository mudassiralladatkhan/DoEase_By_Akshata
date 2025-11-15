/*
# [Feature] Add Streak Tracking
This migration adds columns to the `profiles` table to track user productivity streaks.

## Query Description:
- Adds `current_streak` to store the number of consecutive days a user completes a task.
- Adds `last_streak_updated` to record the date of the last streak update.
- This is a non-destructive operation and is safe to run.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (columns can be dropped)

## Structure Details:
- Table: `public.profiles`
- Columns Added: `current_streak` (INTEGER), `last_streak_updated` (DATE)

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None added
- Triggers: None added
- Estimated Impact: Negligible.
*/

-- Add streak tracking columns to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_updated DATE;

-- Comment on the new columns for clarity
COMMENT ON COLUMN public.profiles.current_streak IS 'Tracks the user''s current consecutive day streak for completing tasks.';
COMMENT ON COLUMN public.profiles.last_streak_updated IS 'The last date the user''s streak was updated.';
