
-- Create calls table for 1:1 and group calls
CREATE TABLE public.calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'voice' CHECK (type IN ('voice', 'video')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'connecting', 'ongoing', 'ended', 'missed', 'declined', 'failed')),
  initiator_id UUID NOT NULL,
  is_group_call BOOLEAN NOT NULL DEFAULT false,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  end_reason TEXT,
  max_participants INTEGER DEFAULT 32,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  waiting_room_enabled BOOLEAN NOT NULL DEFAULT false,
  recording_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create call participants table
CREATE TABLE public.call_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('host', 'co_host', 'participant')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'ringing', 'waiting', 'connected', 'on_hold', 'left', 'removed', 'declined')),
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_video_enabled BOOLEAN NOT NULL DEFAULT true,
  is_screen_sharing BOOLEAN NOT NULL DEFAULT false,
  is_hand_raised BOOLEAN NOT NULL DEFAULT false,
  is_spotlight BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  virtual_background TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create call recordings table
CREATE TABLE public.call_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_consent' CHECK (status IN ('pending_consent', 'recording', 'paused', 'stopped', 'processing', 'completed', 'failed')),
  storage_path TEXT,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  has_transcription BOOLEAN NOT NULL DEFAULT false,
  transcription_text TEXT,
  retention_days INTEGER DEFAULT 90,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create recording consent log (GDPR compliance)
CREATE TABLE public.recording_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES public.call_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  consented BOOLEAN NOT NULL,
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT
);

-- Create scheduled calls table
CREATE TABLE public.scheduled_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  call_type TEXT NOT NULL DEFAULT 'video' CHECK (call_type IN ('voice', 'video')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly')),
  recurrence_end_date DATE,
  invite_link TEXT,
  waiting_room_enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'started', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled call invites
CREATE TABLE public.scheduled_call_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_call_id UUID NOT NULL REFERENCES public.scheduled_calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rsvp_status TEXT NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'maybe')),
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create call statistics table
CREATE TABLE public.call_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  avg_latency_ms INTEGER,
  packet_loss_percent NUMERIC(5,2),
  avg_resolution TEXT,
  bandwidth_kbps INTEGER,
  audio_quality_score NUMERIC(3,2),
  video_quality_score NUMERIC(3,2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create breakout rooms table
CREATE TABLE public.breakout_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create breakout room participants
CREATE TABLE public.breakout_room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  breakout_room_id UUID NOT NULL REFERENCES public.breakout_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create virtual backgrounds table
CREATE TABLE public.virtual_backgrounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('blur', 'image', 'animated', 'video')),
  storage_path TEXT,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  blur_intensity INTEGER CHECK (blur_intensity BETWEEN 1 AND 10),
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create call reactions table
CREATE TABLE public.call_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user call settings table
CREATE TABLE public.user_call_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  default_video_on BOOLEAN NOT NULL DEFAULT true,
  default_audio_on BOOLEAN NOT NULL DEFAULT true,
  noise_suppression_enabled BOOLEAN NOT NULL DEFAULT true,
  echo_cancellation_enabled BOOLEAN NOT NULL DEFAULT true,
  low_light_enhancement BOOLEAN NOT NULL DEFAULT false,
  beauty_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  preferred_background_id UUID REFERENCES public.virtual_backgrounds(id),
  data_saver_mode BOOLEAN NOT NULL DEFAULT false,
  captions_enabled BOOLEAN NOT NULL DEFAULT false,
  captions_language TEXT DEFAULT 'en',
  captions_font_size INTEGER DEFAULT 16,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recording_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_call_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakout_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakout_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_call_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls
