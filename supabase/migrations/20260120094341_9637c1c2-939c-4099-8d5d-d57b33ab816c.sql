-- ============================================
-- RITMOS: Short-Form Video Module
-- ============================================

-- Create reaction type enum for Ritmos
CREATE TYPE public.ritmo_reaction_type AS ENUM ('sankofa', 'ubuntu', 'djembe', 'shango', 'eish');

-- Main Ritmos table (market stored as text for local-first without FK dependency)
CREATE TABLE public.ritmos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  caption TEXT CHECK (char_length(caption) <= 100),
  market TEXT,
  city TEXT,
  neighborhood TEXT,
  is_promoted BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ritmos reactions (one per user per ritmo)
CREATE TABLE public.ritmos_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ritmo_id UUID NOT NULL REFERENCES public.ritmos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type ritmo_reaction_type NOT NULL DEFAULT 'djembe',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ritmo_id, user_id)
);

-- Ritmos comments
CREATE TABLE public.ritmos_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ritmo_id UUID NOT NULL REFERENCES public.ritmos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.ritmos_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ritmos comment reactions
CREATE TABLE public.ritmos_comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.ritmos_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type ritmo_reaction_type NOT NULL DEFAULT 'sankofa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Ritmos views tracking
CREATE TABLE public.ritmos_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ritmo_id UUID NOT NULL REFERENCES public.ritmos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ritmos_user_id ON public.ritmos(user_id);
CREATE INDEX idx_ritmos_market ON public.ritmos(market);
CREATE INDEX idx_ritmos_city ON public.ritmos(city);
CREATE INDEX idx_ritmos_created_at ON public.ritmos(created_at DESC);
CREATE INDEX idx_ritmos_reactions_ritmo_id ON public.ritmos_reactions(ritmo_id);
CREATE INDEX idx_ritmos_reactions_user_id ON public.ritmos_reactions(user_id);
CREATE INDEX idx_ritmos_comments_ritmo_id ON public.ritmos_comments(ritmo_id);
CREATE INDEX idx_ritmos_views_ritmo_id ON public.ritmos_views(ritmo_id);

-- Enable RLS
ALTER TABLE public.ritmos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritmos_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritmos_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritmos_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritmos_views ENABLE ROW LEVEL SECURITY;

-- Ritmos policies
CREATE POLICY "Anyone can view ritmos" ON public.ritmos FOR SELECT USING (true);
CREATE POLICY "Users can create ritmos" ON public.ritmos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ritmos" ON public.ritmos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ritmos" ON public.ritmos FOR DELETE USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Anyone can view reactions" ON public.ritmos_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.ritmos_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reactions" ON public.ritmos_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.ritmos_reactions FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.ritmos_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON public.ritmos_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.ritmos_comments FOR DELETE USING (auth.uid() = user_id);

-- Comment reactions policies
CREATE POLICY "Anyone can view comment reactions" ON public.ritmos_comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add comment reactions" ON public.ritmos_comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comment reactions" ON public.ritmos_comment_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment reactions" ON public.ritmos_comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- Views policies (allow tracking)
CREATE POLICY "Anyone can view view counts" ON public.ritmos_views FOR SELECT USING (true);
CREATE POLICY "Anyone can log views" ON public.ritmos_views FOR INSERT WITH CHECK (true);

-- Function to update view count
CREATE OR REPLACE FUNCTION public.increment_ritmo_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ritmos SET view_count = view_count + 1 WHERE id = NEW.ritmo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for view count
CREATE TRIGGER on_ritmo_view
  AFTER INSERT ON public.ritmos_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_ritmo_view_count();

-- Function to get reaction counts for a ritmo
CREATE OR REPLACE FUNCTION public.get_ritmo_reaction_counts(p_ritmo_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'sankofa', COALESCE(SUM(CASE WHEN reaction_type = 'sankofa' THEN 1 ELSE 0 END), 0),
    'ubuntu', COALESCE(SUM(CASE WHEN reaction_type = 'ubuntu' THEN 1 ELSE 0 END), 0),
    'djembe', COALESCE(SUM(CASE WHEN reaction_type = 'djembe' THEN 1 ELSE 0 END), 0),
    'shango', COALESCE(SUM(CASE WHEN reaction_type = 'shango' THEN 1 ELSE 0 END), 0),
    'eish', COALESCE(SUM(CASE WHEN reaction_type = 'eish' THEN 1 ELSE 0 END), 0)
  ) INTO result
  FROM public.ritmos_reactions
  WHERE ritmo_id = p_ritmo_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Enable realtime for ritmos
ALTER PUBLICATION supabase_realtime ADD TABLE public.ritmos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ritmos_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ritmos_comments;

-- Updated at trigger
CREATE TRIGGER update_ritmos_updated_at
  BEFORE UPDATE ON public.ritmos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();