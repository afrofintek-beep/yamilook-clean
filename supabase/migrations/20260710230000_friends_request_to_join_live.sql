-- ============================================================================
-- Amigo fora da banda: VÊ a live mas PEDE para entrar (não entra automático).
-- ----------------------------------------------------------------------------
-- Ajuste de produto (dono): o amigo deve ver a live e pedir para entrar
-- mediante convite/aprovação, como um convidado — não juntar-se direto.
-- Reverte a entrada automática de amigos em can_join_live_room (20260710220000).
-- A VISIBILIDADE para amigos (20260710210000) mantém-se, para que possam ver e
-- clicar em "Pedir para entrar" (fluxo live_access, aprovado pelo anfitrião).
-- Entrar direto = host | mesma banda | anfitrião-sem-banda | convidado aprovado.
-- ============================================================================

create or replace function public.can_join_live_room(p_room text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_id uuid; v_host uuid; v_uid uuid := auth.uid(); v_is_host boolean; v_allowed boolean;
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
  -- NOTA: amigos NÃO entram direto — veem a live (RLS) e pedem para entrar
  -- (live_access pending → aprovação do anfitrião → passam a convidado aprovado).

  return jsonb_build_object('allowed', v_allowed, 'is_host', v_is_host, 'session_id', v_id);
end;
$$;

notify pgrst, 'reload schema';
