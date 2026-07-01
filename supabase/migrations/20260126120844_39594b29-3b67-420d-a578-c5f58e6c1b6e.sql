-- Create storage bucket for palco covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('palco-covers', 'palco-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own covers
CREATE POLICY "Users can upload palco covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'palco-covers');

-- Allow public read access to covers
CREATE POLICY "Public can view palco covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'palco-covers');

-- Allow users to update their own covers
CREATE POLICY "Users can update own palco covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'palco-covers');

-- Allow users to delete their own covers
CREATE POLICY "Users can delete own palco covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'palco-covers');