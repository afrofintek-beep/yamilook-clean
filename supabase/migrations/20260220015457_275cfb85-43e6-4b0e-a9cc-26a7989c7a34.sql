
-- Create the missing create_call RPC function
-- This is called by useCallLifecycle.createCallInDB to initiate a call
CREATE OR REPLACE FUNCTION public.create_call(
  p_callee_id UUID,
  p_call_type TEXT DEFAULT 'voice',
  p_conversation_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_call_id UUID;
  v_caller_id UUID;
BEGIN
  -- Get the authenticated user
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_caller_id = p_callee_id THEN
    RAISE EXCEPTION 'Cannot call yourself';
  END IF;

  -- Create the call record
  INSERT INTO public.calls (
    initiator_id,
    caller_id,
    callee_id,
    type,
    call_type,
    status,
    is_group_call,
    conversation_id,
    max_participants,
    is_locked,
    waiting_room_enabled,
    recording_enabled
  ) VALUES (
    v_caller_id,
    v_caller_id,
    p_callee_id,
    p_call_type,
    p_call_type,
    'ringing',
    false,
    p_conversation_id,
    2,
    false,
    false,
    false
  )
  RETURNING id INTO v_call_id;

  -- Add caller as participant (host)
  INSERT INTO public.call_participants (
    call_id,
    user_id,
    role,
    status,
    is_muted,
    is_video_enabled,
    is_screen_sharing,
    is_hand_raised,
    is_spotlight
  ) VALUES (
    v_call_id,
    v_caller_id,
    'host',
    'connected',
    false,
    p_call_type = 'video',
    false,
    false,
    false
  );

  -- Add callee as participant (waiting to be answered)
  INSERT INTO public.call_participants (
    call_id,
    user_id,
    role,
    status,
    is_muted,
    is_video_enabled,
    is_screen_sharing,
    is_hand_raised,
    is_spotlight
  ) VALUES (
    v_call_id,
    p_callee_id,
    'participant',
    'ringing',
    false,
    p_call_type = 'video',
    false,
    false,
    false
  );

  RETURN v_call_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_call(UUID, TEXT, UUID) TO authenticated;
