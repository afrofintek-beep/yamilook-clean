-- Drop the existing policy that doesn't check consent
DROP POLICY IF EXISTS "Users can view recordings of their calls" ON public.call_recordings;

-- Create a new policy that verifies consent
CREATE POLICY "Users can view recordings they consented to"
  ON public.call_recordings FOR SELECT
  USING (
    -- Must be a participant in the call
    call_id IN (
      SELECT call_id FROM call_participants WHERE user_id = auth.uid()
    )
    AND (
      -- Recording initiator can always view their own recordings
      initiated_by = auth.uid()
      OR
      -- Other participants must have given consent that hasn't been revoked
      EXISTS (
        SELECT 1 FROM recording_consents
        WHERE recording_id = call_recordings.id
        AND user_id = auth.uid()
        AND consented = true
        AND revoked_at IS NULL
      )
    )
  );