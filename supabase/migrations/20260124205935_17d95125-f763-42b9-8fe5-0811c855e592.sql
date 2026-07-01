-- Fix infinite recursion between calls <-> call_participants RLS

-- 1) Helper: check if current user is the initiator of a call (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_call_initiator(
  p_call_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.calls c
    WHERE c.id = p_call_id
      AND c.initiator_id = p_user_id
  );
$$;

-- 2) Replace call_participants initiator policies to avoid querying calls inside policies
DROP POLICY IF EXISTS "Initiator can insert participants" ON public.call_participants;
DROP POLICY IF EXISTS "Initiators can update participants" ON public.call_participants;
DROP POLICY IF EXISTS "Initiators can view participants" ON public.call_participants;

CREATE POLICY "Initiators can view participants"
ON public.call_participants
FOR SELECT
USING (public.is_call_initiator(call_id, auth.uid()));

CREATE POLICY "Initiators can update participants"
ON public.call_participants
FOR UPDATE
USING (public.is_call_initiator(call_id, auth.uid()));

CREATE POLICY "Initiator can insert participants"
ON public.call_participants
FOR INSERT
WITH CHECK (public.is_call_initiator(call_id, auth.uid()));

-- 3) Replace calls select/update policies to use SECURITY DEFINER function instead of referencing call_participants directly
DROP POLICY IF EXISTS calls_select_policy ON public.calls;
DROP POLICY IF EXISTS calls_update_policy ON public.calls;

CREATE POLICY calls_select_policy
ON public.calls
FOR SELECT
USING (public.is_call_participant(id, auth.uid()));

CREATE POLICY calls_update_policy
ON public.calls
FOR UPDATE
USING (public.is_call_participant(id, auth.uid()));
