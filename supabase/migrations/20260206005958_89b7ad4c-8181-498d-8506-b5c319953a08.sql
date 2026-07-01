DROP POLICY IF EXISTS posts_update ON public.posts;
CREATE POLICY posts_update
ON public.posts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS posts_delete ON public.posts;
CREATE POLICY posts_delete
ON public.posts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());