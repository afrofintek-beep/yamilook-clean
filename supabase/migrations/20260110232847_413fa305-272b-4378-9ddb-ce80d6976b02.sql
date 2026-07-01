-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

-- Create a new policy that doesn't cause recursion
-- Users can view participants if they are a participant in that conversation
CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Alternative approach: use a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.user_is_participant(conv_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conv_id 
    AND user_id = auth.uid()
  );
$$;

-- Drop the policy again and recreate with the function
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (public.user_is_participant(conversation_id));