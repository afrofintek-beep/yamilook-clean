-- ============================================================================
-- Anti-lavagem #1: separar Kumbu COMPRADO (só-gastar) de GANHO (levantável).
-- ----------------------------------------------------------------------------
-- Vetor eliminado: comprar Kumbu → fazer payout do próprio. Só se pode levantar
-- Kumbu GANHO com valor real entregue (sessões dadas, atividade). Kumbu comprado
-- (AppyPay/topup) fica spend-only.
-- Invariante: 0 <= kumbu_earned <= kumbu_available.
--   • topup (compra)      → só kumbu_available (não é levantável).
--   • award / academia    → available + earned (ganho, levantável).
--   • spend               → gasta o COMPRADO primeiro: earned = min(earned, novo_available).
--   • payout              → só até earned; debita available E earned.
-- Backfill conservador: earned=0 (saldos pré-existentes = não-levantáveis).
-- ============================================================================

alter table public.profiles add column if not exists kumbu_earned int not null default 0;
update public.profiles set kumbu_earned = 0 where kumbu_earned is null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_kumbu_earned_nonneg') then
    alter table public.profiles add constraint profiles_kumbu_earned_nonneg check (kumbu_earned >= 0);
  end if;
end $$;

-- ── Ganho por gamificação → também levantável ───────────────────────────────
create or replace function public.kumbu_award(p_user_id uuid, p_amount integer, p_action_type text, p_source text default null, p_reference_id uuid default null, p_description text default null)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  v_daily_total integer; v_daily_max integer := 40; v_action_count integer; v_action_limit integer;
  v_new_available integer; v_new_lifetime integer; v_new_level text;
begin
  if p_amount <= 0 then return json_build_object('success', false, 'error', 'Amount must be positive'); end if;
  if p_action_type != 'weekly_bonus' then
    select coalesce(sum(amount),0) into v_daily_total from public.kumbu_ledger
     where user_id=p_user_id and amount>0 and action_type!='weekly_bonus' and created_at>=current_date;
    if v_daily_total >= v_daily_max then return json_build_object('success', false, 'error', 'Daily earning limit reached (40 Kumbu)'); end if;
    if v_daily_total + p_amount > v_daily_max then p_amount := v_daily_max - v_daily_total; end if;
  end if;
  case p_action_type
    when 'roda_join' then v_action_limit:=3; select count(*) into v_action_count from public.kumbu_ledger where user_id=p_user_id and action_type='roda_join' and amount>0 and created_at>=current_date;
    when 'roda_create' then v_action_limit:=2; select count(*) into v_action_count from public.kumbu_ledger where user_id=p_user_id and action_type='roda_create' and amount>0 and created_at>=current_date;
    when 'academia_session' then v_action_limit:=1; select count(*) into v_action_count from public.kumbu_ledger where user_id=p_user_id and action_type='academia_session' and amount>0 and created_at>=current_date;
    when 'referral' then v_action_limit:=5; select count(*) into v_action_count from public.kumbu_ledger where user_id=p_user_id and action_type='referral' and amount>0 and created_at>=date_trunc('month',current_date);
    when 'post_create' then v_action_limit:=3; select count(*) into v_action_count from public.kumbu_ledger where user_id=p_user_id and action_type='post_create' and amount>0 and created_at>=current_date;
    else v_action_limit:=null; v_action_count:=0;
  end case;
  if v_action_limit is not null and v_action_count >= v_action_limit then
    return json_build_object('success', false, 'error', format('Action limit reached for %s', p_action_type));
  end if;

  update public.profiles
     set kumbu_available = kumbu_available + p_amount,
         kumbu_earned = kumbu_earned + p_amount,          -- ganho → levantável
         kumbu_lifetime = kumbu_lifetime + p_amount,
         level = case when kumbu_lifetime + p_amount >= 2000 then 'KOTA'
                      when kumbu_lifetime + p_amount >= 800 then 'Ouro'
                      when kumbu_lifetime + p_amount >= 200 then 'Prata' else 'Bronze' end,
         updated_at = now()
   where id = p_user_id
   returning kumbu_available, kumbu_lifetime, level into v_new_available, v_new_lifetime, v_new_level;

  insert into public.kumbu_ledger (user_id, amount, action_type, source, reference_id, description, balance_after)
  values (p_user_id, p_amount, p_action_type, p_source, p_reference_id, p_description, v_new_available);
  return json_build_object('success', true, 'awarded', p_amount, 'available', v_new_available, 'lifetime', v_new_lifetime, 'level', v_new_level);
