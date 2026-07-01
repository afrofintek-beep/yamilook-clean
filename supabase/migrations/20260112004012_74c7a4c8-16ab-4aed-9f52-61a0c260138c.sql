-- Drop existing contacts INSERT policy and create a new one that allows 
-- inserting contacts for both sides when accepting a friend request

DROP POLICY IF EXISTS "Users can add contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON public.contacts;

-- Allow users to insert their own contacts
CREATE POLICY "Users can insert own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert reciprocal contact when accepting friend request
-- This is needed because when User A accepts User B's request, 
-- we need to create contact entries for both A->B and B->A
CREATE POLICY "Users can insert reciprocal contact on friend accept" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.friend_requests 
    WHERE status = 'pending'
    AND receiver_id = auth.uid()
    AND sender_id = user_id
  )
);