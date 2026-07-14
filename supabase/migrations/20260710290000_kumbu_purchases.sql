-- ============================================================================
-- Comprar Kumbu via AppyPay (o elo que faz a economia arrancar).
-- ----------------------------------------------------------------------------
-- Reutiliza o gateway AppyPay. Ao pagar, credita Kumbu COMPRADO
-- (kumbu_available + kumbu_lifetime), NUNCA kumbu_earned → comprado é
-- só-gastar, não-levantável (ver [[yamilook-kumbu-aml]]).
-- ============================================================================

-- O check de action_type só permitia earn/spend/payout — o que partia
-- kumbu_topup ('topup') e kumbu_refund ('refund'). Estender para os incluir.
alter table public.kumbu_ledger drop constraint if exists kumbu_ledger_action_type_check;
alter table public.kumbu_ledger add constraint kumbu_ledger_action_type_check
  check (action_type = any (array['earn','spend','payout','topup','refund']));

create table if not exists public.kumbu_purchases (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  kumbu         int  not null,
  amount_kwanza int  not null,
  provider      text not null default 'appypay',
  method        text,                                -- 'GPO' | 'REF'
  status        text not null default 'pending',     -- pending | paid | failed
  provider_ref  text,
  merchant_ref  text,
  created_at    timestamptz not null default now(),
  fulfilled_at  timestamptz
);
create index if not exists kumbu_purchases_user_idx on public.kumbu_purchases (user_id, status);

alter table public.kumbu_purchases enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='kumbu_purchases' and policyname='own read') then
    create policy "own read" on public.kumbu_purchases for select using (auth.uid() = user_id);
  end if;
end $$;

-- Credita o Kumbu comprado. Idempotente (só age se ainda pending).
create or replace function public.fulfill_kumbu_purchase(p_purchase_id uuid, p_provider_ref text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_user uuid; v_kumbu int; v_status text; v_bal int;
begin
  select user_id, kumbu, status into v_user, v_kumbu, v_status
    from public.kumbu_purchases where id = p_purchase_id for update;
  if v_user is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_status = 'paid' then return jsonb_build_object('ok', true, 'already', true); end if;

  update public.profiles
     set kumbu_available = coalesce(kumbu_available,0) + v_kumbu,   -- comprado → só-gastar
         kumbu_lifetime  = coalesce(kumbu_lifetime,0) + v_kumbu,    -- (kumbu_earned NÃO mexe)
         level = case when coalesce(kumbu_lifetime,0) + v_kumbu >= 2000 then 'KOTA'
                      when coalesce(kumbu_lifetime,0) + v_kumbu >= 800 then 'Ouro'
                      when coalesce(kumbu_lifetime,0) + v_kumbu >= 200 then 'Prata' else 'Bronze' end,
         updated_at = now()
   where id = v_user returning kumbu_available into v_bal;

  insert into public.kumbu_ledger(user_id, amount, action_type, source, reference_id, description, balance_after)
  values (v_user, v_kumbu, 'topup', 'appypay', p_purchase_id, 'Compra de Kumbu', v_bal);

  update public.kumbu_purchases
     set status = 'paid', fulfilled_at = now(), provider_ref = coalesce(p_provider_ref, provider_ref)
   where id = p_purchase_id;

  return jsonb_build_object('ok', true, 'kumbu', v_kumbu, 'available', v_bal);
end;
$$;

grant execute on function public.fulfill_kumbu_purchase(uuid, text) to service_role;

notify pgrst, 'reload schema';
