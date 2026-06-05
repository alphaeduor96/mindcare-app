-- 0004 - Sesiones virtuales para videollamadas propias.

create table if not exists public.videollamada_sesiones (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  cita_id uuid not null references public.citas(id) on delete cascade,
  sala_token uuid not null unique default gen_random_uuid(),
  codigo_acceso text not null,
  duracion_minutos integer not null default 50 check (duracion_minutos between 5 and 240),
  inicia_at timestamptz not null,
  expira_at timestamptz not null,
  estado text not null default 'programada'
    check (estado in ('programada', 'activa', 'finalizada', 'cancelada', 'expirada')),
  proveedor text not null default 'mindcare_webrtc',
  provider_room_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint videollamada_expira_valida check (expira_at > inicia_at)
);

drop trigger if exists set_videollamada_sesiones_updated_at on public.videollamada_sesiones;
create trigger set_videollamada_sesiones_updated_at
before update on public.videollamada_sesiones
for each row execute function public.set_updated_at();

create index if not exists idx_videollamada_sesiones_psicologo_fecha
on public.videollamada_sesiones(psicologo_id, inicia_at desc);

create index if not exists idx_videollamada_sesiones_paciente_fecha
on public.videollamada_sesiones(paciente_id, inicia_at desc);

create index if not exists idx_videollamada_sesiones_cita
on public.videollamada_sesiones(cita_id);

alter table public.videollamada_sesiones enable row level security;

drop policy if exists "videollamada_psychologist_owner_all" on public.videollamada_sesiones;
create policy "videollamada_psychologist_owner_all"
on public.videollamada_sesiones for all
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
)
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
);

drop policy if exists "videollamada_patient_select" on public.videollamada_sesiones;
create policy "videollamada_patient_select"
on public.videollamada_sesiones for select
to authenticated
using (
  public.is_admin()
  or public.is_patient_user_owner(paciente_id)
  or public.is_employee_record_owner((
    select p.empleado_id from public.pacientes p where p.id = paciente_id
  ))
);

notify pgrst, 'reload schema';
