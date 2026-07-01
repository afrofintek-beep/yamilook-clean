-- Create a function to update the total_rodas counter on palcos
CREATE OR REPLACE FUNCTION public.update_palco_roda_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.palcos
    SET total_rodas = (
      SELECT COUNT(*) FROM public.rodas WHERE palco_id = NEW.palco_id
    ),
    updated_at = now()
    WHERE id = NEW.palco_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.palcos
    SET total_rodas = (
      SELECT COUNT(*) FROM public.rodas WHERE palco_id = OLD.palco_id
    ),
    updated_at = now()
    WHERE id = OLD.palco_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-update total_rodas when a roda is created or deleted
DROP TRIGGER IF EXISTS update_palco_roda_count_trigger ON public.rodas;
CREATE TRIGGER update_palco_roda_count_trigger
AFTER INSERT OR DELETE ON public.rodas
FOR EACH ROW
EXECUTE FUNCTION public.update_palco_roda_count();

-- Fix existing palcos with incorrect total_rodas count
UPDATE public.palcos p
SET total_rodas = (
  SELECT COUNT(*) FROM public.rodas r WHERE r.palco_id = p.id
);