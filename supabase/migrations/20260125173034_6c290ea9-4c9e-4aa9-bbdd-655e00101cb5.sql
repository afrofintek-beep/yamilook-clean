-- Add missing RLS policy: sender can read their own signals
-- This allows callers to read signals they sent (for debugging/verification)

CREATE POLICY "sender_can_read_own_signals"
ON public.call_signals
FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id);