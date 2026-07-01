-- Make media bucket public for read access (videos need to be publicly viewable)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'media';