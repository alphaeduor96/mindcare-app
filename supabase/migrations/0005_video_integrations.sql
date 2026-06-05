-- 0005 - Integraciones Zoom / Google Meet para videollamadas.

alter table public.videollamada_sesiones
add column if not exists join_url text;

alter table public.videollamada_sesiones
add column if not exists start_url text;

alter table public.videollamada_sesiones
add column if not exists provider_meeting_id text;

alter table public.videollamada_sesiones
drop constraint if exists videollamada_sesiones_proveedor_check;

alter table public.videollamada_sesiones
add constraint videollamada_sesiones_proveedor_check
check (proveedor in ('mindcare_webrtc', 'zoom', 'google_meet'));

create table if not exists public.video_integraciones (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  proveedor text not null check (proveedor in ('zoom', 'google_meet')),
  cuenta_email text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text,
  estado text not null default 'activa' check (estado in ('activa', 'revocada')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(psicologo_id, proveedor)
);

drop trigger if exists set_video_integraciones_updated_at on public.video_integraciones;
create trigger set_video_integraciones_updated_at
before update on public.video_integraciones
for each row execute function public.set_updated_at();

create table if not exists public.video_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_token text not null unique,
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  proveedor text not null check (proveedor in ('zoom', 'google_meet')),
  redirect_origin text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_video_oauth_states_token
on public.video_oauth_states(state_token);

alter table public.video_integraciones enable row level security;
alter table public.video_oauth_states enable row level security;

drop policy if exists "video_integraciones_psychologist_owner" on public.video_integraciones;
create policy "video_integraciones_psychologist_owner"
on public.video_integraciones for all
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
)
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
);

revoke select on table public.video_integraciones from anon, authenticated;
grant select (
  id,
  psicologo_id,
  proveedor,
  cuenta_email,
  token_expires_at,
  scopes,
  estado,
  created_at,
  updated_at
) on public.video_integraciones to authenticated;

drop policy if exists "video_oauth_states_psychologist_owner" on public.video_oauth_states;
create policy "video_oauth_states_psychologist_owner"
on public.video_oauth_states for select
to authenticated
using (
  public.is_admin()
  or usuario_id = auth.uid()
  or public.is_psychologist_profile_owner(psicologo_id)
);

notify pgrst, 'reload schema';
