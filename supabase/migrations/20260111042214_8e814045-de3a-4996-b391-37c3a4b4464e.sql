-- Make status-media bucket public so statuses can be viewed
UPDATE storage.buckets SET public = true WHERE id = 'status-media';

-- Create RLS policies for status-media bucket
CREATE POLICY "Authenticated users can upload status media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'status-media' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view status media"
ON storage.objects FOR SELECT
USING (bucket_id = 'status-media');

CREATE POLICY "Users can delete own status media"
ON storage.objects FOR DELETE
USING (bucket_id = 'status-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own status media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'status-media' AND (auth.uid())::text = (storage.foldername(name))[1]);