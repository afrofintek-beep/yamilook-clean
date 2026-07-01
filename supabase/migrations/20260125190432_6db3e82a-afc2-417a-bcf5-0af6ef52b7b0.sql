-- Create profile_highlights table
CREATE TABLE public.profile_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  display_order INTEGER DEFAULT 0
);

-- Create profile_highlight_items table for items within a highlight
CREATE TABLE public.profile_highlight_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id UUID NOT NULL REFERENCES public.profile_highlights(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  display_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.profile_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_highlight_items ENABLE ROW LEVEL SECURITY;

-- Policies for profile_highlights
CREATE POLICY "Users can view all highlights"
  ON public.profile_highlights FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own highlights"
  ON public.profile_highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
  ON public.profile_highlights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
  ON public.profile_highlights FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for profile_highlight_items
CREATE POLICY "Users can view items of visible highlights"
  ON public.profile_highlight_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profile_highlights h 
    WHERE h.id = highlight_id
  ));

CREATE POLICY "Users can insert items to their highlights"
  ON public.profile_highlight_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profile_highlights h 
    WHERE h.id = highlight_id AND h.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items in their highlights"
  ON public.profile_highlight_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profile_highlights h 
    WHERE h.id = highlight_id AND h.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items from their highlights"
  ON public.profile_highlight_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profile_highlights h 
    WHERE h.id = highlight_id AND h.user_id = auth.uid()
  ));

-- Create storage bucket for highlights
INSERT INTO storage.buckets (id, name, public)
VALUES ('highlights', 'highlights', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view highlight images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'highlights');

CREATE POLICY "Users can upload highlight images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'highlights' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their highlight images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'highlights' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their highlight images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'highlights' AND auth.uid()::text = (storage.foldername(name))[1]);