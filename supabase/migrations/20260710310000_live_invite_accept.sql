-- ============================================================================
-- Live — convite com ACEITAÇÃO (não entrada directa).
-- ----------------------------------------------------------------------------
-- O "Convidar" do anfitrião passava a pessoa logo a 'approved' (entrava direto).
-- Agora cria o estado 'invited': a pessoa recebe o convite e, ao ACEITAR,
-- passa a 'approved' e entra. can_join_live_room já só deixa 'approved' entrar,
-- por isso 'invited' fica bloqueado até aceitar.
-- ============================================================================

-- O check de status não permitia 'invited'. Estender.
alter table public.live_access drop constraint if exists live_access_status_check;
alter table public.live_access add constraint live_access_status_check
  check (status = any (array['pending','approved','denied','invited']));

-- Anfitrião convida (status 'invited'). Não faz downgrade de quem já é approved.
create or replace function public.live_invite(p_session uuid, p_user_ids uuid[])
returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if public.live_session_host_id(p_session) <> auth.uid() then
    raise exception 'not_host';
  end if;
  insert into public.live_access (session_id, user_id, status)
    select p_session, u, 'invited' from unnest(p_user_ids) as u
  on conflict (session_id, user_id) do update
    set status = case when public.live_access.status = 'approved' then 'approved' else 'invited' end,
        updated_at = now();
  return jsonb_build_object('ok', true, 'invited', coalesce(array_length(p_user_ids, 1), 0));
end;
$$;

-- Convidado aceita (invited → approved).
create or replace function public.live_accept_invite(p_session uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_n int;
begin
  update public.live_access set status = 'approved', updated_at = now()
   where session_id = p_session and user_id = v_uid and status = 'invited';
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', v_n > 0);
end;
$$;

-- Convidado recusa (invited → denied).
create or replace function public.live_decline_invite(p_session uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid();
begin
  update public.live_access set status = 'denied', updated_at = now()
   where session_id = p_session and user_id = v_uid and status = 'invited';
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.live_invite(uuid, uuid[]) to authenticated;
grant execute on function public.live_accept_invite(uuid) to authenticated;
grant execute on function public.live_decline_invite(uuid) to authenticated;

notify pgrst, 'reload schema';