end;
$function$;

-- ── Gasto → consome o COMPRADO primeiro (preserva o ganho/levantável) ───────
create or replace function public.kumbu_spend(p_amount integer, p_action_type text default 'spend', p_source text default null, p_reference_id uuid default null, p_description text default null)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare v_user_id uuid; v_current_balance integer; v_new_balance integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then return json_build_object('success', false, 'error', 'Not authenticated'); end if;
  if p_amount <= 0 then return json_build_object('success', false, 'error', 'Amount must be positive'); end if;
  select kumbu_available into v_current_balance from public.profiles where id = v_user_id for update;
  if v_current_balance is null then return json_build_object('success', false, 'error', 'Profile not found'); end if;
  if v_current_balance < p_amount then return json_build_object('success', false, 'error', 'Insufficient Kumbu balance'); end if;

  update public.profiles
     set kumbu_available = kumbu_available - p_amount,
         kumbu_earned = least(kumbu_earned, kumbu_available - p_amount),  -- comprado primeiro
         updated_at = now()
   where id = v_user_id returning kumbu_available into v_new_balance;

  insert into public.kumbu_ledger (user_id, amount, action_type, source, reference_id, description, balance_after)
  values (v_user_id, -p_amount, p_action_type, p_source, p_reference_id, p_description, v_new_balance);
  return json_build_object('success', true, 'spent', p_amount, 'available', v_new_balance);
end;
$function$;

