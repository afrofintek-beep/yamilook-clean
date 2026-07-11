-- Persistent text chat for a Mokubico conversa (the LiveKit data-channel version
-- was ephemeral — messages vanished on leave/rejoin). Access mirrors the conversa
-- (host or invited guest), via the definer helpers to avoid RLS recursion.

create table if not exists public.mokubico_messages (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.mokubico_conversas(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists mokubico_messages_conversa_idx on public.mokubico_messages (conversa_id, created_at);

alter table public.mokubico_messages enable row level security;

create policy "Access conversa messages" on public.mokubico_messages
  for select to authenticated
  using (
    public.mokubico_conversa_host(conversa_id) = auth.uid()
    or public.mokubico_is_guest(conversa_id, auth.uid())
  );

create policy "Send conversa messages" on public.mokubico_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      public.mokubico_conversa_host(conversa_id) = auth.uid()
      or public.mokubico_is_guest(conversa_id, auth.uid())
    )
  );

alter publication supabase_realtime add table public.mokubico_messages;
