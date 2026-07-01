
-- Drop old RLS policies on calls table
DROP POLICY IF EXISTS "calls_select_policy" ON public.calls;
DROP POLICY IF EXISTS "calls_update_policy" ON public.calls;

-- Create improved SELECT policy that includes participants
CREATE POLICY "calls_select_policy"
ON public.calls FOR SELECT
USING (
  auth.uid() = caller_id OR 
  auth.uid() = callee_id OR
  auth.uid() = initiator_id OR
  EXISTS (
    SELECT 1 FROM public.call_participants cp 
    WHERE cp.call_id = id AND cp.user_id = auth.uid()
  )
);

-- Create improved UPDATE policy that includes participants
CREATE POLICY "calls_update_policy"
ON public.calls FOR UPDATE
USING (
  auth.uid() = caller_id OR 
  auth.uid() = callee_id OR
  auth.uid() = initiator_id OR
  EXISTS (
    SELECT 1 FROM public.call_participants cp 
    WHERE cp.call_id = id AND cp.user_id = auth.uid()
  )
);
