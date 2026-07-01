-- Drop the security definer view that caused the linter warning
-- Instead, we'll rely on RLS policies directly on the profiles table
DROP VIEW IF EXISTS public.public_profiles;

-- The RLS policies already restrict access appropriately:
-- - "Users can view own full profile" for own data
-- - "Users can view other profiles basic info" for viewing others
-- The application code should handle not displaying sensitive fields for non-owners