-- ============================================================================
-- Banda — Fase 2: PoDP (Prova de Presença Diária) por CHECK-IN explícito.
-- ----------------------------------------------------------------------------
-- Reforça o "residente verificado" com presença física real: o utilizador faz
-- check-in ("Estou na minha banda"), o GPS é verificado contra a posição da
-- banda (≤2 km, o mesmo raio de vizinhança do onboarding), e regista-se 1
-- presença por dia. verificado passa a exigir: ≥30 dias de membro + ≥5
-- contribuições + presença em ≥8 dos últimos 14 dias.
-- Modelo opt-in/gamificado (rede social) — não há amostragem silenciosa.
-- Parâmetros (constantes, ajustáveis por migração):
--   tolerância 2000 m · ciclo 14 dias · min presença 8 · min membro 30d · min atividade 5
-- ============================================================================

-- Uma presença por (utilizador, dia). Guarda o ponto e a distância à banda.
create table if not exists public.podp_daily (
  user_id    uuid not null references auth.users(id) on delete cascade,
  banda_id   uuid,
  day        date not null,
  lat        double precision,
  lng        double precision,
  dist_m     double precision,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
create index if not exists podp_daily_user_day_idx on public.podp_daily (user_id, day desc);

alter table public.podp_daily enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='podp_daily' and policyname='own read') then
    create policy "own read" on public.podp_daily for select using (auth.uid() = user_id);
  end if;
end $$;

-- Distância grande-círculo em metros (haversine).
create or replace function public.podp_haversine_m(
  lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision
) returns double precision language sql immutable as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- Check-in de presença na banda. Verifica proximidade da posição do perfil
-- (a "casa"/centro da banda) e regista 1 presença/dia.
-- Devolve jsonb: {ok, present, dist_m, already, present_days_14, streak, status}.
create or replace function public.podp_check_in(
  p_lat double precision, p_lng double precision, p_accuracy double precision default null
) returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid();
  v_banda uuid; v_hlat double precision; v_hlng double precision;
  v_dist double precision; v_present boolean; v_already boolean := false;
  v_tol constant double precision := 2000;   -- metros (raio da banda)
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if p_lat is null or p_lng is null then return jsonb_build_object('ok', false, 'reason', 'no_gps'); end if;
  -- amostra grosseira (accuracy enorme) não serve de prova
  if p_accuracy is not null and p_accuracy > 1000 then
    return jsonb_build_object('ok', false, 'reason', 'low_accuracy');
  end if;

  select p.latitude, p.longitude, ub.banda_id
    into v_hlat, v_hlng, v_banda
    from public.profiles p
    left join public.user_bandas ub on ub.user_id = p.id and ub.is_active
   where p.id = v_uid;

  if v_hlat is null or v_hlng is null then
    return jsonb_build_object('ok', false, 'reason', 'no_home');   -- perfil sem posição
  end if;

  v_dist := public.podp_haversine_m(p_lat, p_lng, v_hlat, v_hlng);
  v_present := v_dist <= v_tol;

  if v_present then
    if exists (select 1 from public.podp_daily where user_id = v_uid and day = current_date) then
      v_already := true;
    else
      insert into public.podp_daily(user_id, banda_id, day, lat, lng, dist_m)
      values (v_uid, v_banda, current_date, p_lat, p_lng, v_dist);
    end if;
  end if;

  return jsonb_build_object(
    'ok', true, 'present', v_present, 'dist_m', round(v_dist)::int, 'already', v_already,
    'present_days_14', (select count(*) from public.podp_daily
                         where user_id = v_uid and day > current_date - 14),
    'streak', public.podp_streak(v_uid),
    'status', (public.banda_residency(v_uid) ->> 'status')
  );
end;
$$;

-- Sequência de dias consecutivos de presença até hoje (ou ontem).
create or replace function public.podp_streak(p_user uuid)
returns int language plpgsql stable security definer set search_path to 'public' as $$
declare v_streak int := 0; v_probe date := current_date; v_has boolean;
begin
  -- se ainda não fez check-in hoje, a streak conta a partir de ontem
  if not exists (select 1 from public.podp_daily where user_id = p_user and day = current_date) then
    v_probe := current_date - 1;
  end if;
  loop
    select exists(select 1 from public.podp_daily where user_id = p_user and day = v_probe) into v_has;
    exit when not v_has;
    v_streak := v_streak + 1;
    v_probe := v_probe - 1;
  end loop;
  return v_streak;
end;
$$;

-- banda_residency v2: verificado agora exige também presença PoDP.
create or replace function public.banda_residency(p_user uuid default auth.uid())
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_banda uuid; v_since timestamptz; v_days int; v_activity int; v_present int; v_status text;
  v_min_days constant int := 30; v_min_activity constant int := 5; v_min_present constant int := 8;
begin
  if p_user is null then return jsonb_build_object('status', 'none'); end if;
  select banda_id, activated_at into v_banda, v_since
    from public.user_bandas where user_id = p_user and is_active = true limit 1;
  if v_banda is null then return jsonb_build_object('status', 'none'); end if;

  v_days := floor(extract(epoch from (now() - coalesce(v_since, now()))) / 86400)::int;
  select coalesce((select count(*) from public.posts where user_id = p_user and created_at >= v_since), 0)
       + coalesce((select count(*) from public.post_comments where user_id = p_user and created_at >= v_since), 0)
    into v_activity;
  select count(*) into v_present from public.podp_daily
    where user_id = p_user and day > current_date - 14;

  if v_days >= v_min_days and v_activity >= v_min_activity and v_present >= v_min_present then
    v_status := 'verificado';
  elsif v_days >= v_min_days then v_status := 'residente';
  else v_status := 'novo';
  end if;

  return jsonb_build_object(
    'status', v_status, 'banda_id', v_banda, 'days', v_days, 'activity', v_activity,
    'present_days_14', v_present, 'need_present', v_min_present,
    'need_activity', v_min_activity, 'need_days', v_min_days,
    'next_change_at', to_char(coalesce(v_since, now()) + interval '60 days', 'YYYY-MM-DD"T"HH24:MI:SSOF'),
    'can_change_now', (coalesce(v_since, now()) <= now() - interval '60 days')
  );
end;
$$;

grant execute on function public.podp_check_in(double precision,double precision,double precision) to authenticated;
grant execute on function public.podp_streak(uuid) to authenticated;

notify pgrst, 'reload schema';
