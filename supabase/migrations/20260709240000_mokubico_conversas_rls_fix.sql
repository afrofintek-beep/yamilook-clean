-- Fix: the mokubico_conversas and mokubico_conversa_guests SELECT/ALL policies
-- referenced each other's table, so Postgres recursed evaluating RLS ("infinite
-- recursion detected in policy") and every insert/select failed. Break the cycle
-- with SECURITY DEFINER helpers that read the other table without re-triggering RLS.

create or replace function public.mokubico_conversa_host(p_conversa uuid)
returns uuid language sql security definer stable set search_path to 'public' as $$
  select host_id from public.mokubico_conversas where id = p_conversa;
$$;

create or replace function public.mokubico_is_guest(p_conversa uuid, p_user uuid)
returns boolean language sql security definer stable set search_path to 'public' as $$
  select exists(select 1 from public.mokubico_conversa_guests where conversa_id = p_conversa and user_id = p_user);
$$;

drop policy if exists "Guests view invited conversas" on public.mokubico_conversas;
create policy "Guests view invited conversas" on public.mokubico_conversas
  for select to authenticated
  using (status = any (array['live', 'ended']) and public.mokubico_is_guest(id, auth.uid()));

drop policy if exists "Host manages conversa guests" on public.mokubico_conversa_guests;
create policy "Host manages conversa guests" on public.mokubico_conversa_guests
  for all to authenticated
  using (public.mokubico_conversa_host(conversa_id) = auth.uid())
  with check (public.mokubico_conversa_host(conversa_id) = auth.uid());
