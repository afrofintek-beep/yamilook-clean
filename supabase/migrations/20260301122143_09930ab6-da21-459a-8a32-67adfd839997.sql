-- Revert public_profiles to security_invoker mode to avoid SECURITY DEFINER view risk
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
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

-- Secure helper function to fetch public-safe profile fields by ids (bypasses restrictive RLS safely)
CREATE OR REPLACE FUNCTION public.get_public_profiles_by_ids(p_ids uuid[])
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  level text,
  is_online boolean,
  last_seen timestamp with time zone,
  status_message text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  FROM public.profiles p
  WHERE p.id = ANY (p_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profiles_by_ids(uuid[]) TO authenticated;