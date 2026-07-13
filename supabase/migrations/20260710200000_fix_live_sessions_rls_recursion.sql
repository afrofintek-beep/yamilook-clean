-- ============================================================================
-- Fix: recursão infinita nas políticas RLS de live_sessions ↔ live_access.
-- ----------------------------------------------------------------------------
-- A política SELECT de live_sessions consultava live_access, e a política de
-- live_access ("Host manages") consultava live_sessions → cada uma disparava a
-- RLS da outra em ciclo ("infinite recursion detected in policy for relation
-- live_sessions"), o que fazia o INSERT/SELECT ao abrir uma live rebentar.
-- Introduzido com o live_access (20260709210000); por isso as lives anteriores
-- funcionavam e as posteriores falhavam ao arrancar.
--
-- Solução (igual ao fix do Mokubico): as referências CRUZADAS entre as duas
-- tabelas passam por funções SECURITY DEFINER, que NÃO reavaliam a RLS da outra
-- tabela — quebrando o ciclo.
-- ============================================================================

-- host de uma sessão, sem passar pela RLS de live_sessions
create or replace function public.live_session_host_id(p_session uuid)
returns uuid language sql stable security definer set search_path to 'public' as $$
  select host_id from public.live_sessions where id = p_session;
$$;

-- convidado aprovado de uma sessão, sem passar pela RLS de live_access
create or replace function public.is_approved_live_guest(p_session uuid, p_user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.live_access
     where session_id = p_session and user_id = p_user and status = 'approved'
  );
$$;

grant execute on function public.live_session_host_id(uuid) to authenticated;
grant execute on function public.is_approved_live_guest(uuid, uuid) to authenticated;

-- ── live_access: host deixa de consultar live_sessions diretamente ──────────
drop policy if exists "Host manages live access" on public.live_access;
create policy "Host manages live access" on public.live_access
  for all
  using (public.live_session_host_id(session_id) = auth.uid())
  with check (public.live_session_host_id(session_id) = auth.uid());

-- ── live_sessions: a verificação de convidado aprovado passa a ser definer ──
drop policy if exists "Banda members can view sessions" on public.live_sessions;
create policy "Banda members can view sessions" on public.live_sessions
  for select using (
    auth.uid() = host_id
    or (
      status = any (array['live','ended'])
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
        or public.is_approved_live_guest(live_sessions.id, auth.uid())
      )
    )
  );

notify pgrst, 'reload schema';
