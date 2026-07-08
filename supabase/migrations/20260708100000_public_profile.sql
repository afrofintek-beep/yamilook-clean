-- Public profile lookup for the ecosystem (Yamioo → Yamilook deep-links).
-- profiles is RLS-restricted to authenticated users, and public_profiles is a
-- security_invoker view (so anon sees 0 rows). This SECURITY DEFINER function
-- exposes ONLY a curated, public-safe field set for a single username, callable
-- by anonymous visitors arriving from another app in the ecosystem.

create or replace function public.get_public_profile(p_username text)
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'username', p.username,
    'avatar_url', p.avatar_url,
    'bio', p.bio,
    'status_message', p.status_message,
    'afroloc_code', p.afroloc_code,
    'afroloc_certified', (p.afroloc_certification_status = 'certified'),
    'is_creator', coalesce(p.is_creator, false),
    'founder_number', p.founder_number,
    'created_at', p.created_at
  )
  from public.profiles p
  where lower(p.username) = lower(p_username)
  limit 1;
$$;

grant execute on function public.get_public_profile(text) to anon, authenticated;
