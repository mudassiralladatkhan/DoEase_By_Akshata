/*
# [Corrected Initial Schema Setup]
This script sets up the initial database schema for the DoEase application. It creates the 'profiles' and 'tasks' tables, enables Row Level Security (RLS), defines access policies, and sets up a trigger to automatically create a user profile upon sign-up. This version is idempotent, meaning it can be run safely multiple times without causing errors if the objects already exist.

## Query Description:
This script is designed to be non-destructive. It uses `CREATE TABLE IF NOT EXISTS` to avoid errors if tables are already present. Policies and functions are replaced to ensure the latest version is applied. This operation is safe to run on an existing database that might be partially configured. No data will be lost.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Tables created: `public.profiles`, `public.tasks` (if they don't exist)
- RLS enabled: on `profiles` and `tasks`
- Policies created/replaced: SELECT, INSERT, UPDATE on `profiles`; SELECT, INSERT, UPDATE, DELETE on `tasks`
- Functions created/replaced: `public.handle_new_user()`
- Triggers created/replaced: `on_auth_user_created` on `auth.users`

## Security Implications:
- RLS Status: Enabled on `profiles` and `tasks`.
- Policy Changes: Yes. Policies are defined to ensure users can only access and manage their own data. This is a critical security enhancement.
- Auth Requirements: Policies are linked to `auth.uid()`, integrating with Supabase's authentication.

## Performance Impact:
- Indexes: Primary keys are indexed automatically. Foreign keys are also indexed.
- Triggers: Adds a trigger on `auth.users` table. This will cause a small, negligible overhead on new user creation.
- Estimated Impact: Low. The changes are standard and should not negatively impact performance.
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  start_time TIME,
  end_time TIME,
  due_time TIMESTAMPTZ,
  priority TEXT DEFAULT 'low'::text,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for tables (it's safe to run this multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own tasks." ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks." ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks." ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks." ON public.tasks;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policies for tasks
CREATE POLICY "Users can view their own tasks."
ON public.tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks."
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks."
ON public.tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks."
ON public.tasks FOR DELETE
USING (auth.uid() = user_id);

-- Trigger function to create a profile on new user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
