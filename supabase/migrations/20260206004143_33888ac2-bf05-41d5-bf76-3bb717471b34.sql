ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS banda_id uuid;

ALTER TABLE public.palcos
  ADD COLUMN IF NOT EXISTS banda_id uuid;