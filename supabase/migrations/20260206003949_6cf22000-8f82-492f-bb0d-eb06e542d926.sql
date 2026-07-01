CREATE OR REPLACE FUNCTION public.active_banda_id(p_user uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT ub.banda_id
  FROM public.user_bandas ub
  WHERE ub.user_id = p_user AND ub.is_active = true
  LIMIT 1
$$;