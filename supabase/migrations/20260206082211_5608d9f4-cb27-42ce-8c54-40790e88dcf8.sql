
-- Create palco_likes table
CREATE TABLE public.palco_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  palco_id UUID NOT NULL REFERENCES public.palcos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(palco_id, user_id)
);

-- Enable RLS
ALTER TABLE public.palco_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all palco likes" ON public.palco_likes FOR SELECT USING (true);
CREATE POLICY "Users can like palcos" ON public.palco_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike palcos" ON public.palco_likes FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_palco_likes_palco_id ON public.palco_likes(palco_id);
CREATE INDEX idx_palco_likes_user_id ON public.palco_likes(user_id);
