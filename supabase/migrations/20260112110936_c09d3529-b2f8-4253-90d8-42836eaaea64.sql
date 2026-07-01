-- Drop existing cleanup function first to change return type
DROP FUNCTION IF EXISTS public.cleanup_old_signals();

-- Improved cleanup function with TTL that returns count
CREATE OR REPLACE FUNCTION public.cleanup_old_signals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.call_signals 
  WHERE created_at < now() - INTERVAL '1 hour';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to check if user is call participant
CREATE OR REPLACE FUNCTION public.is_call_participant(p_call_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.call_participants
    WHERE call_id = p_call_id AND user_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.calls
    WHERE id = p_call_id AND (caller_id = p_user_id OR callee_id = p_user_id OR initiator_id = p_user_id)
  )
$$;