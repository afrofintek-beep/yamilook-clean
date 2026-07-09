-- Restrict live visibility to the host's banda.
--
-- Lives were fully public ("Anyone can view live or ended sessions"): every
-- user saw every live in the "Bandas ao vivo" rail and could open the URL. A
-- live on the banda's stage should only be visible to that banda. You can see a
-- session if you are the host, or you share an active banda with the host.

drop policy if exists "Anyone can view live or ended sessions" on public.live_sessions;

-- You can view a session if you are the host, or (for live/ended sessions) you
-- share an active banda with the host. Fallback: if the host has no active
-- banda, the session stays public so they aren't left without any audience.
create policy "Banda members can view sessions" on public.live_sessions
  for select to authenticated
  using (
    auth.uid() = host_id
    or (
      status = any (array['live', 'ended'])
      and (
        exists (
          select 1
          from public.user_bandas ub_host
          join public.user_bandas ub_me on ub_me.banda_id = ub_host.banda_id
          where ub_host.user_id = live_sessions.host_id and ub_host.is_active
            and ub_me.user_id = auth.uid() and ub_me.is_active
        )
        or not exists (
          select 1 from public.user_bandas ub_h
          where ub_h.user_id = live_sessions.host_id and ub_h.is_active
        )
      )
    )
  );
