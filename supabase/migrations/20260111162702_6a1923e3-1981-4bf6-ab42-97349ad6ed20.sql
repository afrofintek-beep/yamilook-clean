-- Enable RLS + policies so chat messaging and typing indicators work

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participants"
ON public.messages
FOR SELECT
USING (public.user_is_participant(conversation_id));

CREATE POLICY "messages_insert_participants"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.user_is_participant(conversation_id)
);

CREATE POLICY "messages_update_sender"
ON public.messages
FOR UPDATE
USING (
  sender_id = auth.uid()
  AND public.user_is_participant(conversation_id)
)
WITH CHECK (
  sender_id = auth.uid()
  AND public.user_is_participant(conversation_id)
);

CREATE POLICY "messages_delete_sender"
ON public.messages
FOR DELETE
USING (
  sender_id = auth.uid()
  AND public.user_is_participant(conversation_id)
);

-- TYPING INDICATORS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "typing_select_participants"
ON public.typing_indicators
FOR SELECT
USING (public.user_is_participant(conversation_id));

CREATE POLICY "typing_insert_owner"
ON public.typing_indicators
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND public.user_is_participant(conversation_id)
);

CREATE POLICY "typing_update_owner"
ON public.typing_indicators
FOR UPDATE
USING (
  user_id = auth.uid()
  AND public.user_is_participant(conversation_id)
)
WITH CHECK (
  user_id = auth.uid()
  AND public.user_is_participant(conversation_id)
);

CREATE POLICY "typing_delete_owner"
ON public.typing_indicators
FOR DELETE
USING (
  user_id = auth.uid()
  AND public.user_is_participant(conversation_id)
);

-- Ensure realtime is enabled for the tables we depend on (idempotent)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;