-- ============================================================================
-- Anti-lavagem #2: trancar a porta de saída (payout) — KYC + limites + retenção.
-- ----------------------------------------------------------------------------
-- Toda a lavagem sai por payout; trancar aqui protege o sistema todo.
--   • KYC obrigatório antes de levantar (default: payout OFF até identidade
--     verificada — a postura segura para pré-lançamento).
--   • Limites: máximo por pedido + teto diário + teto mensal (anti-structuring).
--   • Retenção: um pedido aprovado só se PROCESSA X dias depois de criado
--     (janela para chargebacks do pagamento de origem aparecerem).
--   • Mantém aprovação manual do admin (process_payout já é admin-only).
-- Tudo configurável em billing_config; valores por defeito conservadores.
-- ============================================================================

alter table public.profiles add column if not exists kyc_verified boolean not null default false;

alter table public.billing_config add column if not exists payout_require_kyc   boolean not null default true;
alter table public.billing_config add column if not exists payout_max_per_request int not null default 50000;
alter table public.billing_config add column if not exists payout_daily_cap     int not null default 50000;
alter table public.billing_config add column if not exists payout_monthly_cap   int not null default 200000;
alter table public.billing_config add column if not exists payout_hold_days     int not null default 7;

-- ── Pedir payout: KYC + limites + só do Kumbu ganho ─────────────────────────
create or replace function public.request_payout(p_amount_kumbu integer)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  v_user uuid := auth.uid(); v_min constant integer := 1000;
  v_cpu numeric; v_rate numeric; v_local numeric; v_payout_id uuid;
  v_available int; v_earned int; v_new_available int;
  v_req_kyc boolean; v_max int; v_daily int; v_monthly int; v_kyc boolean;
begin
  if v_user is null then raise exception 'Não autenticado.'; end if;
  if p_amount_kumbu is null or p_amount_kumbu <= 0 then raise exception 'Quantidade inválida.'; end if;
  if p_amount_kumbu < v_min then raise exception 'Mínimo de % Kumbu por pedido.', v_min; end if;
  if not exists (select 1 from public.creator_applications where user_id = v_user and status = 'approved') then
    raise exception 'Apenas criadores aprovados podem pedir payout.';
  end if;

  select coalesce(payout_require_kyc,true), coalesce(payout_max_per_request,0),
         coalesce(payout_daily_cap,0), coalesce(payout_monthly_cap,0)
    into v_req_kyc, v_max, v_daily, v_monthly from public.billing_config where id = 1;

  -- KYC obrigatório (identidade verificada) antes de levantar.
  if v_req_kyc then
    select coalesce(kyc_verified,false) into v_kyc from public.profiles where id = v_user;
    if not v_kyc then raise exception 'Precisas de verificar a identidade (KYC) antes de levantar.'; end if;
  end if;

  -- Limites (anti-structuring).
  if v_max > 0 and p_amount_kumbu > v_max then raise exception 'Máximo de % Kumbu por pedido.', v_max; end if;
  if v_daily > 0 and p_amount_kumbu + coalesce((select sum(amount_kumbu) from public.payout_requests
        where user_id = v_user and status <> 'rejected' and created_at >= now() - interval '1 day'),0) > v_daily then
    raise exception 'Excede o limite diário de payout (%).', v_daily;
  end if;
  if v_monthly > 0 and p_amount_kumbu + coalesce((select sum(amount_kumbu) from public.payout_requests
        where user_id = v_user and status <> 'rejected' and created_at >= now() - interval '30 days'),0) > v_monthly then
    raise exception 'Excede o limite mensal de payout (%).', v_monthly;
  end if;

  -- Só Kumbu GANHO é levantável (comprado é só-gastar → anti-lavagem).
  select coalesce(kumbu_available,0), coalesce(kumbu_earned,0) into v_available, v_earned
    from public.profiles where id = v_user for update;
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

-- ── Processar: retenção (X dias) antes de pagar; rejeição devolve ao ganho ──
create or replace function public.process_payout(p_payout_id uuid, p_action text, p_reason text default null)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare v_admin uuid := auth.uid(); v_p public.payout_requests; v_new_balance integer; v_hold int;
begin
  if not public.has_role(v_admin, 'admin'::app_role) then raise exception 'Sem permissão.'; end if;
  select * into v_p from public.payout_requests where id = p_payout_id for update;
  if not found then raise exception 'Pedido não encontrado.'; end if;

  if p_action = 'approve' then
    if v_p.status <> 'pending' then raise exception 'Só se aprova um pedido pendente.'; end if;
    update public.payout_requests set status='approved', processed_by=v_admin, updated_at=now() where id=p_payout_id;
  elsif p_action = 'process' then
    if v_p.status <> 'approved' then raise exception 'Só se paga um pedido aprovado.'; end if;
    select coalesce(payout_hold_days,0) into v_hold from public.billing_config where id = 1;
    if v_hold > 0 and v_p.created_at > now() - make_interval(days => v_hold) then
      raise exception 'Período de retenção: só se pode pagar % dias após o pedido.', v_hold;
    end if;
    update public.payout_requests set status='processed', processed_by=v_admin, processed_at=now(), updated_at=now() where id=p_payout_id;
  elsif p_action = 'reject' then
    if v_p.status not in ('pending','approved') then raise exception 'Este pedido já foi finalizado.'; end if;
    update public.profiles
      set kumbu_available = kumbu_available + v_p.amount_kumbu,
          kumbu_earned = kumbu_earned + v_p.amount_kumbu, updated_at = now()
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

-- ── KYC: admin verifica a identidade de um utilizador ───────────────────────
create or replace function public.admin_set_kyc_verified(p_user uuid, p_verified boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'not_admin'; end if;
  update public.profiles set kyc_verified = p_verified, updated_at = now() where id = p_user;
  return jsonb_build_object('ok', true, 'user_id', p_user, 'kyc_verified', p_verified);
end;
$$;

grant execute on function public.admin_set_kyc_verified(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
