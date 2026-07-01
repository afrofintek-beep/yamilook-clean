
-- Academia sessions table
CREATE TABLE public.academia_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL DEFAULT 'grupo',
  spots INTEGER NOT NULL DEFAULT 20,
  spots_left INTEGER NOT NULL DEFAULT 20,
  price_coins INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  banda_id UUID REFERENCES public.bandas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-set banda_id
CREATE OR REPLACE FUNCTION public.set_academia_session_banda()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.banda_id IS NULL THEN
    NEW.banda_id := public.active_banda_id(NEW.mentor_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_academia_session_banda
  BEFORE INSERT ON public.academia_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_academia_session_banda();

-- Updated_at trigger
CREATE TRIGGER trg_academia_sessions_updated_at
  BEFORE UPDATE ON public.academia_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.academia_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read sessions in their banda
CREATE POLICY "Users can read banda sessions"
  ON public.academia_sessions FOR SELECT
  TO authenticated
  USING (
    banda_id IS NULL
    OR banda_id = public.active_banda_id(auth.uid())
  );

-- Mentors can insert their own sessions
CREATE POLICY "Users can create own sessions"
  ON public.academia_sessions FOR INSERT
  TO authenticated
  WITH CHECK (mentor_id = auth.uid());

-- Mentors can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON public.academia_sessions FOR UPDATE
  TO authenticated
  USING (mentor_id = auth.uid());
