
-- Fix the INSERT policy for view_once_views to have proper WITH CHECK
DROP POLICY IF EXISTS "Users can mark view once as viewed" ON public.view_once_views;

CREATE POLICY "Users can mark view once as viewed"
ON public.view_once_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add unique constraint so upsert works correctly
ALTER TABLE public.view_once_views
DROP CONSTRAINT IF EXISTS view_once_views_message_id_user_id_key;

ALTER TABLE public.view_once_views
ADD CONSTRAINT view_once_views_message_id_user_id_key UNIQUE (message_id, user_id);
