-- Create a SECURITY DEFINER RPC to create calls + participants reliably under RLS

CREATE OR REPLACE FUNCTION public.create_call(
  p_callee_id uuid,
  p_call_type text,
  p_conversation_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_call_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the call (set safe defaults for NOT NULL columns)
  INSERT INTO public.calls (
    initiator_id,
    caller_id,
    callee_id,
    type,
    status,
    conversation_id,
    is_group_call,
    is_locked,
    waiting_room_enabled,
    recording_enabled,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    p_callee_id,
    p_call_type,
    'ringing',
    p_conversation_id,
    false,
    false,
    false,
    false,
    now(),
    now()
  )
  RETURNING id INTO v_call_id;

  -- Add participants
  INSERT INTO public.call_participants (call_id, user_id, role, status, joined_at)
  VALUES
    (v_call_id, v_user_id, 'host', 'connected', now()),
    (v_call_id, p_callee_id, 'participant', 'ringing', NULL);

  RETURN v_call_id;
END;
$$;

-- Allow authenticated users to execute
REVOKE ALL ON FUNCTION public.create_call(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_call(uuid, text, uuid) TO authenticated;