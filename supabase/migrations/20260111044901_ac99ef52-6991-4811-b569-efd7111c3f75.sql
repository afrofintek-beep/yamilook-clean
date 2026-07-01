-- Create storage bucket for chat wallpapers
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-wallpapers', 'chat-wallpapers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own wallpapers
CREATE POLICY "Users can upload their own wallpapers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-wallpapers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own wallpapers
CREATE POLICY "Users can view their own wallpapers"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-wallpapers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own wallpapers
CREATE POLICY "Users can delete their own wallpapers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-wallpapers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access since bucket is public
CREATE POLICY "Public wallpaper read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-wallpapers');