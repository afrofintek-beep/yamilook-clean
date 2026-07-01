
-- Table to track archived posts per user
CREATE TABLE public.post_archives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.post_archives ENABLE ROW LEVEL SECURITY;

-- Users can only see their own archived posts
CREATE POLICY "Users can view own archives"
  ON public.post_archives FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can archive posts
CREATE POLICY "Users can archive posts"
  ON public.post_archives FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can unarchive their own posts
CREATE POLICY "Users can unarchive posts"
  ON public.post_archives FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
