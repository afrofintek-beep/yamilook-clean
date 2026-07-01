CREATE OR REPLACE FUNCTION public.is_brada(p_viewer uuid, p_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.close_friends cf
    WHERE cf.user_id = p_owner
      AND cf.friend_id = p_viewer
  )
$$;