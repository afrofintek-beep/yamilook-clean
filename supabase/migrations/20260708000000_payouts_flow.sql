-- Creator payouts: complete the flow with atomic Kumbu debit on request and
-- refund on rejection. Before this, requesting a payout did NOT deduct Kumbu
-- (balance never dropped → a creator could request their whole balance many
-- times) and amount_local/currency were never filled.

-- Kumbu -> local currency (AOA) uses the single economic anchor already in the
-- app: currency_rates.credits_per_usd (100 => 1 USD) and rate_to_usd for AOA.
-- 1 Kumbu = (1/credits_per_usd) USD; amount_local = that / rate_to_usd.

-- 1) Request a payout: eligibility + minimum + convert + insert + deduct (atomic).
create or replace function public.request_payout(p_amount_kumbu integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_min constant integer := 1000;   -- minimum Kumbu per request
  v_cpu numeric;
  v_rate numeric;
  v_local numeric;
  v_payout_id uuid;
  v_spend json;
begin
  if v_user is null then raise exception 'Não autenticado.'; end if;
  if p_amount_kumbu is null or p_amount_kumbu <= 0 then raise exception 'Quantidade inválida.'; end if;
  if p_amount_kumbu < v_min then raise exception 'Mínimo de % Kumbu por pedido.', v_min; end if;

  if not exists (
    select 1 from public.creator_applications where user_id = v_user and status = 'approved'
  ) then
    raise exception 'Apenas criadores aprovados podem pedir payout.';
  end if;

  select credits_per_usd, rate_to_usd into v_cpu, v_rate
  from public.currency_rates where currency_code = 'AOA' and is_active limit 1;
  if v_cpu is null or v_rate is null or v_rate = 0 then
    raise exception 'Taxa de câmbio indisponível.';
  end if;
  v_local := round((p_amount_kumbu::numeric / v_cpu) / v_rate, 2);

  -- The payout row id anchors the ledger entry (so a rejection can reverse it).
  insert into public.payout_requests (user_id, amount_kumbu, amount_local, currency, status)
  values (v_user, p_amount_kumbu, v_local, 'AOA', 'pending')
  returning id into v_payout_id;

  -- Atomic debit: kumbu_spend locks the profile row, checks the balance, and
  -- writes the ledger entry (action_type 'payout', negative amount).
  v_spend := public.kumbu_spend(p_amount_kumbu, 'payout', 'payout', v_payout_id, 'Pedido de payout');
  if coalesce((v_spend->>'success')::boolean, false) is not true then
    raise exception '%', coalesce(v_spend->>'error', 'Falha ao debitar Kumbu.');
  end if;

  return json_build_object(
    'success', true, 'payout_id', v_payout_id,
    'amount_kumbu', p_amount_kumbu, 'amount_local', v_local, 'currency', 'AOA'
  );
end;
$$;

-- 2) Admin processes a payout: approve / mark paid / reject (reject refunds Kumbu).
create or replace function public.process_payout(p_payout_id uuid, p_action text, p_reason text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_p public.payout_requests;
  v_new_balance integer;
begin
  if not public.has_role(v_admin, 'admin'::app_role) then
    raise exception 'Sem permissão.';
  end if;

  select * into v_p from public.payout_requests where id = p_payout_id for update;
  if not found then raise exception 'Pedido não encontrado.'; end if;

  if p_action = 'approve' then
    if v_p.status <> 'pending' then raise exception 'Só se aprova um pedido pendente.'; end if;
    update public.payout_requests
      set status = 'approved', processed_by = v_admin, updated_at = now()
      where id = p_payout_id;

  elsif p_action = 'process' then
    if v_p.status <> 'approved' then raise exception 'Só se paga um pedido aprovado.'; end if;
    update public.payout_requests
      set status = 'processed', processed_by = v_admin, processed_at = now(), updated_at = now()
      where id = p_payout_id;

  elsif p_action = 'reject' then
    if v_p.status not in ('pending', 'approved') then
      raise exception 'Este pedido já foi finalizado.';
    end if;
    -- Refund the creator (reverse the 'payout' debit). Credit the CREATOR, not
    -- the admin — so we write the balance/ledger directly (kumbu_refund uses
    -- auth.uid() and kumbu_award caps at 40/day, neither fits here).
    update public.profiles
      set kumbu_available = kumbu_available + v_p.amount_kumbu, updated_at = now()
      where id = v_p.user_id
      returning kumbu_available into v_new_balance;
    insert into public.kumbu_ledger (user_id, amount, action_type, source, reference_id, description, balance_after)
      values (v_p.user_id, v_p.amount_kumbu, 'payout', 'payout_refund', p_payout_id, 'Payout rejeitado — Kumbu devolvido', v_new_balance);
    update public.payout_requests
      set status = 'rejected', rejection_reason = p_reason, processed_by = v_admin, processed_at = now(), updated_at = now()
      where id = p_payout_id;

  else
    raise exception 'Ação inválida.';
  end if;

  return json_build_object('success', true, 'action', p_action);
end;
$$;

grant execute on function public.request_payout(integer) to authenticated;
grant execute on function public.process_payout(uuid, text, text) to authenticated;
