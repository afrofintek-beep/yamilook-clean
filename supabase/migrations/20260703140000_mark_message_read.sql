-- Atomic, correct read-receipt marking.
--
-- The client used to do:
--   UPDATE messages SET read_by = JSON.stringify([user.id])
-- which (a) OVERWROTE read_by, dropping every other reader (broken group
-- receipts), and (b) wrote a JSON *string* into the jsonb column, so the UI's
-- Array.isArray(read_by) check was always false and receipts never showed.
--
-- This function appends the caller's id to read_by as a real jsonb array,
-- de-duplicated and atomic (no read-modify-write race between concurrent
-- readers). It only touches messages in conversations the caller belongs to.
CREATE OR REPLACE FUNCTION public.mark_message_read(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_uid text := auth.uid()::text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.messages m
  SET
    read_by = (
      SELECT COALESCE(jsonb_agg(DISTINCT e), '[]'::jsonb)
      FROM jsonb_array_elements_text(
        (CASE WHEN jsonb_typeof(m.read_by) = 'array' THEN m.read_by ELSE '[]'::jsonb END)
        || to_jsonb(v_uid)
      ) AS e
    ),
    delivered_at = COALESCE(m.delivered_at, now())
  WHERE m.id = p_message_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = m.conversation_id
        AND cp.user_id = auth.uid()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_message_read(uuid) TO authenticated;
