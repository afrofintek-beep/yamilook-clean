
-- 1) Roda recordings: scope storage policies to owner (folder = uid)
DROP POLICY IF EXISTS "Authenticated users can view recordings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update recordings" ON storage.objects;
DROP POLICY IF EXISTS "Guides can delete their recordings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload recordings" ON storage.objects;

CREATE POLICY "roda_recordings_select_owner" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'roda-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "roda_recordings_insert_owner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'roda-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "roda_recordings_update_owner" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'roda-recordings' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'roda-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "roda_recordings_delete_owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'roda-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2) Bandas: replace permissive insert (WITH CHECK true) with admin-only.
--    Bandas table has no owner column; restrict creation to admins to prevent abuse.
DROP POLICY IF EXISTS "Authenticated users can create bandas" ON public.bandas;
CREATE POLICY "Admins can create bandas" ON public.bandas
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) public_profiles view: switch to security_invoker so caller RLS applies
ALTER VIEW public.public_profiles SET (security_invoker = on);
