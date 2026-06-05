-- Crea tokens privados para feeds iCal/.ics por psicologo.
-- Ejecuta este archivo en Supabase SQL Editor antes de usar "Feed iCal" en la app.

create table if not exists public.calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null unique references public.psicologos(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_calendar_feeds_updated_at on public.calendar_feeds;
create trigger set_calendar_feeds_updated_at
before update on public.calendar_feeds
for each row execute function public.set_updated_at();

create index if not exists idx_calendar_feeds_token on public.calendar_feeds(token);
create index if not exists idx_calendar_feeds_psicologo on public.calendar_feeds(psicologo_id);

alter table public.calendar_feeds enable row level security;

drop policy if exists "calendar_feeds_select_owner_or_admin" on public.calendar_feeds;
create policy "calendar_feeds_select_owner_or_admin"
on public.calendar_feeds for select
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
);

drop policy if exists "calendar_feeds_insert_owner_or_admin" on public.calendar_feeds;
create policy "calendar_feeds_insert_owner_or_admin"
on public.calendar_feeds for insert
to authenticated
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
);

drop policy if exists "calendar_feeds_update_owner_or_admin" on public.calendar_feeds;
create policy "calendar_feeds_update_owner_or_admin"
on public.calendar_feeds for update
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
)
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
);

insert into public.calendar_feeds (psicologo_id)
select p.id
from public.psicologos p
left join public.calendar_feeds cf on cf.psicologo_id = p.id
where cf.id is null;

select 'calendar_feeds_ready' as status, count(*) as feeds
from public.calendar_feeds;
