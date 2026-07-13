-- ============================================================================
-- Academia — economia: reserva atómica que PAGA o mentor + verificação de mentor.
-- ----------------------------------------------------------------------------
-- Bug corrigido: reservar debitava o aluno (kumbu_spend) mas NUNCA creditava o
-- mentor → o Kumbu evaporava-se. Passa a marketplace com escrow:
--   • reservar  → cobra o aluno (Kumbu retido pela plataforma). Atómico, com
--     guardas (não é a própria sessão / cheia / passada / já reservada).
--   • completar → o mentor recebe (preço − comissão) quando dá a sessão.
--   • cancelar  → o aluno é reembolsado (antes de concluída).
-- Mentor é creditado DIRETAMENTE (kumbu_award tem teto diário de 40, para
-- gamificação — não serve para rendimento). Comissão em billing_config.
-- ============================================================================

alter table public.academia_reservations add column if not exists status text not null default 'reserved';
alter table public.academia_reservations add column if not exists price_paid int not null default 0;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'academia_reservations_uniq') then
    alter table public.academia_reservations add constraint academia_reservations_uniq unique (session_id, user_id);
  end if;
end $$;

alter table public.billing_config add column if not exists academia_fee_percent int not null default 15;

-- ── Reservar (atómico, cobra o aluno) ───────────────────────────────────────
create or replace function public.academia_reserve(p_session uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid();
  v_mentor uuid; v_price int; v_spots int; v_when timestamptz; v_status text; v_title text;
  v_spend json;
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

  -- inserir primeiro (trigger desconta a vaga; unique trava corrida)
  insert into public.academia_reservations(session_id, user_id, status, price_paid)
  values (p_session, v_uid, 'reserved', v_price);

  -- cobrar (sessão gratuita = price 0, salta)
  if v_price > 0 then
    v_spend := public.kumbu_spend(v_price, 'spend', 'academia', p_session, 'Reserva: ' || coalesce(v_title,''));
    if not coalesce((v_spend->>'success')::boolean, false) then
      delete from public.academia_reservations where session_id = p_session and user_id = v_uid; -- devolve a vaga
      return jsonb_build_object('ok', false, 'reason', 'insufficient');
    end if;
  end if;

  return jsonb_build_object('ok', true, 'available', (v_spend->>'available'));
end;
$$;

-- ── Cancelar (reembolsa o aluno) ────────────────────────────────────────────
create or replace function public.academia_cancel(p_session uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_status text; v_refund json;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  select status into v_status from public.academia_reservations where session_id = p_session and user_id = v_uid;
  if v_status is null then return jsonb_build_object('ok', false, 'reason', 'not_reserved'); end if;
  if v_status = 'attended' then return jsonb_build_object('ok', false, 'reason', 'already_attended'); end if;

  delete from public.academia_reservations where session_id = p_session and user_id = v_uid; -- trigger repõe a vaga
  v_refund := public.kumbu_refund(p_session, 'academia', 'Reembolso: reserva cancelada');
  return jsonb_build_object('ok', true, 'refunded', coalesce((v_refund->>'refunded')::int, 0), 'available', (v_refund->>'available'));
end;
$$;

-- ── Completar (paga o mentor; só o mentor ou admin) ─────────────────────────
create or replace function public.academia_complete(p_session uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid(); v_mentor uuid; v_title text; v_fee int; v_total int := 0; v_paid int := 0; r record; v_amt int; v_bal int;
begin
  select mentor_id, title into v_mentor, v_title from public.academia_sessions where id = p_session;
  if v_mentor is null then return jsonb_build_object('ok', false, 'reason', 'no_session'); end if;
  if v_uid <> v_mentor and not public.has_role(v_uid, 'admin') then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;

  select coalesce(academia_fee_percent, 15) into v_fee from public.billing_config where id = 1;

  for r in select id, price_paid from public.academia_reservations
           where session_id = p_session and status = 'reserved' loop
    v_amt := floor(r.price_paid * (100 - v_fee) / 100.0)::int;   -- mentor recebe preço − comissão
    if v_amt > 0 then
      -- crédito DIRETO ao mentor (sem o teto diário do kumbu_award)
      update public.profiles
        set kumbu_available = coalesce(kumbu_available,0) + v_amt,
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

-- ── Verificação de mentor (admin) ───────────────────────────────────────────
create or replace function public.admin_set_mentor_verified(p_user uuid, p_verified boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'not_admin'; end if;
  update public.mentor_profiles set is_verified_mentor = p_verified, updated_at = now() where user_id = p_user;
  return jsonb_build_object('ok', true, 'user_id', p_user, 'verified', p_verified);
end;
$$;

create or replace function public.admin_list_mentors()
returns table(user_id uuid, display_name text, username text, specialty text, is_verified_mentor boolean)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'not_admin'; end if;
  return query
    select mp.user_id, p.display_name, p.username, mp.specialty, mp.is_verified_mentor
      from public.mentor_profiles mp join public.profiles p on p.id = mp.user_id
     order by mp.is_verified_mentor asc, p.display_name;
end;
$$;

grant execute on function public.academia_reserve(uuid) to authenticated;
grant execute on function public.academia_cancel(uuid) to authenticated;
grant execute on function public.academia_complete(uuid) to authenticated;
grant execute on function public.admin_set_mentor_verified(uuid, boolean) to authenticated;
grant execute on function public.admin_list_mentors() to authenticated;

notify pgrst, 'reload schema';
