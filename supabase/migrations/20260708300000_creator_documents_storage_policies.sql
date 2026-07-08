-- Storage RLS for the private `creator-documents` bucket.
--
-- The original policies (migration 20260301073551) were never applied to the
-- live database, so uploading a BI during a creator application failed with
-- "new row violates row-level security policy". This re-applies them
-- idempotently: each user may only write to / read their own folder
-- (`{user_id}/…`), and admins may read every document for review.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users upload own docs'
  ) then
    create policy "Users upload own docs" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'creator-documents' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users read own docs'
  ) then
    create policy "Users read own docs" on storage.objects
      for select to authenticated
      using (bucket_id = 'creator-documents' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Admins read all creator docs'
  ) then
    create policy "Admins read all creator docs" on storage.objects
      for select to authenticated
      using (bucket_id = 'creator-documents' and public.has_role(auth.uid(), 'admin'));
  end if;
end $$;
