-- Sistema de referral ("Convidar utilizador activo" +15, máx. 5/mês — limite
-- já imposto pelo kumbu_award). Fluxo: cada perfil tem um referral_code; o
-- link de convite é /register?ref=<code>; quem se regista por ele fica com
-- referred_by; quando o convidado faz a PRIMEIRA ação que ganha Kumbu
-- (publicar, entrar numa roda, ...) o padrinho recebe os +15.

-- ═══ 1) Colunas ═══
alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id);

-- ═══ 2) Backfill: código de 8 chars para todos os perfis existentes ═══
update public.profiles
   set referral_code = upper(substr(md5(id::text || 'ymk-ref'), 1, 8))
 where referral_code is null;

create unique index if not exists profiles_referral_code_key
  on public.profiles (upper(referral_code));

-- ═══ 3) Código automático para perfis novos ═══
create or replace function public.set_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null then
    new.referral_code := upper(substr(md5(new.id::text || 'ymk-ref'), 1, 8));
  end if;
  return new;
end $$;

drop trigger if exists trg_set_referral_code on public.profiles;
create trigger trg_set_referral_code
  before insert on public.profiles
  for each row execute function public.set_referral_code();

-- ═══ 4) handle_new_user: resolver ?ref= (vem no metadata do signUp) ═══
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_referrer uuid;
begin
  if new.raw_user_meta_data->>'ref' is not null then
    select id into v_referrer from public.profiles
     where upper(referral_code) = upper(trim(new.raw_user_meta_data->>'ref'))
       and id <> new.id
     limit 1;
  end if;

  insert into public.profiles (id, email, display_name, username, referred_by)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    v_referrer
  );

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end $$;

-- ═══ 5) Pagar o padrinho quando o convidado fica ATIVO (1ª atividade Kumbu).
--        Idempotente: referência = id do convidado (paga uma única vez). ═══
create or replace function public.pay_referral_if_active(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_referrer uuid;
begin
  select referred_by into v_referrer from public.profiles where id = p_user;
  if v_referrer is null then return; end if;
  if exists (
    select 1 from public.kumbu_ledger
    where action_type = 'referral' and reference_id = p_user and amount > 0
  ) then
    return;
  end if;
  perform public.kumbu_award(v_referrer, 15, 'referral', 'convites', p_user, 'Convite: utilizador ativo');
exception when others then
  raise warning 'pay_referral_if_active falhou (user=%): %', p_user, sqlerrm;
end $$;

-- ═══ 6) Ligar ao motor de atividade: a 1ª ação premiável do convidado ativa o
--        pagamento ao padrinho ═══
create or replace function public.kumbu_activity_award(
  p_user uuid, p_amount integer, p_action text, p_source text, p_ref uuid, p_desc text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_user is null then return; end if;
  if exists (
    select 1 from public.kumbu_ledger
    where user_id = p_user and action_type = p_action and reference_id = p_ref and amount > 0
  ) then
    return;
  end if;
  perform public.kumbu_award(p_user, p_amount, p_action, p_source, p_ref, p_desc);
  -- o convidado fez atividade → o padrinho pode ter os +15 a receber
  perform public.pay_referral_if_active(p_user);
exception when others then
  raise warning 'kumbu_activity_award falhou (user=%, action=%, ref=%): %', p_user, p_action, p_ref, sqlerrm;
end $$;
