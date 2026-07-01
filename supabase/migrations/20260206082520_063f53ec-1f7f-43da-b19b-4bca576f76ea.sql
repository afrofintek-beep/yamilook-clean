
-- Add reaction_type column to palco_likes
ALTER TABLE public.palco_likes ADD COLUMN reaction_type TEXT NOT NULL DEFAULT 'sankofa';
