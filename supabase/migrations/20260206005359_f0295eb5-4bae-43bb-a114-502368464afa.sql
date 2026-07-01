CREATE OR REPLACE FUNCTION public.is_kamba(p_viewer uuid, p_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.contacts c
    WHERE c.user_id = p_owner
      AND c.contact_user_id = p_viewer
      AND coalesce(c.is_blocked, false) = false
  )
$$;