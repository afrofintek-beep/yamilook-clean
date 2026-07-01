-- Allow admins and moderators to update live sessions (e.g., end them)
CREATE POLICY "Admins can update any live session"
  ON public.live_sessions FOR UPDATE
  TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));

-- Allow admins and moderators to delete any live session
CREATE POLICY "Admins can delete any live session"
  ON public.live_sessions FOR DELETE
  TO authenticated
  USING (public.is_moderator_or_admin(auth.uid()));
