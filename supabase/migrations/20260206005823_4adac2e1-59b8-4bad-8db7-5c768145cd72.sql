DROP POLICY IF EXISTS posts_select ON public.posts;

CREATE POLICY posts_select
ON public.posts
FOR SELECT
TO authenticated
USING (
  public.can_view_post(auth.uid(), user_id, privacy)
);