CREATE OR REPLACE FUNCTION public.set_palco_banda()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.banda_id IS NULL THEN
    NEW.banda_id := public.active_banda_id(NEW.guide_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_palco_banda ON public.palcos;
CREATE TRIGGER trg_set_palco_banda
BEFORE INSERT ON public.palcos
FOR EACH ROW EXECUTE FUNCTION public.set_palco_banda();