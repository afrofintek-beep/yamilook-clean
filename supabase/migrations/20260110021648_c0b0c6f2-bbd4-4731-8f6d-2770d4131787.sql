-- Message reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Pinned messages table
CREATE TABLE public.pinned_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, message_id)
);

-- Starred messages table
CREATE TABLE public.starred_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Message read receipts enhancement - add delivery status
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '[]'::jsonb;

-- Add reply_to support (already exists but ensure it works)
-- Add voice message duration
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Add disappearing messages support
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS disappearing_messages_duration TEXT DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_view_once BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;

-- Message reactions policies
CREATE POLICY "Users can view reactions in their conversations"
ON public.message_reactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.messages m
  JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
  WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
));

CREATE POLICY "Users can add reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE m.id = message_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove own reactions"
ON public.message_reactions FOR DELETE
USING (user_id = auth.uid());

-- Pinned messages policies
CREATE POLICY "Users can view pinned messages in their conversations"
ON public.pinned_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.conversation_participants
  WHERE conversation_id = pinned_messages.conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can pin messages in their conversations"
ON public.pinned_messages FOR INSERT
WITH CHECK (
  pinned_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = pinned_messages.conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can unpin messages"
ON public.pinned_messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.conversation_participants
  WHERE conversation_id = pinned_messages.conversation_id AND user_id = auth.uid()
));

-- Starred messages policies
CREATE POLICY "Users can view own starred messages"
ON public.starred_messages FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can star messages"
ON public.starred_messages FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unstar messages"
ON public.starred_messages FOR DELETE
USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX idx_pinned_messages_conversation_id ON public.pinned_messages(conversation_id);
CREATE INDEX idx_starred_messages_user_id ON public.starred_messages(user_id);
CREATE INDEX idx_messages_content_search ON public.messages USING gin(to_tsvector('english', coalesce(content, '')));

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;