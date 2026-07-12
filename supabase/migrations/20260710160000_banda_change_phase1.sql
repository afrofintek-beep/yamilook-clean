-- ============================================================================
-- Banda — Fase 1: mudar de banda ("Mudei-me") com cooldown de 60 dias +
-- estado de residência (novo → residente → verificado por tempo + atividade).
-- ----------------------------------------------------------------------------
-- Como o código AFROLOC segue a localização, mudar de banda atualiza também as
-- coordenadas do perfil → o trigger regenera o código automaticamente.
-- ============================================================================

-- Momento em que a banda ativa passou a estar ativa (base do cooldown).
alter table public.user_bandas add column if not exists activated_at timestamptz;
update public.user_bandas set activated_at = coalesce(activated_at, joined_at, now()) where activated_at is null;

-- join_banda_by_location (onboarding / 1.ª vez): passa a carimbar activated_at.
create or replace function public.join_banda_by_location(p_name text, p_city text, p_country text default 'Angola')
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_banda uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null or p_name is null or btrim(p_name) = '' then return null; end if;
  select id into v_banda from public.bandas
   where lower(name) = lower(btrim(p_name))
     and coalesce(lower(city), '') = coalesce(lower(btrim(p_city)), '') limit 1;
  if v_banda is null then
    insert into public.bandas(name, city, country)
    values (btrim(p_name), nullif(btrim(p_city), ''), coalesce(nullif(btrim(p_country), ''), 'Angola'))
    returning id into v_banda;
  end if;
  update public.user_bandas set is_active = false
   where user_id = v_uid and is_active = true and banda_id <> v_banda;
  insert into public.user_bandas(user_id, banda_id, is_active, activated_at)
  values (v_uid, v_banda, true, now())
  on conflict (user_id, banda_id) do update set is_active = true, activated_at = now();
  return v_banda;
end;
$$;

-- Mudar de banda com cooldown de 60 dias. Atualiza user_bandas E o perfil
-- (cidade/bairro/país/coordenadas) → o AFROLOC regenera-se sozinho.
-- Devolve jsonb: {ok, reason?, next_change_at?, banda_id?, afroloc_code?}.
create or replace function public.change_banda(
  p_name text, p_city text, p_country text default 'Angola',
  p_lat double precision default null, p_lng double precision default null,
  p_neighborhood text default null
) returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid();
  v_banda uuid;
  v_cur_banda uuid;
  v_cur_since timestamptz;
  v_cooldown constant interval := interval '60 days';
  v_code text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'unauthenticated'); end if;
  if p_name is null or btrim(p_name) = '' then return jsonb_build_object('ok', false, 'reason', 'no_banda'); end if;

  -- banda ativa atual + desde quando
  select banda_id, activated_at into v_cur_banda, v_cur_since
    from public.user_bandas where user_id = v_uid and is_active = true limit 1;

  -- resolver a banda-alvo (find-or-create)
  select id into v_banda from public.bandas
   where lower(name) = lower(btrim(p_name))
     and coalesce(lower(city), '') = coalesce(lower(btrim(p_city)), '') limit 1;

  -- se é a mesma banda ativa, é só atualizar posição (sem cooldown)
  if v_banda is not null and v_banda = v_cur_banda then
    null;
  elsif v_cur_banda is not null and v_cur_since is not null and v_cur_since > now() - v_cooldown then
    -- ainda em cooldown para TROCAR de banda
    return jsonb_build_object('ok', false, 'reason', 'cooldown',
      'next_change_at', to_char(v_cur_since + v_cooldown, 'YYYY-MM-DD"T"HH24:MI:SSOF'));
  end if;

  if v_banda is null then
    insert into public.bandas(name, city, country)
    values (btrim(p_name), nullif(btrim(p_city), ''), coalesce(nullif(btrim(p_country), ''), 'Angola'))
    returning id into v_banda;
  end if;

  update public.user_bandas set is_active = false
   where user_id = v_uid and is_active = true and banda_id <> v_banda;
  insert into public.user_bandas(user_id, banda_id, is_active, activated_at)
  values (v_uid, v_banda, true, now())
  on conflict (user_id, banda_id) do update set is_active = true, activated_at = now();

  -- atualizar o perfil (dispara set_afroloc_code)
  update public.profiles set
    city = coalesce(nullif(btrim(p_city), ''), city),
    neighborhood = coalesce(nullif(btrim(coalesce(p_neighborhood, p_name)), ''), neighborhood),
    country_code = coalesce(nullif(btrim(p_country), ''), country_code),
    latitude = coalesce(p_lat, latitude),
    longitude = coalesce(p_lng, longitude)
   where id = v_uid;

  select afroloc_code into v_code from public.profiles where id = v_uid;
  return jsonb_build_object('ok', true, 'banda_id', v_banda, 'afroloc_code', v_code);
end;
$$;

-- Estado de residência na banda ativa: novo → residente → verificado.
-- verificado = ≥30 dias como membro E ≥5 contribuições (posts+comentários)
-- desde que entrou; residente = ≥30 dias mas atividade insuficiente.
create or replace function public.banda_residency(p_user uuid default auth.uid())
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_banda uuid; v_since timestamptz; v_days int; v_activity int; v_status text;
  v_min_days constant int := 30; v_min_activity constant int := 5;
begin
  if p_user is null then return jsonb_build_object('status', 'none'); end if;
  select banda_id, activated_at into v_banda, v_since
    from public.user_bandas where user_id = p_user and is_active = true limit 1;
  if v_banda is null then return jsonb_build_object('status', 'none'); end if;

  v_days := floor(extract(epoch from (now() - coalesce(v_since, now()))) / 86400)::int;
  select coalesce((select count(*) from public.posts where user_id = p_user and created_at >= v_since), 0)
       + coalesce((select count(*) from public.post_comments where user_id = p_user and created_at >= v_since), 0)
    into v_activity;

  if v_days >= v_min_days and v_activity >= v_min_activity then v_status := 'verificado';
  elsif v_days >= v_min_days then v_status := 'residente';
  else v_status := 'novo';
  end if;

  return jsonb_build_object(
    'status', v_status, 'banda_id', v_banda, 'days', v_days, 'activity', v_activity,
    'next_change_at', to_char(coalesce(v_since, now()) + interval '60 days', 'YYYY-MM-DD"T"HH24:MI:SSOF'),
    'can_change_now', (coalesce(v_since, now()) <= now() - interval '60 days')
  );
end;
$$;

grant execute on function public.change_banda(text,text,text,double precision,double precision,text) to authenticated;
grant execute on function public.banda_residency(uuid) to authenticated;

notify pgrst, 'reload schema';
