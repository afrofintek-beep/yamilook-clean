-- MOKUBICO private-space invites: who may enter a Quarto (1:1) or be a guest in
-- the Cozinha das Sis. Access is resolved in useSpaceRodas against this table.

create table if not exists public.palco_invites (
  id uuid primary key default gen_random_uuid(),
  palco_id uuid not null references public.palcos(id) on delete cascade,
  invited_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (palco_id, invited_user_id)
);

create index if not exists palco_invites_invited_user_idx on public.palco_invites (invited_user_id);
create index if not exists palco_invites_palco_idx on public.palco_invites (palco_id);

alter table public.palco_invites enable row level security;

-- The host may manage invites, but only for palcos they own (guide_id).
create policy "host manages palco invites" on public.palco_invites
  for all to authenticated
  using (invited_by = auth.uid())
  with check (
    invited_by = auth.uid()
    and exists (select 1 from public.palcos p where p.id = palco_id and p.guide_id = auth.uid())
  );

-- The invited user can see that they were invited (needed to unlock the space).
create policy "invitee sees own palco invite" on public.palco_invites
  for select to authenticated
  using (invited_user_id = auth.uid());
