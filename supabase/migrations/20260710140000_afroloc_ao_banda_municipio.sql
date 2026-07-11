-- ============================================================================
-- Angola — mapa banda → (província, município, comuna) para embutir a
-- nomenclatura completa nos códigos AFROLOC angolanos.
-- ----------------------------------------------------------------------------
-- A nomenclatura canónica exige província + município + comuna (admin.ts):
--   PROV = segmento do código da província (AO-LUA → 'LUA')
--   MUN / COM = slug3(nome) — 3 primeiras letras, maiúsculas, sem acentos.
-- Regra (pedido do dono): bandas que SÃO município mapeiam a si (comuna = sede
-- homónima); as que NÃO são município mapeiam ao MUNICÍPIO-PAI e a própria
-- banda torna-se a comuna.
-- best_effort=true marca os limites incertos da reforma 2024 de Luanda.
-- ============================================================================

create table if not exists public.afroloc_banda_division (
  country_code text not null,
  city         text not null,
  banda_norm   text not null,          -- lower(nome da banda)
  prov_seg     text not null,          -- 'LUA'
  mun_slug     text not null,          -- slug3 do município
  com_slug     text not null,          -- slug3 da comuna (= banda)
  is_municipality boolean not null default false,
  best_effort  boolean not null default false,
  primary key (country_code, city, banda_norm)
);

alter table public.afroloc_banda_division enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='afroloc_banda_division' and policyname='ref read') then
    create policy "ref read" on public.afroloc_banda_division for select using (true);
  end if;
end $$;

insert into public.afroloc_banda_division
  (country_code, city, banda_norm, prov_seg, mun_slug, com_slug, is_municipality, best_effort) values
  -- bandas que SÃO município de Luanda (comuna = sede homónima)
  ('AO','Luanda','camama',     'LUA','CAM','CAM', true,  false),
  ('AO','Luanda','kilamba',    'LUA','KIL','KIL', true,  false),
  ('AO','Luanda','maianga',    'LUA','MAI','MAI', true,  false),
  ('AO','Luanda','rangel',     'LUA','RAN','RAN', true,  false),
  ('AO','Luanda','samba',      'LUA','SAM','SAM', true,  false),
  ('AO','Luanda','sambizanga', 'LUA','SAM','SAM', true,  false),
  ('AO','Luanda','talatona',   'LUA','TAL','TAL', true,  false),
  ('AO','Luanda','viana',      'LUA','VIA','VIA', true,  false),
  -- bandas sub-municipais → município-pai; a banda vira comuna
  ('AO','Luanda','alvalade',        'LUA','MAI','ALV', false, false),  -- Maianga
  ('AO','Luanda','rocha pinto',     'LUA','MAI','ROC', false, false),  -- Maianga
  ('AO','Luanda','mutamba',         'LUA','ING','MUT', false, false),  -- Ingombota
  ('AO','Luanda','benfica',         'LUA','BEL','BEN', false, false),  -- Belas
  ('AO','Luanda','morro bento',     'LUA','TAL','MOR', false, false),  -- Talatona
  ('AO','Luanda','lar do patriota', 'LUA','TAL','LAR', false, true),   -- Talatona (limite Belas/Talatona)
  ('AO','Luanda','patriota',        'LUA','TAL','PAT', false, true),   -- Talatona (limite Belas/Talatona)
  ('AO','Luanda','gamek',           'LUA','KIL','GAM', false, true)    -- Kilamba Kiaxi (limite Maianga)
on conflict (country_code, city, banda_norm) do update set
  prov_seg=excluded.prov_seg, mun_slug=excluded.mun_slug, com_slug=excluded.com_slug,
  is_municipality=excluded.is_municipality, best_effort=excluded.best_effort;

-- ── Geração passa a resolver as divisões de Angola pelo mapa ────────────────
create or replace function public.set_afroloc_code()
returns trigger language plpgsql as $$
declare
  v_prov text; v_mun text; v_com text;
begin
  if new.latitude is null or new.longitude is null then
    return new;
  end if;
  if upper(coalesce(new.country_code,'')) = 'AO'
     and new.city is not null and new.neighborhood is not null then
    select prov_seg, mun_slug, com_slug into v_prov, v_mun, v_com
      from public.afroloc_banda_division
     where country_code = 'AO'
       and lower(city) = lower(new.city)
       and banda_norm = lower(btrim(new.neighborhood))
     limit 1;
  end if;
  new.afroloc_code := public.afroloc_nom(
    coalesce(upper(new.country_code),'AO'), v_prov, v_mun, v_com,
    new.latitude, new.longitude
  );
  return new;
end;
$$;

-- generate_afroloc_code espelha a mesma resolução (uso pontual/manual).
create or replace function public.generate_afroloc_code(p_user_id uuid)
returns text language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_cc text; v_lat double precision; v_lng double precision;
  v_city text; v_nb text; v_prov text; v_mun text; v_com text;
begin
  select upper(country_code), latitude, longitude, city, neighborhood
    into v_cc, v_lat, v_lng, v_city, v_nb
    from public.profiles where id = p_user_id;
  if v_lat is null or v_lng is null then return null; end if;
  if v_cc = 'AO' and v_city is not null and v_nb is not null then
    select prov_seg, mun_slug, com_slug into v_prov, v_mun, v_com
      from public.afroloc_banda_division
     where country_code='AO' and lower(city)=lower(v_city) and banda_norm=lower(btrim(v_nb)) limit 1;
  end if;
  return public.afroloc_nom(coalesce(v_cc,'AO'), v_prov, v_mun, v_com, v_lat, v_lng);
end;
$$;

notify pgrst, 'reload schema';
