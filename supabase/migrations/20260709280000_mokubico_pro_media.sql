-- Quintal voice/video is a Pro feature: add a user plan and a per-conversa
-- media flag; can_join reports it so the token can gate publishing.
alter table public.profiles add column if not exists plan text not null default 'free'
  check (plan in ('free','pro'));
alter table public.mokubico_conversas add column if not exists media_enabled boolean not null default true;

create or replace function public.can_join_mokubico_room(p_room text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_id uuid; v_host uuid; v_media boolean; v_uid uuid := auth.uid();
  v_is_host boolean; v_allowed boolean;
begin
  select id, host_id, media_enabled into v_id, v_host, v_media
  from public.mokubico_conversas where livekit_room_name = p_room
  order by started_at desc nulls last limit 1;
  if v_id is null then return jsonb_build_object('allowed', false, 'reason', 'no_conversa'); end if;
  v_is_host := (v_uid = v_host);
  v_allowed := v_is_host or exists (
    select 1 from public.mokubico_conversa_guests g where g.conversa_id = v_id and g.user_id = v_uid);
  return jsonb_build_object('allowed', v_allowed, 'is_host', v_is_host, 'conversa_id', v_id, 'media_enabled', coalesce(v_media, true));
end; $$;
