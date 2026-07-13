-- ============================================================================
-- Lives visíveis também aos AMIGOS do anfitrião (além da banda).
-- ----------------------------------------------------------------------------
-- Até agora uma live só era vista pela banda (bairro) do anfitrião. Um amigo
-- aceite fora dessa banda não a via. Passa a ver: visibilidade = banda OU amigo.
-- are_friends é SECURITY DEFINER (não reavalia RLS → sem recursão).
-- ============================================================================

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.friend_requests
     where status = 'accepted'
       and ((sender_id = a and receiver_id = b) or (sender_id = b and receiver_id = a))
  );
$$;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

drop policy if exists "Banda members can view sessions" on public.live_sessions;
create policy "Banda members can view sessions" on public.live_sessions
  for select using (
    auth.uid() = host_id
    or (
      status = any (array['live','ended'])
      and (
        -- mesma banda ativa do anfitrião
        exists (
          select 1 from public.user_bandas ub_host
          join public.user_bandas ub_me on ub_me.banda_id = ub_host.banda_id
          where ub_host.user_id = live_sessions.host_id and ub_host.is_active
            and ub_me.user_id = auth.uid() and ub_me.is_active
        )
        -- anfitrião sem banda → fallback público
        or not exists (
          select 1 from public.user_bandas ub_h
          where ub_h.user_id = live_sessions.host_id and ub_h.is_active
        )
        -- convidado aprovado
        or public.is_approved_live_guest(live_sessions.id, auth.uid())
        -- amigo aceite do anfitrião (novo)
        or public.are_friends(live_sessions.host_id, auth.uid())
      )
    )
  );

notify pgrst, 'reload schema';
