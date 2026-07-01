DROP POLICY IF EXISTS posts_insert ON public.posts;

CREATE POLICY posts_insert
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);