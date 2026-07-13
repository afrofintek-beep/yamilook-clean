-- ============================================================================
-- Anti-lavagem #3 (conluio): controlos que funcionam com os dados existentes.
-- ----------------------------------------------------------------------------
-- Vetor que sobra depois do saldo comprado/ganho: comprar → pagar um cúmplice
-- (sessão falsa) → o cúmplice, que "ganhou", faz payout. Estes controlos
-- reduzem a viabilidade e o débito dessa lavagem:
--   • academia_complete só paga sessões que JÁ ACONTECERAM (mata a sessão
--     criada+reservada+concluída na hora).
--   • academia_reserve: teto por par aluno↔mentor (limita o caudal por dupla)
--     e bloqueio de fluxo circular (A paga B e B paga A).
-- (Deteção por dispositivo fica para quando device_sessions for populado —
--  hoje está vazio.)
-- Parâmetros: teto 5 sessões pagas/30d por par · janela circular 30 dias.
-- ============================================================================

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

  -- ── Anti-conluio (só em sessões PAGAS, onde há movimento de dinheiro) ──────
  if v_price > 0 then
    -- teto por par: quantas sessões pagas deste aluno para este mentor em 30 dias
    if (select count(*) from public.academia_reservations r
          join public.academia_sessions s on s.id = r.session_id
         where s.mentor_id = v_mentor and r.user_id = v_uid
           and coalesce(s.price_coins,0) > 0 and r.created_at > now() - interval '30 days') >= v_pair_cap then
      return jsonb_build_object('ok', false, 'reason', 'pair_limit');
    end if;
    -- fluxo circular: este mentor já me pagou a MIM (eu como mentor) nos últimos 30 dias?
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

-- ── Concluir: só paga sessões que JÁ ACONTECERAM (anti sessão-fantasma) ─────
create or replace function public.academia_complete(p_session uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid(); v_mentor uuid; v_title text; v_when timestamptz;
  v_fee int; v_total int := 0; v_paid int := 0; r record; v_amt int; v_bal int; v_has_paid boolean;
begin
  select mentor_id, title, scheduled_at into v_mentor, v_title, v_when
    from public.academia_sessions where id = p_session;
  if v_mentor is null then return jsonb_build_object('ok', false, 'reason', 'no_session'); end if;
  if v_uid <> v_mentor and not public.has_role(v_uid, 'admin') then return jsonb_build_object('ok', false, 'reason', 'not_allowed'); end if;

  -- Se há reservas PAGAS, a sessão tem de já ter acontecido para pagar o mentor.
  select exists (select 1 from public.academia_reservations where session_id = p_session and status = 'reserved' and price_paid > 0)
    into v_has_paid;
  -- Bypass só para um admin que NÃO é o mentor (suporte). O próprio mentor —
  -- mesmo sendo admin — está sujeito ao gate temporal na sua própria sessão.
  if v_has_paid and (v_when is null or v_when > now())
     and not (public.has_role(v_uid, 'admin') and v_uid <> v_mentor) then
    return jsonb_build_object('ok', false, 'reason', 'too_early');
  end if;

  select coalesce(academia_fee_percent, 15) into v_fee from public.billing_config where id = 1;

  for r in select id, price_paid from public.academia_reservations where session_id = p_session and status = 'reserved' loop
    v_amt := floor(r.price_paid * (100 - v_fee) / 100.0)::int;
    if v_amt > 0 then
      update public.profiles
        set kumbu_available = coalesce(kumbu_available,0) + v_amt,
            kumbu_earned = coalesce(kumbu_earned,0) + v_amt,
            kumbu_lifetime = coalesce(kumbu_lifetime,0) + v_amt, updated_at = now()
        where id = v_mentor returning kumbu_available into v_bal;
      insert into public.kumbu_ledger(user_id, amount, action_type, source, reference_id, description, balance_after)
      values (v_mentor, v_amt, 'earn', 'academia_income', p_session, 'Sessão dada: ' || coalesce(v_title,''), v_bal);
      v_paid := v_paid + v_amt;
    end if;
    update public.academia_reservations set status = 'attended' where id = r.id;
    v_total := v_total + 1;
  end loop;

  update public.academia_sessions set status = 'completed', updated_at = now() where id = p_session;
  return jsonb_build_object('ok', true, 'reservations', v_total, 'paid_to_mentor', v_paid, 'fee_percent', v_fee);
end;
$$;

notify pgrst, 'reload schema';
