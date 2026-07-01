CREATE OR REPLACE FUNCTION public.can_view_post(p_viewer uuid, p_owner uuid, p_visibility text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p_visibility IN ('public', 'everyone') THEN true
    WHEN p_visibility IN ('friends', 'contacts') THEN (p_viewer = p_owner) OR public.is_kamba(p_viewer, p_owner)
    WHEN p_visibility = 'close_friends' THEN (p_viewer = p_owner) OR public.is_brada(p_viewer, p_owner)
    WHEN p_visibility IN ('private', 'only_me') THEN (p_viewer = p_owner)
    ELSE false
  END
$$;