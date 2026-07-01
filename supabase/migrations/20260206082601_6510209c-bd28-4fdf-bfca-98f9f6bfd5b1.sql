
CREATE POLICY "Users can update their palco reactions" ON public.palco_likes FOR UPDATE USING (auth.uid() = user_id);
