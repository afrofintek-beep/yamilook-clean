CREATE INDEX IF NOT EXISTS posts_privacy_idx ON public.posts (privacy);
CREATE INDEX IF NOT EXISTS posts_user_privacy_idx ON public.posts (user_id, privacy);
CREATE INDEX IF NOT EXISTS posts_created_idx ON public.posts (created_at DESC);