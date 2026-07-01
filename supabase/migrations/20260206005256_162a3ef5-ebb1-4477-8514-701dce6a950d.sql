CREATE TABLE IF NOT EXISTS public.followers (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

CREATE INDEX IF NOT EXISTS followers_followed_idx ON public.followers (followed_id);
CREATE INDEX IF NOT EXISTS followers_follower_idx ON public.followers (follower_id);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS followers_select ON public.followers;
CREATE POLICY followers_select
ON public.followers
FOR SELECT
TO authenticated
USING (follower_id = auth.uid() OR followed_id = auth.uid());

DROP POLICY IF EXISTS followers_insert ON public.followers;
CREATE POLICY followers_insert
ON public.followers
FOR INSERT
TO authenticated
WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS followers_delete ON public.followers;
CREATE POLICY followers_delete
ON public.followers
FOR DELETE
TO authenticated
USING (follower_id = auth.uid());