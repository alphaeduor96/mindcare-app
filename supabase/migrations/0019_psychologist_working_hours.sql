create table if not exists public.psicologo_configuracion (
  psicologo_id uuid primary key references public.psicologos(id) on delete cascade,
  horario_inicio time not null default '08:00',
  horario_cierre time not null default '20:00',
  duracion_sesion_minutos integer not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psicologo_configuracion_horario_valido check (horario_cierre > horario_inicio),
  constraint psicologo_configuracion_duracion_valida check (duracion_sesion_minutos between 30 and 180)
);

drop trigger if exists set_psicologo_configuracion_updated_at on public.psicologo_configuracion;
create trigger set_psicologo_configuracion_updated_at
before update on public.psicologo_configuracion
for each row execute function public.set_updated_at();

alter table public.psicologo_configuracion enable row level security;

drop policy if exists "psicologo_configuracion_owner_or_admin" on public.psicologo_configuracion;
create policy "psicologo_configuracion_owner_or_admin"
on public.psicologo_configuracion for all
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
)
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
);

create or replace function public.validar_cita_en_horario_psicologo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inicio time;
  cierre time;
  cita_inicio time;
  cita_cierre time;
begin
  select pc.horario_inicio, pc.horario_cierre
  into inicio, cierre
  from public.psicologo_configuracion pc
  where pc.psicologo_id = new.psicologo_id;

  inicio := coalesce(inicio, '08:00'::time);
  cierre := coalesce(cierre, '20:00'::time);
  cita_inicio := (new.inicia_at at time zone 'America/Mexico_City')::time;
  cita_cierre := (new.termina_at at time zone 'America/Mexico_City')::time;

  if cita_inicio < inicio or cita_cierre > cierre then
    raise exception 'La cita debe quedar dentro del horario configurado del psicólogo (% a %).', inicio, cierre
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_cita_en_horario_psicologo on public.citas;
create trigger validar_cita_en_horario_psicologo
before insert or update of inicia_at, termina_at, psicologo_id on public.citas
for each row execute function public.validar_cita_en_horario_psicologo();

notify pgrst, 'reload schema';
