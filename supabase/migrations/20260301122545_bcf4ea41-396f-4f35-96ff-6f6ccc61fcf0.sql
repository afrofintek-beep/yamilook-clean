-- Switch public_profiles to security_invoker=off so it bypasses the restrictive
-- profiles RLS. This is safe because the view only exposes non-sensitive columns.
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
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

GRANT SELECT ON public.public_profiles TO anon, authenticated;