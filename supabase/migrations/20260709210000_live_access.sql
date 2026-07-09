-- Guest access to banda-restricted lives: the host can pre-authorize people,
-- and non-banda users can request to join (host approves). Access to actually
-- JOIN is enforced by can_join_live_room(), called from the token function.

create table if not exists public.live_access (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create index if not exists live_access_session_idx on public.live_access (session_id, status);
create index if not exists live_access_user_idx on public.live_access (user_id);

alter table public.live_access enable row level security;

-- The host of the session manages all access rows for that session.
create policy "Host manages live access" on public.live_access
  for all to authenticated
  using (exists (select 1 from public.live_sessions s where s.id = session_id and s.host_id = auth.uid()))
  with check (exists (select 1 from public.live_sessions s where s.id = session_id and s.host_id = auth.uid()));

-- A user can see their own access row (to know if they were approved).
create policy "Guest sees own access" on public.live_access
  for select to authenticated
  using (user_id = auth.uid());

-- A user can create their own pending request (they only need the session id
-- from the URL — no need to read the restricted session first).
create policy "Guest requests access" on public.live_access
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- Extend live visibility: approved guests can also read the session.
drop policy if exists "Banda members can view sessions" on public.live_sessions;
create policy "Banda members can view sessions" on public.live_sessions
  for select to authenticated
  using (
    auth.uid() = host_id
    or (
      status = any (array['live', 'ended'])
      and (
        exists (
          select 1 from public.user_bandas ub_host
          join public.user_bandas ub_me on ub_me.banda_id = ub_host.banda_id
          where ub_host.user_id = live_sessions.host_id and ub_host.is_active
            and ub_me.user_id = auth.uid() and ub_me.is_active
        )
        or not exists (
          select 1 from public.user_bandas ub_h
          where ub_h.user_id = live_sessions.host_id and ub_h.is_active
        )
        or exists (
          select 1 from public.live_access la
          where la.session_id = live_sessions.id and la.user_id = auth.uid() and la.status = 'approved'
        )
      )
    )
  );

-- Authoritative join check (definer: sees past RLS). Returns whether the caller
-- may join the room, plus whether they are the host (so the token grants
-- publish rights based on the DB, not a client flag).
create or replace function public.can_join_live_room(p_room text)
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
  from public.live_sessions
  where livekit_room_name = p_room
  order by started_at desc nulls last
  limit 1;

  if v_id is null then
    return jsonb_build_object('allowed', false, 'reason', 'no_session');
  end if;

  v_is_host := (v_uid = v_host);
  v_allowed := v_is_host
    or exists (
      select 1 from public.user_bandas uh
      join public.user_bandas um on um.banda_id = uh.banda_id
      where uh.user_id = v_host and uh.is_active
        and um.user_id = v_uid and um.is_active
    )
    or not exists (select 1 from public.user_bandas x where x.user_id = v_host and x.is_active)
    or exists (
      select 1 from public.live_access la
      where la.session_id = v_id and la.user_id = v_uid and la.status = 'approved'
    );

  return jsonb_build_object('allowed', v_allowed, 'is_host', v_is_host, 'session_id', v_id);
end;
$$;
