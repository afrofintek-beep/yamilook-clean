
-- Fix: Add INSERT and UPDATE policies for roda-recordings bucket
-- The upload path is: {palcoId}/{rodaId}/{recordingId}.webm
-- We need to allow authenticated users (hosts) to upload recordings

CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'roda-recordings'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update recordings"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'roda-recordings'
  AND auth.role() = 'authenticated'
);

-- Also fix the SELECT policy to allow any authenticated user to view (not just by folder name)
DROP POLICY IF EXISTS "Guides can view their recordings" ON storage.objects;
CREATE POLICY "Authenticated users can view recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'roda-recordings'
  AND auth.role() = 'authenticated'
);

-- Fix DELETE policy similarly
DROP POLICY IF EXISTS "Guides can delete their recordings" ON storage.objects;
CREATE POLICY "Guides can delete their recordings"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'roda-recordings'
  AND auth.role() = 'authenticated'
);
