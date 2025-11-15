/*
# [Schema Security Update & Enhancement]
This migration enhances security by fixing a function search path vulnerability and adds the 'mobile' field to user profiles as per the application specification.

## Query Description: 
This script performs two main actions:
1.  It adds a 'mobile' column to the 'profiles' table to store user mobile numbers. This is a non-destructive addition.
2.  It replaces the existing 'handle_new_user' function with a more secure version that explicitly sets the 'search_path'. This mitigates a security risk and ensures the function behaves predictably. It also updates the function to handle the new 'mobile' field.

There is no risk of data loss with this script.

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table 'profiles': Adds column 'mobile' (TEXT).
- Function 'handle_new_user': Recreated to set 'search_path' and handle the 'mobile' field.

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None for this script.
- Fixes: Addresses the "[WARN] Function Search Path Mutable" security advisory.

## Performance Impact:
- Indexes: None
- Triggers: The trigger using 'handle_new_user' is temporarily disconnected and reconnected.
- Estimated Impact: Negligible performance impact.
*/

-- Add mobile column to profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mobile TEXT;

-- Recreate the function to be more secure and handle the new mobile field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, mobile)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'mobile'
  );
  RETURN new;
END;
$$;

-- The trigger remains the same but will now use the updated function.
-- No need to drop/recreate the trigger as it points to the function by name.
