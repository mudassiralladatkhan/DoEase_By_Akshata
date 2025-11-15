/*
# [SECURITY] Secure Database Functions
This migration enhances security by setting a fixed `search_path` for database functions, mitigating the risk of search path hijacking attacks. This addresses the "Function Search Path Mutable" warning from the security advisory.

## Query Description:
This operation alters an existing database function to make it more secure. It does not modify any user data and is a safe, recommended practice. There is no risk of data loss.

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies the `get_tasks_to_notify()` function.

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: Search path hijacking vulnerabilities.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

-- Secure the function responsible for identifying tasks that need notifications.
-- This prevents potential search path hijacking by explicitly setting the search path.
ALTER FUNCTION public.get_tasks_to_notify() SET search_path = '';
