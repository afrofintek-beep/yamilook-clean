-- Minimal, RLS-independent info a user needs to decide whether to request access
-- to a banda-restricted live: does it exist, who hosts it, do I already have
-- access, and what's my request status. Definer so a non-banda user (who can't
-- read the session) can still see this much.
create or replace function public.live_session_access_info(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_host uuid;
  v_status text;
  v_title text;
  v_host_name text;
  v_uid uuid := auth.uid();
  v_access boolean;
  v_req text;
begin
  select s.host_id, s.status, s.title, p.display_name
    into v_host, v_status, v_title, v_host_name
  from public.live_sessions s
  join public.profiles p on p.id = s.host_id
  where s.id = p_session_id;

  if v_host is null then
    return jsonb_build_object('exists', false);
  end if;

  v_access := (v_uid = v_host)
    or exists (
      select 1 from public.user_bandas uh
      join public.user_bandas um on um.banda_id = uh.banda_id
      where uh.user_id = v_host and uh.is_active and um.user_id = v_uid and um.is_active
    )
    or not exists (select 1 from public.user_bandas x where x.user_id = v_host and x.is_active)
    or exists (
      select 1 from public.live_access la
      where la.session_id = p_session_id and la.user_id = v_uid and la.status = 'approved'
    );

  select status into v_req from public.live_access where session_id = p_session_id and user_id = v_uid;

  return jsonb_build_object(
    'exists', true,
    'status', v_status,
    'host_name', v_host_name,
    'title', v_title,
    'has_access', v_access,
    'request_status', v_req
  );
end;
$$;
