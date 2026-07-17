-- Motor de ganhos Kumbu (economia da participação) — liga o que o modal
-- "Como ganhar Kumbu?" promete ao que a BD faz. O RPC kumbu_award JÁ tinha os
-- limites por ação (roda_join 3/dia, roda_create 2/dia, academia_session
-- 1/dia, referral 5/mês, post_create 3/dia) e o teto diário de 40, mas nada o
-- chamava e o CHECK do ledger rejeitava esses action_types.

-- ═══ 1) Alargar o CHECK do ledger aos action_types de atividade ═══
alter table public.kumbu_ledger drop constraint if exists kumbu_ledger_action_type_check;
alter table public.kumbu_ledger add constraint kumbu_ledger_action_type_check
  check (action_type = any (array[
    'earn','spend','payout','topup','refund',
    'roda_join','roda_create','academia_session','referral','post_create','weekly_bonus'
  ]));

-- ═══ 2) Premiador de atividade: idempotente por (user, ação, referência) e
--        silencioso — um erro no prémio NUNCA pode falhar a ação principal ═══
create or replace function public.kumbu_activity_award(
  p_user uuid, p_amount integer, p_action text, p_source text, p_ref uuid, p_desc text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_user is null then return; end if;
  -- nunca premiar duas vezes a mesma ação sobre a mesma referência
  if exists (
    select 1 from public.kumbu_ledger
    where user_id = p_user and action_type = p_action and reference_id = p_ref and amount > 0
  ) then
    return;
  end if;
  perform public.kumbu_award(p_user, p_amount, p_action, p_source, p_ref, p_desc);
exception when others then
  raise warning 'kumbu_activity_award falhou (user=%, action=%, ref=%): %', p_user, p_action, p_ref, sqlerrm;
end $$;

-- ═══ 3) Publicar no feed: +3, máx. 3/dia ═══
create or replace function public.award_kumbu_on_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.kumbu_activity_award(new.user_id, 3, 'post_create', 'feed', new.id, 'Publicação no feed');
  return new;
end $$;

drop trigger if exists trg_award_kumbu_post on public.posts;
create trigger trg_award_kumbu_post
  after insert on public.posts
  for each row execute function public.award_kumbu_on_post();

-- ═══ 4) Criar Roda: +8, máx. 2/dia ═══
create or replace function public.award_kumbu_on_roda_create()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.kumbu_activity_award(new.organizer_id, 8, 'roda_create', 'palco', new.id, 'Criação de Roda');
  return new;
end $$;

drop trigger if exists trg_award_kumbu_roda_create on public.rodas;
create trigger trg_award_kumbu_roda_create
  after insert on public.rodas
  for each row execute function public.award_kumbu_on_roda_create();

-- ═══ 5) Participar na Roda: +5, máx. 3/dia (organizador não acumula com +8) ═══
create or replace function public.award_kumbu_on_roda_join()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.rodas r where r.id = new.roda_id and r.organizer_id = new.user_id) then
    return new; -- o organizador já é premiado pela criação
  end if;
  perform public.kumbu_activity_award(new.user_id, 5, 'roda_join', 'palco', new.roda_id, 'Participação na Roda');
  return new;
end $$;

drop trigger if exists trg_award_kumbu_roda_join on public.roda_participants;
create trigger trg_award_kumbu_roda_join
  after insert on public.roda_participants
  for each row execute function public.award_kumbu_on_roda_join();

-- ═══ 6) Sessão na Academia: +15, máx. 1/dia — premiado quando a sessão TERMINA,
--        a cada participante com reserva ativa (evita farm de reservar+cancelar) ═══
create or replace function public.award_kumbu_on_academia_ended()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_res record;
begin
  if new.status = 'ended' and old.status is distinct from new.status then
    for v_res in
      select ar.user_id from public.academia_reservations ar
      where ar.session_id = new.id and ar.status = 'reserved'
    loop
      perform public.kumbu_activity_award(v_res.user_id, 15, 'academia_session', 'academia', new.id, 'Sessão na Academia concluída');
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists trg_award_kumbu_academia on public.academia_sessions;
create trigger trg_award_kumbu_academia
  after update on public.academia_sessions
  for each row execute function public.award_kumbu_on_academia_ended();

-- ═══ 7) TOP 10 semanal: agendar compute_weekly_ranking (segunda 06:00 UTC) ═══
do $$
begin
  perform cron.unschedule('kumbu-weekly-ranking');
exception when others then null; -- não existia ainda
end $$;
select cron.schedule('kumbu-weekly-ranking', '0 6 * * 1', 'select public.compute_weekly_ranking()');

-- ═══ 8) FIX no kumbu_award: o teto diário de 40 só conta ATIVIDADE.
--        Antes somava qualquer amount>0 → um topup (compra) de hoje esgotava o
--        limite e bloqueava todos os ganhos do dia. ═══
create or replace function public.kumbu_award(
  p_user_id uuid, p_amount integer, p_action_type text default 'earn',
  p_source text default null, p_reference_id uuid default null, p_description text default null
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_daily_total integer; v_daily_max integer := 40; v_action_count integer; v_action_limit integer;
  v_new_available integer; v_new_lifetime integer; v_new_level text;
begin
  if p_amount <= 0 then return json_build_object('success', false, 'error', 'Amount must be positive'); end if;
  if p_action_type != 'weekly_bonus' then
    select coalesce(sum(amount),0) into v_daily_total from public.kumbu_ledger
     where user_id=p_user_id and amount>0
       and action_type in ('earn','roda_join','roda_create','academia_session','referral','post_create')
       and created_at>=current_date;
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
         kumbu_earned = kumbu_earned + p_amount,
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
end $$;
