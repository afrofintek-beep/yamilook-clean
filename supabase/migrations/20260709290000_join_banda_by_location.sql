-- Phase 0: actually give users a banda. Onboarding chose a neighborhood but never
-- wrote user_bandas (memberships were seeded), so real users had no banda. This
-- RPC turns a neighborhood name into a real, active banda membership
-- (find-or-create the banda; one active membership per user). Onboarding calls it.
create or replace function public.join_banda_by_location(p_name text, p_city text, p_country text default 'Angola')
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_banda uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null or p_name is null or btrim(p_name) = '' then return null; end if;

  select id into v_banda from public.bandas
   where lower(name) = lower(btrim(p_name))
     and coalesce(lower(city), '') = coalesce(lower(btrim(p_city)), '')
   limit 1;

  if v_banda is null then
    insert into public.bandas(name, city, country)
    values (btrim(p_name), nullif(btrim(p_city), ''), coalesce(nullif(btrim(p_country), ''), 'Angola'))
    returning id into v_banda;
  end if;

  update public.user_bandas set is_active = false
   where user_id = v_uid and is_active = true and banda_id <> v_banda;

  insert into public.user_bandas(user_id, banda_id, is_active)
  values (v_uid, v_banda, true)
  on conflict (user_id, banda_id) do update set is_active = true;

  return v_banda;
end;
$$;
