-- ============================================================================
-- Mokubico Pro — faturação gerida por painel ADMIN.
-- ----------------------------------------------------------------------------
-- • Fecha o buraco de segurança: hoje qualquer utilizador se punha `plan='pro'`
--   sozinho (RLS auth.uid()=id). Trigger reverte auto-promoção (só admin/sistema
--   mudam o plano). RPC admin para conceder/retirar Pro.
-- • Preço/limites deixam de estar no código: tabela `billing_config` editável
--   pelo admin (mensal, anual, vídeo on/off, tetos de custo).
-- • Pro é subscrição com validade (`profiles.plan_expires_at`). is_pro() respeita-a.
-- ============================================================================

alter table public.profiles add column if not exists plan_expires_at timestamptz;

-- ── Segurança: bloquear auto-promoção do plano ──────────────────────────────
create or replace function public.protect_profile_plan()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  -- utilizador normal (não-admin) não pode mexer no plano nem na validade
  if auth.uid() is not null and not public.has_role(auth.uid(), 'admin') then
    new.plan := old.plan;
    new.plan_expires_at := old.plan_expires_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_plan on public.profiles;
create trigger trg_protect_profile_plan
  before update of plan, plan_expires_at on public.profiles
  for each row execute function public.protect_profile_plan();

-- Pro efetivo = plano pro E dentro da validade (null = sem validade).
create or replace function public.is_pro(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.profiles
     where id = p_user and plan = 'pro'
       and (plan_expires_at is null or plan_expires_at > now())
  );
$$;

-- ── Configuração de faturação (editável pelo admin) ─────────────────────────
create table if not exists public.billing_config (
  id                     int primary key default 1 check (id = 1),
  currency               text not null default 'AOA',
  pro_monthly            int  not null default 2000,     -- preço mensal
  pro_annual             int  not null default 20000,    -- preço anual
  video_enabled          boolean not null default true,  -- vídeo em grupo no Pro
  max_video_participants int  not null default 4,        -- teto de pessoas em vídeo
  video_minutes_cap      int,                            -- teto de minutos de vídeo/mês (null=ilimitado)
  updated_at             timestamptz not null default now(),
  updated_by             uuid
);
insert into public.billing_config (id) values (1) on conflict (id) do nothing;

alter table public.billing_config enable row level security;
do $$ begin
  -- preço é público (para mostrar na app); escrita só admin (via RPC definer)
  if not exists (select 1 from pg_policies where tablename='billing_config' and policyname='public read') then
    create policy "public read" on public.billing_config for select using (true);
  end if;
end $$;

-- ── RPCs de admin ───────────────────────────────────────────────────────────
create or replace function public.admin_set_billing_config(
  p_pro_monthly int, p_pro_annual int, p_video_enabled boolean,
  p_max_video_participants int, p_video_minutes_cap int default null,
  p_currency text default 'AOA'
) returns public.billing_config language plpgsql security definer set search_path to 'public' as $$
declare v_row public.billing_config;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'not_admin'; end if;
  update public.billing_config set
    pro_monthly = greatest(0, p_pro_monthly),
    pro_annual = greatest(0, p_pro_annual),
    video_enabled = p_video_enabled,
    max_video_participants = greatest(2, p_max_video_participants),
    video_minutes_cap = p_video_minutes_cap,
    currency = coalesce(nullif(btrim(p_currency), ''), 'AOA'),
    updated_at = now(), updated_by = auth.uid()
   where id = 1
  returning * into v_row;
  return v_row;
end;
$$;

-- Conceder/retirar Pro a um utilizador. p_months=0 → retira (volta a free).
create or replace function public.admin_set_user_plan(
  p_user_id uuid, p_plan text, p_months int default 1
) returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_exp timestamptz;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'not_admin'; end if;
  if p_plan = 'pro' and coalesce(p_months, 0) > 0 then
    -- estende a partir do fim atual se ainda válido, senão a partir de agora
    select case when plan_expires_at > now() then plan_expires_at else now() end
      into v_exp from public.profiles where id = p_user_id;
    v_exp := coalesce(v_exp, now()) + make_interval(months => p_months);
    update public.profiles set plan = 'pro', plan_expires_at = v_exp where id = p_user_id;
  else
    update public.profiles set plan = 'free', plan_expires_at = null where id = p_user_id;
    v_exp := null;
  end if;
  return jsonb_build_object('ok', true, 'user_id', p_user_id,
    'plan', case when v_exp is not null then 'pro' else 'free' end, 'expires_at', v_exp);
end;
$$;

-- Visão geral para o painel: nº Pro ativos, a expirar, receita estimada.
create or replace function public.admin_billing_overview()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare v_active int; v_expiring int; v_price int;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'not_admin'; end if;
  select count(*) into v_active from public.profiles
   where plan = 'pro' and (plan_expires_at is null or plan_expires_at > now());
  select count(*) into v_expiring from public.profiles
   where plan = 'pro' and plan_expires_at is not null
     and plan_expires_at > now() and plan_expires_at < now() + interval '7 days';
  select pro_monthly into v_price from public.billing_config where id = 1;
  return jsonb_build_object('active', v_active, 'expiring_7d', v_expiring,
    'monthly_price', v_price, 'est_mrr', v_active * v_price);
end;
$$;

-- Lista dos subscritores Pro (para gerir no painel).
create or replace function public.admin_list_pro_users()
returns table(id uuid, display_name text, username text, plan_expires_at timestamptz)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'not_admin'; end if;
  return query
    select p.id, p.display_name, p.username, p.plan_expires_at
      from public.profiles p
     where p.plan = 'pro'
     order by p.plan_expires_at asc nulls last;
end;
$$;

grant execute on function public.is_pro(uuid) to authenticated;
grant execute on function public.admin_set_billing_config(int,int,boolean,int,int,text) to authenticated;
grant execute on function public.admin_set_user_plan(uuid,text,int) to authenticated;
grant execute on function public.admin_billing_overview() to authenticated;
grant execute on function public.admin_list_pro_users() to authenticated;

notify pgrst, 'reload schema';
