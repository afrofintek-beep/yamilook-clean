-- Create statuses table for stories
CREATE TABLE IF NOT EXISTS public.statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'text')),
  content TEXT,
  media_url TEXT,
  background TEXT,
  music_url TEXT,
  music_title TEXT,
  caption TEXT,
  stickers JSONB DEFAULT '[]',
  privacy TEXT NOT NULL DEFAULT 'contacts' CHECK (privacy IN ('everyone', 'contacts', 'close_friends', 'only_me')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Create status views table
CREATE TABLE IF NOT EXISTS public.status_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_id UUID NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(status_id, viewer_id)
);

-- Create status replies table
CREATE TABLE IF NOT EXISTS public.status_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_id UUID NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create muted status contacts table
CREATE TABLE IF NOT EXISTS public.muted_status_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  muted_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, muted_user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muted_status_contacts ENABLE ROW LEVEL SECURITY;

-- Statuses policies
DROP POLICY IF EXISTS "Users can view statuses based on privacy" ON public.statuses;
CREATE POLICY "Users can view statuses based on privacy" ON public.statuses
  FOR SELECT USING (
    user_id = auth.uid() OR
    (privacy = 'everyone' AND expires_at > now() AND NOT is_archived) OR
    (privacy = 'contacts' AND expires_at > now() AND NOT is_archived AND 
      EXISTS (SELECT 1 FROM public.contacts WHERE user_id = auth.uid() AND contact_user_id = statuses.user_id))
  );

DROP POLICY IF EXISTS "Users can create their own statuses" ON public.statuses;
CREATE POLICY "Users can create their own statuses" ON public.statuses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own statuses" ON public.statuses;
CREATE POLICY "Users can update their own statuses" ON public.statuses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own statuses" ON public.statuses;
CREATE POLICY "Users can delete their own statuses" ON public.statuses
  FOR DELETE USING (auth.uid() = user_id);

-- Status views policies
DROP POLICY IF EXISTS "Status owners can see views" ON public.status_views;
CREATE POLICY "Status owners can see views" ON public.status_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.statuses WHERE id = status_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create views" ON public.status_views;
CREATE POLICY "Users can create views" ON public.status_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Status replies policies
DROP POLICY IF EXISTS "Users can see replies to their statuses" ON public.status_replies;
CREATE POLICY "Users can see replies to their statuses" ON public.status_replies
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.statuses WHERE id = status_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create replies" ON public.status_replies;
CREATE POLICY "Users can create replies" ON public.status_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their replies" ON public.status_replies;
CREATE POLICY "Users can delete their replies" ON public.status_replies
  FOR DELETE USING (auth.uid() = user_id);

-- Muted contacts policies
DROP POLICY IF EXISTS "Users can manage their muted contacts" ON public.muted_status_contacts;
CREATE POLICY "Users can manage their muted contacts" ON public.muted_status_contacts
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_statuses_user_id ON public.statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_statuses_expires_at ON public.statuses(expires_at);
CREATE INDEX IF NOT EXISTS idx_status_views_status_id ON public.status_views(status_id);
CREATE INDEX IF NOT EXISTS idx_status_replies_status_id ON public.status_replies(status_id);

-- Enable realtime for statuses
ALTER PUBLICATION supabase_realtime ADD TABLE public.statuses;