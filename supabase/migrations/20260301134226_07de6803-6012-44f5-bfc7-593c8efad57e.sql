
-- Table for session reservations
CREATE TABLE public.academia_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.academia_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.academia_reservations ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see reservations
CREATE POLICY "Users can view reservations" ON public.academia_reservations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can insert their own reservation
CREATE POLICY "Users can reserve" ON public.academia_reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own reservation
CREATE POLICY "Users can cancel own reservation" ON public.academia_reservations
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to decrement spots_left on insert
CREATE OR REPLACE FUNCTION public.update_academia_spots_on_reserve()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.academia_sessions
    SET spots_left = GREATEST(0, spots_left - 1)
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.academia_sessions
    SET spots_left = spots_left + 1
    WHERE id = OLD.session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_academia_spots
  AFTER INSERT OR DELETE ON public.academia_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_academia_spots_on_reserve();
