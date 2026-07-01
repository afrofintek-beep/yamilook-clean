
-- Drop restrictive SELECT policy
DROP POLICY IF EXISTS "Users can read banda sessions" ON public.academia_sessions;

-- Allow all authenticated users to read all sessions
CREATE POLICY "Authenticated users can read all sessions"
  ON public.academia_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Also allow anon to read (public listing)
CREATE POLICY "Anyone can read sessions"
  ON public.academia_sessions FOR SELECT
  TO anon
  USING (true);
