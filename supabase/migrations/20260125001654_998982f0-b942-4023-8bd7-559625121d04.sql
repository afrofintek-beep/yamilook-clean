-- Update RLS policies for call_signals to support incoming call detection

-- Ensure RLS is enabled
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "signals_select_participants" ON public.call_signals;
CREATE POLICY "signals_select_participants"
ON public.call_signals FOR SELECT
TO authenticated
USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

DROP POLICY IF EXISTS "signals_insert_sender" ON public.call_signals;
CREATE POLICY "signals_insert_sender"
ON public.call_signals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

-- Also ensure UPDATE and DELETE policies exist
DROP POLICY IF EXISTS "signals_update_recipient" ON public.call_signals;
CREATE POLICY "signals_update_recipient"
ON public.call_signals FOR UPDATE
TO authenticated
USING (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "signals_delete_participants" ON public.call_signals;
CREATE POLICY "signals_delete_participants"
ON public.call_signals FOR DELETE
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);