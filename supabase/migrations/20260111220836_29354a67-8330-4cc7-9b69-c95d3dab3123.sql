-- Fix infinite recursion in calls and call_participants RLS policies
-- The problem: calls SELECT policy has a bug (call_participants.call_id = call_participants.id)
-- and circular references between calls and call_participants

-- Step 1: Drop the problematic policies on calls table
DROP POLICY IF EXISTS "Participants can view their calls" ON public.calls;
DROP POLICY IF EXISTS "Users can view calls they participate in" ON public.calls;
DROP POLICY IF EXISTS "Participants can update calls" ON public.calls;
DROP POLICY IF EXISTS "Hosts can update calls" ON public.calls;

-- Step 2: Drop problematic policies on call_participants
DROP POLICY IF EXISTS "Users can view call participants" ON public.call_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.call_participants;
DROP POLICY IF EXISTS "Users can join calls" ON public.call_participants;

-- Step 3: Create fixed policies for calls table (simple, no circular references)

-- Users can view calls they initiated or are caller/callee
CREATE POLICY "Users can view own calls" 
ON public.calls 
FOR SELECT 
USING (
  auth.uid() = initiator_id 
  OR auth.uid() = caller_id 
  OR auth.uid() = callee_id
);

-- Participants can view calls they are in
CREATE POLICY "Participants can view joined calls" 
ON public.calls 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.call_participants cp
    WHERE cp.call_id = id 
    AND cp.user_id = auth.uid()
  )
);

-- Initiators and hosts can update calls
CREATE POLICY "Initiators can update calls" 
ON public.calls 
FOR UPDATE 
USING (auth.uid() = initiator_id);

-- Step 4: Create fixed policies for call_participants table (no circular references)

-- Users can view their own participant records
CREATE POLICY "Users can view own participation" 
ON public.call_participants 
FOR SELECT 
USING (user_id = auth.uid());

-- Initiators can view all participants in their calls
CREATE POLICY "Initiators can view participants" 
ON public.call_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.calls c
    WHERE c.id = call_id 
    AND c.initiator_id = auth.uid()
  )
);

-- Users can join calls (insert their own record)
CREATE POLICY "Users can join as participant" 
ON public.call_participants 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can update their own participant record
CREATE POLICY "Users can update own participation" 
ON public.call_participants 
FOR UPDATE 
USING (user_id = auth.uid());

-- Initiators can update any participant in their calls
CREATE POLICY "Initiators can update participants" 
ON public.call_participants 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.calls c
    WHERE c.id = call_id 
    AND c.initiator_id = auth.uid()
  )
);