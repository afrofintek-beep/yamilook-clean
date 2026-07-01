-- Tighten ritmos_views insert policy (avoid WITH CHECK (true))

DROP POLICY IF EXISTS "Anyone can log views" ON public.ritmos_views;

CREATE POLICY "Anyone can log views"
ON public.ritmos_views
FOR INSERT
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);
