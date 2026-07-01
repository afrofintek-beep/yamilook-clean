-- Fix public profile visibility for feed/chat/contacts while keeping sensitive profile data protected
-- Recreate the public_profiles view to run with definer privileges (bypasses restrictive RLS on profiles)
-- and only expose safe, non-sensitive columns.

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT
  p.id,
  p.display_name,
  p.username,
  p.avatar_url,
  p.bio,
  p.level,
  p.is_online,
  p.last_seen,
  p.status_message
FROM public.profiles p;

-- Ensure app roles can read the safe public view
GRANT SELECT ON public.public_profiles TO anon, authenticated;