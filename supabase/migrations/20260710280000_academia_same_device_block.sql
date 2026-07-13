-- ============================================================================
-- Anti-lavagem #3b: bloquear transações entre contas no MESMO dispositivo.
-- ----------------------------------------------------------------------------
-- Apanha o caso comum de conluio: a mesma pessoa com duas contas (aluno e
-- mentor) no mesmo telemóvel/navegador. O cliente regista um fingerprint
-- estável (localStorage) em device_sessions no login; se aluno e mentor
-- partilham fingerprint, a reserva paga é bloqueada.
-- Limite honesto: sinal fraco (fingerprint por navegador, apagável; dois
-- dispositivos escapam) — é uma camada, não uma barreira absoluta.
-- ============================================================================

alter table public.device_sessions add column if not exists fingerprint text;
create index if not exists device_sessions_fingerprint_idx on public.device_sessions (fingerprint);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'device_sessions_user_fp_uniq') then
    alter table public.device_sessions add constraint device_sessions_user_fp_uniq unique (user_id, fingerprint);
  end if;
end $$;

-- Dois utilizadores partilham dispositivo? (bypassa RLS)
create or replace function public.users_share_device(a uuid, b uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select a <> b and exists (
    select 1 from public.device_sessions da
    join public.device_sessions db2 on db2.fingerprint = da.fingerprint
    where da.user_id = a and db2.user_id = b and da.fingerprint is not null
  );
$$;
grant execute on function public.users_share_device(uuid, uuid) to authenticated;

-- academia_reserve: + bloqueio mesmo-dispositivo (em sessões pagas).
create or replace function public.academia_reserve(p_session uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid();
  v_mentor uuid; v_price int; v_spots int; v_when timestamptz; v_status text; v_title text;
  v_spend json; v_pair_cap constant int := 5;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;

  select mentor_id, coalesce(price_coins,0), spots_left, scheduled_at, status, title
    into v_mentor, v_price, v_spots, v_when, v_status, v_title
    from public.academia_sessions where id = p_session for update;
  if v_mentor is null then return jsonb_build_object('ok', false, 'reason', 'no_session'); end if;
  if v_mentor = v_uid then return jsonb_build_object('ok', false, 'reason', 'own_session'); end if;
  if v_status in ('ended','completed','cancelled') then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  if v_when is not null and v_when < now() then return jsonb_build_object('ok', false, 'reason', 'past'); end if;
  if coalesce(v_spots,0) <= 0 then return jsonb_build_object('ok', false, 'reason', 'full'); end if;
  if exists (select 1 from public.academia_reservations where session_id = p_session and user_id = v_uid) then
    return jsonb_build_object('ok', false, 'reason', 'already');
  end if;

  if v_price > 0 then
    -- mesmo dispositivo que o mentor → conluio provável
    if public.users_share_device(v_uid, v_mentor) then
      return jsonb_build_object('ok', false, 'reason', 'same_device');
    end if;
    -- teto por par aluno↔mentor (30 dias)
    if (select count(*) from public.academia_reservations r
          join public.academia_sessions s on s.id = r.session_id
         where s.mentor_id = v_mentor and r.user_id = v_uid
           and coalesce(s.price_coins,0) > 0 and r.created_at > now() - interval '30 days') >= v_pair_cap then
      return jsonb_build_object('ok', false, 'reason', 'pair_limit');
    end if;
    -- fluxo circular (A paga B e B paga A)
    if exists (select 1 from public.academia_reservations r
                 join public.academia_sessions s on s.id = r.session_id
                where s.mentor_id = v_uid and r.user_id = v_mentor
                  and coalesce(s.price_coins,0) > 0 and r.created_at > now() - interval '30 days') then
      return jsonb_build_object('ok', false, 'reason', 'circular');
    end if;
  end if;

  insert into public.academia_reservations(session_id, user_id, status, price_paid)
  values (p_session, v_uid, 'reserved', v_price);

  if v_price > 0 then
    v_spend := public.kumbu_spend(v_price, 'spend', 'academia', p_session, 'Reserva: ' || coalesce(v_title,''));
    if not coalesce((v_spend->>'success')::boolean, false) then
      delete from public.academia_reservations where session_id = p_session and user_id = v_uid;
      return jsonb_build_object('ok', false, 'reason', 'insufficient');
    end if;
  end if;

  return jsonb_build_object('ok', true, 'available', (v_spend->>'available'));
end;
$$;

notify pgrst, 'reload schema';
