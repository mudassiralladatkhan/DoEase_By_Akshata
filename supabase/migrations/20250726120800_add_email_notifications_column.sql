/*
# [Schema Update] Add Email Notification Preference Column

This migration adds the `email_notifications_enabled` column to the `profiles` table. This is a critical fix for an error where the application tries to access this column, but it does not exist in the database.

## Query Description:
This operation safely adds a new column to the `profiles` table. It includes a `DEFAULT TRUE` clause, so all existing users will have email notifications enabled by default. There is no risk of data loss.

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- **Table:** `public.profiles`
- **Column Added:** `email_notifications_enabled` (BOOLEAN, NOT NULL, DEFAULT TRUE)

## Security Implications:
- RLS Status: [Unaffected]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible. Adding a column with a default value is a fast metadata change in recent PostgreSQL versions.]
*/

-- Add the email_notifications_enabled column to the profiles table if it doesn't exist.
-- This column is used to store the user's preference for receiving email notifications.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL;
