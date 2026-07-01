-- Function to sign out all other sessions for a user
-- This uses the auth.sessions table which tracks active sessions
-- We'll create a server-side function that the client can call

CREATE OR REPLACE FUNCTION public.revoke_other_sessions(current_session_id TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_id_val UUID;
BEGIN
  -- Get the current user's ID
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete all sessions for this user except the current one
  IF current_session_id IS NOT NULL THEN
    DELETE FROM auth.sessions 
    WHERE user_id = user_id_val 
    AND id::text != current_session_id;
  ELSE
    -- If no current session provided, delete all but the most recent
    DELETE FROM auth.sessions 
    WHERE user_id = user_id_val 
    AND id != (
      SELECT id FROM auth.sessions 
      WHERE user_id = user_id_val 
      ORDER BY created_at DESC 
      LIMIT 1
    );
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.revoke_other_sessions(TEXT) TO authenticated;