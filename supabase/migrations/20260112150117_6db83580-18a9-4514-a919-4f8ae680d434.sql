-- Fix RLS to allow the call initiator to insert the callee participant row

-- calls: remove older/buggy overlapping policies (keep the clean *calls_* ones)
DROP POLICY IF EXISTS "Participants can view joined calls" ON public.calls;
DROP POLICY IF EXISTS "Users can view own calls" ON public.calls;
DROP POLICY IF EXISTS "Initiators can update calls" ON public.calls;

-- call_participants: allow initiator to create participant rows for invitees
DROP POLICY IF EXISTS "Initiator can insert participants" ON public.call_participants;

CREATE POLICY "Initiator can insert participants"
ON public.call_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.calls c
    WHERE c.id = call_participants.call_id
      AND c.initiator_id = auth.uid()
  )
);
