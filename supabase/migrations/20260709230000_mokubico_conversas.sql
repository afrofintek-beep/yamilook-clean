-- MOKUBICO "Conversa": a free, convivial voice+text room, separate from the
-- paid palco/roda (vozes) system. The host picks the individual people who may
-- join (chosen-group model) — access is a per-conversa guest list, not pricing.

create table if not exists public.mokubico_conversas (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  banda_id uuid,
  space text not null,                    -- quintal | sala | cozinha | quarto
  title text,
  livekit_room_name text not null unique, -- 'mok-<host>-<ts>'
  status text not null default 'live' check (status in ('live', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mokubico_conversas_space_idx on public.mokubico_conversas (space, status);
create index if not exists mokubico_conversas_host_idx on public.mokubico_conversas (host_id);

-- The chosen individuals allowed into a conversa.
create table if not exists public.mokubico_conversa_guests (
  conversa_id uuid not null references public.mokubico_conversas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversa_id, user_id)
);

create index if not exists mokubico_conversa_guests_user_idx on public.mokubico_conversa_guests (user_id);

alter table public.mokubico_conversas enable row level security;
alter table public.mokubico_conversa_guests enable row level security;

-- Conversas: host manages; host or an invited guest may read a live/ended one.
create policy "Host manages own conversas" on public.mokubico_conversas
  for all to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy "Guests view invited conversas" on public.mokubico_conversas
  for select to authenticated
  using (
    status = any (array['live', 'ended'])
    and exists (
      select 1 from public.mokubico_conversa_guests g
      where g.conversa_id = mokubico_conversas.id and g.user_id = auth.uid()
    )
  );

-- Guests: the conversa host manages the list; a user can see their own entry.
create policy "Host manages conversa guests" on public.mokubico_conversa_guests
  for all to authenticated
  using (exists (select 1 from public.mokubico_conversas c where c.id = conversa_id and c.host_id = auth.uid()))
  with check (exists (select 1 from public.mokubico_conversas c where c.id = conversa_id and c.host_id = auth.uid()));

create policy "Guest sees own invite" on public.mokubico_conversa_guests
  for select to authenticated
  using (user_id = auth.uid());

-- Authoritative join check for the token function (host or invited guest).
create or replace function public.can_join_mokubico_room(p_room text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_id uuid;
  v_host uuid;
  v_uid uuid := auth.uid();
  v_is_host boolean;
  v_allowed boolean;
begin
  select id, host_id into v_id, v_host
  from public.mokubico_conversas
  where livekit_room_name = p_room
  order by started_at desc nulls last
  limit 1;

  if v_id is null then
    return jsonb_build_object('allowed', false, 'reason', 'no_conversa');
  end if;

  v_is_host := (v_uid = v_host);
  v_allowed := v_is_host
    or exists (
      select 1 from public.mokubico_conversa_guests g
      where g.conversa_id = v_id and g.user_id = v_uid
    );

  return jsonb_build_object('allowed', v_allowed, 'is_host', v_is_host, 'conversa_id', v_id);
end;
$$;
