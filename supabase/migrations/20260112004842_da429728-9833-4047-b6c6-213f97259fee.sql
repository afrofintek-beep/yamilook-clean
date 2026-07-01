-- Fix contacts INSERT RLS for accepting friend requests
-- The app updates friend_requests.status to 'accepted' BEFORE inserting reciprocal contacts.

DROP POLICY IF EXISTS "Users can insert reciprocal contact on friend accept" ON public.contacts;

CREATE POLICY "Users can insert reciprocal contact on friend accept"
ON public.contacts
FOR INSERT
WITH CHECK (
  -- Only allow creating the *other* side of the contact pair (the row whose contact_user_id is the current user)
  contact_user_id = auth.uid()
  AND user_id <> auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.friend_requests fr
    WHERE fr.sender_id = user_id
      AND fr.receiver_id = auth.uid()
      AND fr.status IN ('pending','accepted')
  )
);