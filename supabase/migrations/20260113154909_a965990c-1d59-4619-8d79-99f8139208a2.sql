-- Create voicemails table for missed call voice messages
CREATE TABLE public.voicemails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  is_listened BOOLEAN NOT NULL DEFAULT false,
  listened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.voicemails ENABLE ROW LEVEL SECURITY;

-- Create policies for voicemails
CREATE POLICY "Users can view their received voicemails"
ON public.voicemails FOR SELECT
USING (auth.uid() = to_user_id);

CREATE POLICY "Users can view their sent voicemails"
ON public.voicemails FOR SELECT
USING (auth.uid() = from_user_id);

CREATE POLICY "Users can create voicemails"
ON public.voicemails FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients can update voicemail status"
ON public.voicemails FOR UPDATE
USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete their own voicemails"
ON public.voicemails FOR DELETE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Create index for faster queries
CREATE INDEX idx_voicemails_to_user ON public.voicemails(to_user_id);
CREATE INDEX idx_voicemails_from_user ON public.voicemails(from_user_id);
CREATE INDEX idx_voicemails_created_at ON public.voicemails(created_at DESC);

-- Enable realtime for voicemails
ALTER PUBLICATION supabase_realtime ADD TABLE public.voicemails;