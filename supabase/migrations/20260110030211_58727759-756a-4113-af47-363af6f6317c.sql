-- Add scheduled messages table
CREATE TABLE public.scheduled_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' -- 'pending', 'sent', 'cancelled'
);

-- Enable RLS
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own scheduled messages" 
ON public.scheduled_messages 
FOR ALL 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can view own scheduled messages" 
ON public.scheduled_messages 
FOR SELECT 
USING (auth.uid() = sender_id);

-- Add archived/muted/pinned columns to conversation_participants if not exists
ALTER TABLE public.conversation_participants 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Create index for scheduled messages
CREATE INDEX idx_scheduled_messages_scheduled_for ON public.scheduled_messages(scheduled_for);
CREATE INDEX idx_scheduled_messages_status ON public.scheduled_messages(status);

-- Add view_once tracking
CREATE TABLE public.view_once_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.view_once_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own view_once records" 
ON public.view_once_views 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark view once as viewed" 
ON public.view_once_views 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Message highlights table
CREATE TABLE public.message_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow', -- yellow, blue, green, pink, orange, purple
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own highlights" 
ON public.message_highlights 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own highlights" 
ON public.message_highlights 
FOR SELECT 
USING (auth.uid() = user_id);