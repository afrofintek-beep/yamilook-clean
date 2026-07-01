-- Create table for topic suggestions (pending approval)
CREATE TABLE public.topic_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  suggested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

-- Enable RLS
ALTER TABLE public.topic_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
ON public.topic_suggestions
FOR SELECT
USING (auth.uid() = suggested_by);

-- Users can create suggestions
CREATE POLICY "Users can create suggestions"
ON public.topic_suggestions
FOR INSERT
WITH CHECK (auth.uid() = suggested_by);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
ON public.topic_suggestions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update suggestions (approve/reject)
CREATE POLICY "Admins can update suggestions"
ON public.topic_suggestions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete suggestions
CREATE POLICY "Admins can delete suggestions"
ON public.topic_suggestions
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));