-- Create live streaming tables

-- Live sessions table
CREATE TABLE public.live_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  viewer_count INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  market_id TEXT,
  city TEXT,
  neighborhood TEXT,
  livekit_room_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Live participants table
CREATE TABLE public.live_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('host', 'viewer', 'moderator')),
  is_muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, user_id)
);

-- Live messages (chat) table
CREATE TABLE public.live_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Live reactions table
CREATE TABLE public.live_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_live_sessions_status ON public.live_sessions(status);
CREATE INDEX idx_live_sessions_host ON public.live_sessions(host_id);
CREATE INDEX idx_live_sessions_location ON public.live_sessions(market_id, city, neighborhood);
CREATE INDEX idx_live_sessions_created ON public.live_sessions(created_at DESC);
CREATE INDEX idx_live_participants_session ON public.live_participants(session_id);
CREATE INDEX idx_live_participants_user ON public.live_participants(user_id);
CREATE INDEX idx_live_messages_session ON public.live_messages(session_id, created_at DESC);
CREATE INDEX idx_live_reactions_session ON public.live_reactions(session_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_sessions
CREATE POLICY "Anyone can view live or ended sessions"
  ON public.live_sessions FOR SELECT
  USING (status IN ('live', 'ended'));

CREATE POLICY "Hosts can view their own sessions"
  ON public.live_sessions FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "Authenticated users can create sessions"
  ON public.live_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own sessions"
  ON public.live_sessions FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own sessions"
  ON public.live_sessions FOR DELETE
  USING (auth.uid() = host_id);

-- RLS Policies for live_participants
CREATE POLICY "Anyone can view participants of live sessions"
  ON public.live_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions 
    WHERE id = session_id AND status = 'live'
  ));

CREATE POLICY "Authenticated users can join live sessions"
  ON public.live_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.live_sessions 
    WHERE id = session_id AND status = 'live'
  ));

CREATE POLICY "Users can update their own participation"
  ON public.live_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Hosts can update participants in their sessions"
  ON public.live_participants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions 
    WHERE id = session_id AND host_id = auth.uid()
  ));

CREATE POLICY "Users can leave sessions"
  ON public.live_participants FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for live_messages
CREATE POLICY "Anyone can view messages in live sessions"
  ON public.live_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions 
    WHERE id = session_id AND status = 'live'
  ) AND is_deleted = false);

CREATE POLICY "Participants can send messages"
  ON public.live_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.live_participants 
    WHERE session_id = live_messages.session_id 
    AND user_id = auth.uid() 
    AND is_muted = false
  ));

CREATE POLICY "Users can delete their own messages"
  ON public.live_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Hosts can delete any message in their session"
  ON public.live_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions 
    WHERE id = session_id AND host_id = auth.uid()
  ));

-- RLS Policies for live_reactions
CREATE POLICY "Anyone can view reactions in live sessions"
  ON public.live_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions 
    WHERE id = session_id AND status = 'live'
  ));

CREATE POLICY "Participants can send reactions"
  ON public.live_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.live_participants 
    WHERE session_id = live_reactions.session_id 
    AND user_id = auth.uid()
  ));

-- Enable realtime for live tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_reactions;

-- Function to update viewer count
CREATE OR REPLACE FUNCTION public.update_live_viewer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.live_participants
    WHERE session_id = NEW.session_id AND left_at IS NULL;
    
    UPDATE public.live_sessions
    SET viewer_count = current_count,
        peak_viewers = GREATEST(peak_viewers, current_count)
    WHERE id = NEW.session_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.left_at IS NOT NULL AND OLD.left_at IS NULL THEN
      SELECT COUNT(*) INTO current_count
      FROM public.live_participants
      WHERE session_id = NEW.session_id AND left_at IS NULL;
      
      UPDATE public.live_sessions
      SET viewer_count = current_count
      WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.live_participants
    WHERE session_id = OLD.session_id AND left_at IS NULL;
    
    UPDATE public.live_sessions
    SET viewer_count = current_count
    WHERE id = OLD.session_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for viewer count
CREATE TRIGGER trigger_update_live_viewer_count
AFTER INSERT OR UPDATE OR DELETE ON public.live_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_live_viewer_count();

-- Trigger for updated_at
CREATE TRIGGER update_live_sessions_updated_at
BEFORE UPDATE ON public.live_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();