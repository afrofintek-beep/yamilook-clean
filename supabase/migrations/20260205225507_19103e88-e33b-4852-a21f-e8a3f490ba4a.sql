
-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their saved posts" ON public.saved_posts;

-- Create separate policies with explicit WITH CHECK
CREATE POLICY "Users can view their saved posts"
ON public.saved_posts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
ON public.saved_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
ON public.saved_posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