-- ── Pagamento ao mentor (academia_complete) → ganho/levantável ──────────────
create or replace function public.academia_complete(p_session uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_mentor uuid; v_title text; v_fee int; v_total int := 0; v_paid int := 0; r record; v_amt int; v_bal int;
begin
  select mentor_id, title into v_mentor, v_title from public.academia_sessions where id = p_session;
  if v_mentor is null then return jsonb_build_object('ok', false, 'reason', 'no_session'); end if;
  if v_uid <> v_mentor and not public.has_role(v_uid, 'admin') then return jsonb_build_object('ok', false, 'reason', 'not_allowed'); end if;
  select coalesce(academia_fee_percent, 15) into v_fee from public.billing_config where id = 1;
  for r in select id, price_paid from public.academia_reservations where session_id = p_session and status = 'reserved' loop
    v_amt := floor(r.price_paid * (100 - v_fee) / 100.0)::int;
    if v_amt > 0 then
      update public.profiles
        set kumbu_available = coalesce(kumbu_available,0) + v_amt,
            kumbu_earned = coalesce(kumbu_earned,0) + v_amt,   -- rendimento → levantável
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

-- ── Payout: só do GANHO; debita available E earned ──────────────────────────
create or replace function public.request_payout(p_amount_kumbu integer)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  v_user uuid := auth.uid(); v_min constant integer := 1000;
  v_cpu numeric; v_rate numeric; v_local numeric; v_payout_id uuid;
  v_available int; v_earned int; v_new_available int;
begin
  if v_user is null then raise exception 'Não autenticado.'; end if;
  if p_amount_kumbu is null or p_amount_kumbu <= 0 then raise exception 'Quantidade inválida.'; end if;
  if p_amount_kumbu < v_min then raise exception 'Mínimo de % Kumbu por pedido.', v_min; end if;
  if not exists (select 1 from public.creator_applications where user_id = v_user and status = 'approved') then
    raise exception 'Apenas criadores aprovados podem pedir payout.';
  end if;

  select coalesce(kumbu_available,0), coalesce(kumbu_earned,0) into v_available, v_earned
    from public.profiles where id = v_user for update;
  -- Só Kumbu GANHO é levantável (comprado é só-gastar → anti-lavagem).
  if v_earned < p_amount_kumbu then
    raise exception 'Só podes levantar Kumbu ganho (%). Kumbu comprado não é levantável.', v_earned;
  end if;

  select credits_per_usd, rate_to_usd into v_cpu, v_rate from public.currency_rates where currency_code='AOA' and is_active limit 1;
  if v_cpu is null or v_rate is null or v_rate = 0 then raise exception 'Taxa de câmbio indisponível.'; end if;
  v_local := round((p_amount_kumbu::numeric / v_cpu) / v_rate, 2);

  insert into public.payout_requests (user_id, amount_kumbu, amount_local, currency, status)
  values (v_user, p_amount_kumbu, v_local, 'AOA', 'pending') returning id into v_payout_id;

  update public.profiles
     set kumbu_available = kumbu_available - p_amount_kumbu,
         kumbu_earned = kumbu_earned - p_amount_kumbu, updated_at = now()
   where id = v_user returning kumbu_available into v_new_available;
  insert into public.kumbu_ledger (user_id, amount, action_type, source, reference_id, description, balance_after)
  values (v_user, -p_amount_kumbu, 'payout', 'payout', v_payout_id, 'Pedido de payout', v_new_available);

  return json_build_object('success', true, 'payout_id', v_payout_id, 'amount_kumbu', p_amount_kumbu, 'amount_local', v_local, 'currency', 'AOA');
end;
$function$;

-- Payout rejeitado → devolve ao GANHO (era ganho).
create or replace function public.process_payout(p_payout_id uuid, p_action text, p_reason text default null)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare v_admin uuid := auth.uid(); v_p public.payout_requests; v_new_balance integer;
begin
  if not public.has_role(v_admin, 'admin'::app_role) then raise exception 'Sem permissão.'; end if;
  select * into v_p from public.payout_requests where id = p_payout_id for update;
  if not found then raise exception 'Pedido não encontrado.'; end if;

  if p_action = 'approve' then
    if v_p.status <> 'pending' then raise exception 'Só se aprova um pedido pendente.'; end if;
    update public.payout_requests set status='approved', processed_by=v_admin, updated_at=now() where id=p_payout_id;
  elsif p_action = 'process' then
    if v_p.status <> 'approved' then raise exception 'Só se paga um pedido aprovado.'; end if;
    update public.payout_requests set status='processed', processed_by=v_admin, processed_at=now(), updated_at=now() where id=p_payout_id;
  elsif p_action = 'reject' then
    if v_p.status not in ('pending','approved') then raise exception 'Este pedido já foi finalizado.'; end if;
    update public.profiles
      set kumbu_available = kumbu_available + v_p.amount_kumbu,
          kumbu_earned = kumbu_earned + v_p.amount_kumbu,   -- devolve ao ganho
          updated_at = now()
      where id = v_p.user_id returning kumbu_available into v_new_balance;
    insert into public.kumbu_ledger (user_id, amount, action_type, source, reference_id, description, balance_after)
      values (v_p.user_id, v_p.amount_kumbu, 'payout', 'payout_refund', p_payout_id, 'Payout rejeitado — Kumbu devolvido', v_new_balance);
    update public.payout_requests set status='rejected', rejection_reason=p_reason, processed_by=v_admin, processed_at=now(), updated_at=now() where id=p_payout_id;
  else
    raise exception 'Ação inválida.';
  end if;
  return json_build_object('success', true, 'action', p_action);
end;
$function$;

notify pgrst, 'reload schema';
