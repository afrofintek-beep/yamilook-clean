-- Create close_friends table for managing close friends list
CREATE TABLE public.close_friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;

-- Users can view their own close friends list
CREATE POLICY "Users can view their own close friends"
ON public.close_friends
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their own close friends list
CREATE POLICY "Users can add close friends"
ON public.close_friends
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own close friends list
CREATE POLICY "Users can remove close friends"
ON public.close_friends
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_close_friends_user_id ON public.close_friends(user_id);
CREATE INDEX idx_close_friends_friend_id ON public.close_friends(friend_id);