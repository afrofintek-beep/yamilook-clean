-- Per-member read cursor for a conversa (last time they saw the chat), for
-- sent (✓) vs read (✓✓) receipts in the Mokubico conversa chat.
create table if not exists public.mokubico_conversa_reads (
  conversa_id uuid not null references public.mokubico_conversas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversa_id, user_id)
);
alter table public.mokubico_conversa_reads enable row level security;
create policy "Members see conversa reads" on public.mokubico_conversa_reads
  for select to authenticated
  using (public.mokubico_conversa_host(conversa_id) = auth.uid() or public.mokubico_is_guest(conversa_id, auth.uid()));
create policy "Update own read cursor" on public.mokubico_conversa_reads
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (public.mokubico_conversa_host(conversa_id) = auth.uid() or public.mokubico_is_guest(conversa_id, auth.uid())));
alter publication supabase_realtime add table public.mokubico_conversa_reads;
