-- Create call_signals table for WebRTC signaling
CREATE TABLE IF NOT EXISTS public.call_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate', 'call-ended', 'call-declined', 'call-accepted')),
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_signals_call_id ON public.call_signals(call_id);
CREATE INDEX IF NOT EXISTS idx_call_signals_to_user ON public.call_signals(to_user_id, processed);
CREATE INDEX IF NOT EXISTS idx_call_signals_created_at ON public.call_signals(created_at);

-- Enable RLS on call_signals
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only read signals sent to them
CREATE POLICY "Users can read signals sent to them"
ON public.call_signals
FOR SELECT
USING (auth.uid() = to_user_id);

-- RLS: Users can only insert signals from themselves
CREATE POLICY "Users can insert their own signals"
ON public.call_signals
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- RLS: Users can update signals sent to them (mark as processed)
CREATE POLICY "Users can update signals sent to them"
ON public.call_signals
FOR UPDATE
USING (auth.uid() = to_user_id);

-- RLS: Users can delete their own signals or signals sent to them
CREATE POLICY "Users can delete related signals"
ON public.call_signals
FOR DELETE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Ensure calls table has proper structure (update if needed)
ALTER TABLE public.calls 
ADD COLUMN IF NOT EXISTS caller_id UUID,
ADD COLUMN IF NOT EXISTS callee_id UUID,
ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'voice',
ADD COLUMN IF NOT EXISTS sdp_offer JSONB,
ADD COLUMN IF NOT EXISTS sdp_answer JSONB;

-- Update calls RLS to ensure participants can access
DROP POLICY IF EXISTS "Participants can view their calls" ON public.calls;
CREATE POLICY "Participants can view their calls"
ON public.calls
FOR SELECT
USING (
  auth.uid() = initiator_id OR 
  auth.uid() = caller_id OR 
  auth.uid() = callee_id OR
  auth.uid() IN (SELECT user_id FROM public.call_participants WHERE call_id = id)
);

DROP POLICY IF EXISTS "Users can create calls" ON public.calls;
CREATE POLICY "Users can create calls"
ON public.calls
FOR INSERT
WITH CHECK (auth.uid() = initiator_id OR auth.uid() = caller_id);

DROP POLICY IF EXISTS "Participants can update calls" ON public.calls;
CREATE POLICY "Participants can update calls"
ON public.calls
FOR UPDATE
USING (
  auth.uid() = initiator_id OR 
  auth.uid() = caller_id OR 
  auth.uid() = callee_id OR
  auth.uid() IN (SELECT user_id FROM public.call_participants WHERE call_id = id)
);

-- Enable realtime for call_signals table
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;

-- Function to clean up old signals (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.call_signals 
  WHERE created_at < now() - INTERVAL '1 hour';
END;
$$;