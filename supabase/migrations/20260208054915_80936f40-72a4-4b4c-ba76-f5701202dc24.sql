
-- Allow admins to insert topics (for approving suggestions)
CREATE POLICY "Admins can insert topics"
  ON public.discover_topics FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update topics
CREATE POLICY "Admins can update topics"
  ON public.discover_topics FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete topics
CREATE POLICY "Admins can delete topics"
  ON public.discover_topics FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
