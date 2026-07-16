-- Restaura as políticas RLS de storage.objects perdidas na migração Lovable→Supabase próprio.
-- O restauro data-only do storage trouxe buckets+objects mas NENHUMA política; sem política de
-- INSERT, qualquer upload (posts com foto/vídeo, avatares, status, etc.) é negado pelo RLS e a
-- publicação falha. Recria o estado final das políticas conforme as migrações originais.
-- (creator-documents e call-recordings já foram recriadas em migrações posteriores — não tocar.)

-- ===== media (posts com foto/vídeo) =====
drop policy if exists "Authenticated users can upload media" on storage.objects;
create policy "Authenticated users can upload media"
on storage.objects for insert
with check (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated users can view media" on storage.objects;
create policy "Authenticated users can view media"
on storage.objects for select
using (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "Users can delete own media" on storage.objects;
create policy "Users can delete own media"
on storage.objects for delete
using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== avatars =====
drop policy if exists "Anyone can view avatars" on storage.objects;
create policy "Anyone can view avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ===== status-media =====
drop policy if exists "Authenticated users can upload status media" on storage.objects;
create policy "Authenticated users can upload status media"
on storage.objects for insert
with check (bucket_id = 'status-media' and auth.role() = 'authenticated');

drop policy if exists "Anyone can view status media" on storage.objects;
create policy "Anyone can view status media"
on storage.objects for select
using (bucket_id = 'status-media');

drop policy if exists "Users can delete own status media" on storage.objects;
create policy "Users can delete own status media"
on storage.objects for delete
using (bucket_id = 'status-media' and (auth.uid())::text = (storage.foldername(name))[1]);

drop policy if exists "Users can update own status media" on storage.objects;
create policy "Users can update own status media"
on storage.objects for update
using (bucket_id = 'status-media' and (auth.uid())::text = (storage.foldername(name))[1]);

-- ===== highlights =====
drop policy if exists "Anyone can view highlight images" on storage.objects;
create policy "Anyone can view highlight images"
  on storage.objects for select
  using (bucket_id = 'highlights');

drop policy if exists "Users can upload highlight images" on storage.objects;
create policy "Users can upload highlight images"
  on storage.objects for insert
  with check (bucket_id = 'highlights' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can update their highlight images" on storage.objects;
create policy "Users can update their highlight images"
  on storage.objects for update
  using (bucket_id = 'highlights' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete their highlight images" on storage.objects;
create policy "Users can delete their highlight images"
  on storage.objects for delete
  using (bucket_id = 'highlights' and auth.uid()::text = (storage.foldername(name))[1]);

-- ===== palco-covers =====
drop policy if exists "Users can upload palco covers" on storage.objects;
create policy "Users can upload palco covers"
on storage.objects for insert
to authenticated
with check (bucket_id = 'palco-covers');

drop policy if exists "Public can view palco covers" on storage.objects;
create policy "Public can view palco covers"
on storage.objects for select
to public
using (bucket_id = 'palco-covers');

drop policy if exists "Users can update own palco covers" on storage.objects;
create policy "Users can update own palco covers"
on storage.objects for update
to authenticated
using (bucket_id = 'palco-covers');

drop policy if exists "Users can delete own palco covers" on storage.objects;
create policy "Users can delete own palco covers"
on storage.objects for delete
to authenticated
using (bucket_id = 'palco-covers');

-- ===== chat-wallpapers =====
drop policy if exists "Users can upload their own wallpapers" on storage.objects;
create policy "Users can upload their own wallpapers"
on storage.objects for insert
to authenticated
with check (bucket_id = 'chat-wallpapers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can view their own wallpapers" on storage.objects;
create policy "Users can view their own wallpapers"
on storage.objects for select
to authenticated
using (bucket_id = 'chat-wallpapers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own wallpapers" on storage.objects;
create policy "Users can delete their own wallpapers"
on storage.objects for delete
to authenticated
using (bucket_id = 'chat-wallpapers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Public wallpaper read access" on storage.objects;
create policy "Public wallpaper read access"
on storage.objects for select
to public
using (bucket_id = 'chat-wallpapers');

-- ===== voice-messages =====
drop policy if exists "Authenticated users can upload voice messages" on storage.objects;
create policy "Authenticated users can upload voice messages"
on storage.objects for insert
with check (
  bucket_id = 'voice-messages'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated users can view voice messages" on storage.objects;
create policy "Authenticated users can view voice messages"
on storage.objects for select
using (bucket_id = 'voice-messages' and auth.role() = 'authenticated');

drop policy if exists "Users can delete own voice messages" on storage.objects;
create policy "Users can delete own voice messages"
on storage.objects for delete
using (bucket_id = 'voice-messages' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== roda-recordings (estado final = owner-scoped, migração 20260521224224) =====
drop policy if exists "roda_recordings_select_owner" on storage.objects;
create policy "roda_recordings_select_owner" on storage.objects
  for select to authenticated
  using (bucket_id = 'roda-recordings' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "roda_recordings_insert_owner" on storage.objects;
create policy "roda_recordings_insert_owner" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'roda-recordings' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "roda_recordings_update_owner" on storage.objects;
create policy "roda_recordings_update_owner" on storage.objects
  for update to authenticated
  using (bucket_id = 'roda-recordings' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'roda-recordings' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "roda_recordings_delete_owner" on storage.objects;
create policy "roda_recordings_delete_owner" on storage.objects
  for delete to authenticated
  using (bucket_id = 'roda-recordings' and (storage.foldername(name))[1] = auth.uid()::text);