CREATE POLICY "Users can view calls they participate in"
ON public.calls FOR SELECT
USING (
  initiator_id = auth.uid() OR
  id IN (SELECT call_id FROM public.call_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create calls"
ON public.calls FOR INSERT
WITH CHECK (initiator_id = auth.uid());

CREATE POLICY "Hosts can update calls"
ON public.calls FOR UPDATE
USING (
  initiator_id = auth.uid() OR
  id IN (SELECT call_id FROM public.call_participants WHERE user_id = auth.uid() AND role IN ('host', 'co_host'))
);

-- RLS Policies for call_participants
CREATE POLICY "Users can view call participants"
ON public.call_participants FOR SELECT
USING (
  call_id IN (SELECT id FROM public.calls WHERE initiator_id = auth.uid()) OR
  call_id IN (SELECT call_id FROM public.call_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Users can join calls"
ON public.call_participants FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR
  call_id IN (SELECT id FROM public.calls WHERE initiator_id = auth.uid())
);

CREATE POLICY "Users can update their own participant record"
ON public.call_participants FOR UPDATE
USING (user_id = auth.uid() OR call_id IN (SELECT id FROM public.calls WHERE initiator_id = auth.uid()));

-- RLS Policies for call_recordings
CREATE POLICY "Users can view recordings of their calls"
ON public.call_recordings FOR SELECT
USING (
  call_id IN (SELECT call_id FROM public.call_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Hosts can create recordings"
ON public.call_recordings FOR INSERT
WITH CHECK (initiated_by = auth.uid());

CREATE POLICY "Initiator can update recording"
ON public.call_recordings FOR UPDATE
USING (initiated_by = auth.uid());

-- RLS Policies for recording_consents
CREATE POLICY "Users can view their consent records"
ON public.recording_consents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create consent records"
ON public.recording_consents FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their consent"
ON public.recording_consents FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for scheduled_calls
CREATE POLICY "Users can view scheduled calls they are invited to"
ON public.scheduled_calls FOR SELECT
USING (
  organizer_id = auth.uid() OR
  id IN (SELECT scheduled_call_id FROM public.scheduled_call_invites WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create scheduled calls"
ON public.scheduled_calls FOR INSERT
WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can update scheduled calls"
ON public.scheduled_calls FOR UPDATE
USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can delete scheduled calls"
ON public.scheduled_calls FOR DELETE
USING (organizer_id = auth.uid());

-- RLS Policies for scheduled_call_invites
CREATE POLICY "Users can view their invites"
ON public.scheduled_call_invites FOR SELECT
USING (
  user_id = auth.uid() OR
  scheduled_call_id IN (SELECT id FROM public.scheduled_calls WHERE organizer_id = auth.uid())
);

CREATE POLICY "Organizers can create invites"
ON public.scheduled_call_invites FOR INSERT
WITH CHECK (
  scheduled_call_id IN (SELECT id FROM public.scheduled_calls WHERE organizer_id = auth.uid())
);

CREATE POLICY "Users can update their RSVP"
ON public.scheduled_call_invites FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for call_statistics
CREATE POLICY "Users can view their call stats"
ON public.call_statistics FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their stats"
ON public.call_statistics FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS Policies for breakout_rooms
CREATE POLICY "Participants can view breakout rooms"
ON public.breakout_rooms FOR SELECT
USING (
  call_id IN (SELECT call_id FROM public.call_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Hosts can manage breakout rooms"
ON public.breakout_rooms FOR ALL
USING (
  call_id IN (SELECT id FROM public.calls WHERE initiator_id = auth.uid()) OR
  call_id IN (SELECT call_id FROM public.call_participants WHERE user_id = auth.uid() AND role IN ('host', 'co_host'))
);

-- RLS Policies for breakout_room_participants
CREATE POLICY "Participants can view breakout room members"
ON public.breakout_room_participants FOR SELECT
USING (
  breakout_room_id IN (
    SELECT id FROM public.breakout_rooms WHERE call_id IN (
      SELECT call_id FROM public.call_participants WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can join/leave breakout rooms"
ON public.breakout_room_participants FOR ALL
USING (user_id = auth.uid());

-- RLS Policies for virtual_backgrounds
CREATE POLICY "Users can view preset and own backgrounds"
ON public.virtual_backgrounds FOR SELECT
USING (is_preset = true OR user_id = auth.uid());

CREATE POLICY "Users can create backgrounds"
ON public.virtual_backgrounds FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their backgrounds"
ON public.virtual_backgrounds FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for call_reactions
CREATE POLICY "Participants can view reactions"
ON public.call_reactions FOR SELECT
USING (
  call_id IN (SELECT call_id FROM public.call_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Participants can react"
ON public.call_reactions FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  call_id IN (SELECT call_id FROM public.call_participants WHERE user_id = auth.uid())
);

-- RLS Policies for user_call_settings
CREATE POLICY "Users can view their settings"
ON public.user_call_settings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their settings"
ON public.user_call_settings FOR ALL
USING (user_id = auth.uid());

-- Insert preset virtual backgrounds
INSERT INTO public.virtual_backgrounds (name, type, is_preset, blur_intensity) VALUES
('Light Blur', 'blur', true, 3),
('Medium Blur', 'blur', true, 5),
('Heavy Blur', 'blur', true, 8);

INSERT INTO public.virtual_backgrounds (name, type, storage_path, is_preset) VALUES
('Office', 'image', '/backgrounds/office.jpg', true),
('Living Room', 'image', '/backgrounds/living-room.jpg', true),
('Bookshelf', 'image', '/backgrounds/bookshelf.jpg', true),
('Nature', 'image', '/backgrounds/nature.jpg', true),
('Beach', 'image', '/backgrounds/beach.jpg', true),
('Mountains', 'image', '/backgrounds/mountains.jpg', true),
('City Skyline', 'image', '/backgrounds/city.jpg', true),
('Abstract Blue', 'image', '/backgrounds/abstract-blue.jpg', true),
('Abstract Purple', 'image', '/backgrounds/abstract-purple.jpg', true),
('Gradient', 'image', '/backgrounds/gradient.jpg', true);

-- Create trigger for calls updated_at
CREATE TRIGGER update_calls_updated_at
BEFORE UPDATE ON public.calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for scheduled_calls updated_at
CREATE TRIGGER update_scheduled_calls_updated_at
BEFORE UPDATE ON public.scheduled_calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for user_call_settings updated_at
CREATE TRIGGER update_user_call_settings_updated_at
BEFORE UPDATE ON public.user_call_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for call-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.breakout_rooms;
