-- Fix calls RLS policies: ensure they apply to authenticated role
-- Drop existing policies
DROP POLICY IF EXISTS calls_insert_policy ON public.calls;
DROP POLICY IF EXISTS calls_select_policy ON public.calls;
DROP POLICY IF EXISTS calls_update_policy ON public.calls;
DROP POLICY IF EXISTS calls_delete_policy ON public.calls;

-- Recreate INSERT policy for authenticated users
CREATE POLICY "Users can create calls"
ON public.calls
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = initiator_id);

-- SELECT: users can see calls they are part of (using security definer function)
CREATE POLICY "Users can view their calls"
ON public.calls
FOR SELECT
TO authenticated
USING (public.is_call_participant(id, auth.uid()));

-- UPDATE: users can update calls they are part of
CREATE POLICY "Users can update their calls"
ON public.calls
FOR UPDATE
TO authenticated
USING (public.is_call_participant(id, auth.uid()));

-- DELETE: only initiator can delete
CREATE POLICY "Initiators can delete calls"
ON public.calls
FOR DELETE
TO authenticated
USING (auth.uid() = initiator_id);