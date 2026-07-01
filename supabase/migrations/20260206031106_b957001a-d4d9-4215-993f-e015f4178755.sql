-- Allow authenticated users to read anyone's active banda (public info for profiles)
CREATE POLICY "Anyone can view active banda memberships"
  ON public.user_bandas
  FOR SELECT
  USING (is_active = true);