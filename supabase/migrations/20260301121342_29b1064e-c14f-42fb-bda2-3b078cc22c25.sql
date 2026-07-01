CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT
  id,
  display_name,
  username,
  avatar_url,
  bio,
  level,
  is_online,
  last_seen,
  status_message
FROM public.profiles;