-- Create status_reactions table for emoji reactions on statuses
CREATE TABLE public.status_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_id UUID NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (status_id, user_id)
);

-- Enable RLS
ALTER TABLE public.status_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions on statuses they can see
CREATE POLICY "Users can view status reactions"
ON public.status_reactions
FOR SELECT
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add own reactions"
ON public.status_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions"
ON public.status_reactions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
ON public.status_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_status_reactions_status_id ON public.status_reactions(status_id);
CREATE INDEX idx_status_reactions_user_id ON public.status_reactions(user_id);