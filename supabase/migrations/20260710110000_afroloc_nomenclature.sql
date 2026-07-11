-- ============================================================================
-- Yamilook — adoção da nomenclatura de endereços AFROLOC (pan-africana)
-- ----------------------------------------------------------------------------
-- Substitui o placeholder `AFRO-<CIDADE>-<BANDA>-<sufixo>` pelo CODEC CANÓNICO
-- da AFROLOC. O algoritmo (Web Mercator EPSG:3857 + base36 zig-zag) é IDÊNTICO
-- ao do Yamioo (migração 0003) e ao JS de referência (afroloc-app/src/lib/afroloc),
-- por isso o MESMO local gera o MESMO código em toda a Afrofintek.
--
-- Princípios (decididos com o dono):
--   • Pan-africano: `administrative_divisions` é agnóstico ao país (54 países),
--     `afroloc_countries` guarda a nomenclatura própria (província/estado/wilaya…)
--     e as línguas de cada país. Ver seed 20260710120000.
--   • O código SEGUE a localização (não é fixo): recalculado quando a posição
--     (lat/lng/país) muda — AFROLOC é um código de LUGAR, determinístico.
--   • IP: o algoritmo vive no servidor (SQL), nunca no bundle do frontend.
--
-- Fase A (esta migração): CC + grelha GPS → forma canónica `CC-ZU-G10-X-Y`.
--   As divisões (PROV-MUN-COM-BAI) entram assim que forem resolvidas por
--   fronteiras (Fase B) ou recolhidas no onboarding.
-- ============================================================================

-- ── Codec AFROLOC em SQL (verbatim do Yamioo 0003; idêntico ao JS) ──────────

-- base36 do inteiro com sinal via zig-zag (n>=0 -> 2n ; n<0 -> -2n-1)
create or replace function public.afroloc_b36zz(n bigint)
returns text language plpgsql immutable as $$
declare
  u bigint;
  s text := '';
  d int;
  digits constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
begin
  u := case when n >= 0 then n * 2 else -n * 2 - 1 end;
  if u = 0 then return '0'; end if;
  while u > 0 loop
    d := (u % 36)::int;
    s := substr(digits, d + 1, 1) || s;
    u := u / 36;
  end loop;
  return s;
end;
$$;

-- Nomenclatura CC-PROV-MUN-COM-GEN-G10-X…-Y… (ou CC-ZU-G10-X…-Y… sem divisões).
-- IMMUTABLE. Assinatura e saída idênticas ao Yamioo para garantir consistência.
create or replace function public.afroloc_nom(
  p_cc text, p_prov text, p_mun text, p_zona text,
  p_lat double precision, p_lng double precision
) returns text language plpgsql immutable as $$
declare
  r      constant double precision := 6378137.0;
  maxlat constant double precision := 85.05112878;
  clat   double precision;
  x      double precision;
  y      double precision;
  ix     bigint;
  iy     bigint;
  xy     text;
  cc     text := upper(coalesce(p_cc, '??'));
begin
  if p_lat is null or p_lng is null then return null; end if;
  clat := greatest(-maxlat, least(maxlat, p_lat));
  x := r * (p_lng * pi() / 180);
  y := r * ln(tan(pi() / 4 + (clat * pi() / 180) / 2));
  ix := floor(x / 10)::bigint;           -- grelha urbana 10 m (G10)
  iy := floor(y / 10)::bigint;
  xy := 'X' || public.afroloc_b36zz(ix) || '-Y' || public.afroloc_b36zz(iy);
  if p_prov is not null and p_prov <> ''
     and p_mun is not null and p_mun <> ''
     and p_zona is not null and p_zona <> '' then
    return upper(cc || '-' || p_prov || '-' || p_mun || '-' || p_zona || '-GEN-G10-' || xy);
  end if;
  return cc || '-ZU-G10-' || xy;
end;
$$;

-- ── Dados de referência pan-africanos ───────────────────────────────────────

-- País: nomenclatura própria do nível 1 + línguas (para respeitar cada cultura).
create table if not exists public.afroloc_countries (
  iso                text primary key,          -- ISO-3166-1 alpha-2
  name               text not null,
  nivel1_type        text,                      -- 'província' | 'estado' | 'wilaya' | 'condado' | …
  official_languages text[] default '{}',
  spoken_languages   text[] default '{}'
);

-- Divisões administrativas, agnósticas ao país e a qualquer profundidade.
-- level 1 = província/estado/…, 2 = município/LGA/…, 3 = comuna/…
create table if not exists public.administrative_divisions (
  id           uuid primary key default gen_random_uuid(),
  country_code text not null references public.afroloc_countries(iso),
  level        int  not null,
  code         text not null unique,            -- ex. 'AO-BGO', 'AO-BGO-CAXITO'
  name         text not null,
  name_norm    text,
  parent_code  text,
  parent_level int,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);
create index if not exists admin_div_country_level_idx on public.administrative_divisions (country_code, level);
create index if not exists admin_div_parent_idx        on public.administrative_divisions (parent_code);
create index if not exists admin_div_name_norm_idx     on public.administrative_divisions (country_code, name_norm);

-- Referência é pública para leitura (dropdowns), escrita só service role/admin.
alter table public.afroloc_countries        enable row level security;
alter table public.administrative_divisions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='afroloc_countries' and policyname='ref read') then
    create policy "ref read" on public.afroloc_countries for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='administrative_divisions' and policyname='ref read') then
    create policy "ref read" on public.administrative_divisions for select using (true);
  end if;
end $$;

-- ── Posição persistida no perfil (o onboarding deixa de deitar o GPS fora) ──
alter table public.profiles add column if not exists latitude  double precision;
alter table public.profiles add column if not exists longitude double precision;

-- O código AFROLOC é de LUGAR, não identificador de pessoa: quem está no mesmo
-- sítio partilha o código (ex. um prédio). O placeholder antigo era único por
-- embutir um sufixo por-utilizador; o codec canónico NÃO pode ser único.
alter table public.profiles drop constraint if exists profiles_afroloc_code_key;
create index if not exists profiles_afroloc_code_idx on public.profiles (afroloc_code);

-- ── Geração do código AFROLOC do perfil (SEGUE a localização) ───────────────
-- Fase A: prov/mun não são recolhidos ainda → forma canónica CC-ZU-G10-X-Y.
-- Quando a resolução por fronteiras (Fase B) preencher as divisões, esta função
-- passa a emitir a nomenclatura completa sem mudar de assinatura.
create or replace function public.generate_afroloc_code(p_user_id uuid)
returns text language plpgsql stable security definer set search_path to 'public' as $$
declare
  v_cc   text;
  v_lat  double precision;
  v_lng  double precision;
begin
  select upper(country_code), latitude, longitude
    into v_cc, v_lat, v_lng
    from public.profiles where id = p_user_id;
  if v_lat is null or v_lng is null then
    return null;                                 -- sem posição não há código real
  end if;
  return public.afroloc_nom(coalesce(v_cc,'AO'), null, null, null, v_lat, v_lng);
end;
$$;

-- Trigger: recalcula sempre que a posição do perfil muda (código segue o lugar).
create or replace function public.set_afroloc_code()
returns trigger language plpgsql as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.afroloc_code := public.afroloc_nom(
      coalesce(upper(new.country_code),'AO'), null, null, null,
      new.latitude, new.longitude
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_afroloc_code on public.profiles;
create trigger trg_set_afroloc_code
  before insert or update of latitude, longitude, country_code on public.profiles
  for each row execute function public.set_afroloc_code();

notify pgrst, 'reload schema';
