-- First drop ALL existing policies on calls table
DROP POLICY IF EXISTS "Users can create calls" ON public.calls;
DROP POLICY IF EXISTS "Users can view their calls" ON public.calls;
DROP POLICY IF EXISTS "Users can update their calls" ON public.calls;
DROP POLICY IF EXISTS "Initiator can delete calls" ON public.calls;
DROP POLICY IF EXISTS "Participants can view calls" ON public.calls;
DROP POLICY IF EXISTS "Caller can create calls" ON public.calls;
DROP POLICY IF EXISTS "Participants can update calls" ON public.calls;
DROP POLICY IF EXISTS "Call participants can view" ON public.calls;
DROP POLICY IF EXISTS "Caller can insert" ON public.calls;
DROP POLICY IF EXISTS "Participants can update" ON public.calls;

-- Now create clean, non-recursive policies
CREATE POLICY "calls_select_policy"
ON public.calls FOR SELECT
USING (
  auth.uid() = caller_id OR 
  auth.uid() = callee_id OR
  auth.uid() = initiator_id
);

CREATE POLICY "calls_insert_policy"
ON public.calls FOR INSERT
WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "calls_update_policy"
ON public.calls FOR UPDATE
USING (
  auth.uid() = caller_id OR 
  auth.uid() = callee_id OR
  auth.uid() = initiator_id
);

CREATE POLICY "calls_delete_policy"
ON public.calls FOR DELETE
USING (auth.uid() = initiator_id);