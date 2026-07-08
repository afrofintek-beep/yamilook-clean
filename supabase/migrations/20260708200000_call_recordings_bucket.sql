-- Storage bucket for full call recordings (composited video + mixed audio,
-- uploaded by the initiator). Private; other participants read via signed URLs.
insert into storage.buckets (id, name, public, file_size_limit)
values ('call-recordings', 'call-recordings', false, 524288000)
on conflict (id) do nothing;

drop policy if exists "call rec insert own" on storage.objects;
create policy "call rec insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'call-recordings');

drop policy if exists "call rec select own" on storage.objects;
create policy "call rec select own" on storage.objects for select to authenticated
  using (bucket_id = 'call-recordings' and owner = auth.uid());

drop policy if exists "call rec delete own" on storage.objects;
create policy "call rec delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'call-recordings' and owner = auth.uid());
