CREATE OR REPLACE FUNCTION public.set_post_banda()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.banda_id IS NULL THEN
    NEW.banda_id := public.active_banda_id(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_post_banda ON public.posts;
CREATE TRIGGER trg_set_post_banda
BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_post_banda();