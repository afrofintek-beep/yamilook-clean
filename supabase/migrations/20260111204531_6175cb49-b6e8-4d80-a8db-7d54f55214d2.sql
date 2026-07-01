-- Fix infinite recursion in scheduled_call_invites and scheduled_calls policies
-- The problem: scheduled_call_invites SELECT policy queries scheduled_calls,
-- and scheduled_calls SELECT policy queries scheduled_call_invites, causing infinite loop

-- Step 1: Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their invites" ON public.scheduled_call_invites;
DROP POLICY IF EXISTS "Users can view scheduled calls they are invited to" ON public.scheduled_calls;

-- Step 2: Create fixed policies that don't have circular references

-- For scheduled_call_invites: Users can only see their own invites (simple, no subquery)
CREATE POLICY "Users can view their invites" 
ON public.scheduled_call_invites 
FOR SELECT 
USING (user_id = auth.uid());

-- For scheduled_calls: Organizers can see their own calls
CREATE POLICY "Organizers can view their scheduled calls" 
ON public.scheduled_calls 
FOR SELECT 
USING (organizer_id = auth.uid());

-- For scheduled_calls: Invitees can see calls they are invited to (using EXISTS with direct user_id check)
CREATE POLICY "Invitees can view scheduled calls" 
ON public.scheduled_calls 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.scheduled_call_invites sci
    WHERE sci.scheduled_call_id = id 
    AND sci.user_id = auth.uid()
  )
);

-- Also fix the Organizers can create invites policy to avoid subquery
DROP POLICY IF EXISTS "Organizers can create invites" ON public.scheduled_call_invites;

CREATE POLICY "Organizers can create invites" 
ON public.scheduled_call_invites 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scheduled_calls sc
    WHERE sc.id = scheduled_call_id 
    AND sc.organizer_id = auth.uid()
  )
);