-- ============================================================================
-- Mokubico Pro — compras de SUBSCRIÇÃO via AppyPay (paralelo aos créditos).
-- ----------------------------------------------------------------------------
-- Reutiliza o gateway AppyPay ([[yamilook-payments-appypay]]) mas, ao pagar,
-- ATIVA o Pro (plano + validade) em vez de creditar saldo de publicidade.
-- fulfill_pro_subscription é idempotente e corre como sistema (service role),
-- por isso passa o trigger trg_protect_profile_plan (auth.uid() null = sistema).
-- ============================================================================

create table if not exists public.subscription_purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  period        text not null default 'monthly',   -- 'monthly' | 'annual'
  months        int  not null default 1,
  amount_kwanza int  not null,
  provider      text not null default 'appypay',
  method        text,                                -- 'GPO' | 'REF'
  status        text not null default 'pending',     -- pending | paid | failed
  provider_ref  text,
  merchant_ref  text,
  created_at    timestamptz not null default now(),
  fulfilled_at  timestamptz
);
create index if not exists sub_purchases_user_idx on public.subscription_purchases (user_id, status);

alter table public.subscription_purchases enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='subscription_purchases' and policyname='own read') then
    create policy "own read" on public.subscription_purchases for select using (auth.uid() = user_id);
  end if;
end $$;

-- Ativa o Pro a partir de uma compra paga. Idempotente: só age se ainda pending.
-- Estende a validade a partir do fim atual (se válido) ou de agora.
create or replace function public.fulfill_pro_subscription(
  p_purchase_id uuid, p_provider_ref text default null
) returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_user uuid; v_months int; v_status text; v_base timestamptz; v_exp timestamptz;
begin
  select user_id, months, status into v_user, v_months, v_status
    from public.subscription_purchases where id = p_purchase_id for update;
  if v_user is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_status = 'paid' then
    return jsonb_build_object('ok', true, 'already', true);   -- idempotente
  end if;

  select case when plan_expires_at > now() then plan_expires_at else now() end
    into v_base from public.profiles where id = v_user;
  v_exp := coalesce(v_base, now()) + make_interval(months => greatest(1, v_months));

  update public.profiles set plan = 'pro', plan_expires_at = v_exp where id = v_user;
  update public.subscription_purchases
     set status = 'paid', fulfilled_at = now(),
         provider_ref = coalesce(p_provider_ref, provider_ref)
   where id = p_purchase_id;

  return jsonb_build_object('ok', true, 'user_id', v_user, 'expires_at', v_exp);
end;
$$;

grant execute on function public.fulfill_pro_subscription(uuid, text) to service_role;

notify pgrst, 'reload schema';
