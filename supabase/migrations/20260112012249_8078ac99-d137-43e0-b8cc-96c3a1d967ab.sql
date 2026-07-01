-- Fix the overly permissive INSERT policy for conversations
-- Users should only be able to create conversations where they set themselves as creator

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow insert only if created_by is the current user OR if created_by is null
  created_by IS NULL OR created_by = auth.uid()
);