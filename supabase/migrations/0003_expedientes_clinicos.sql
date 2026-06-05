-- 0003 - Expedientes clinicos sobre notas de sesion.

alter table public.notas_sesion
add column if not exists paciente_id uuid references public.pacientes(id) on delete cascade;

alter table public.notas_sesion
add column if not exists titulo text;

alter table public.notas_sesion
add column if not exists tipo text not null default 'nota_sesion';

alter table public.notas_sesion
add column if not exists fecha_clinica date not null default current_date;

alter table public.notas_sesion
add column if not exists observaciones text;

alter table public.notas_sesion
add column if not exists transcripcion_supervision text;

update public.notas_sesion ns
set paciente_id = c.paciente_id
from public.citas c
where ns.cita_id = c.id
  and ns.paciente_id is null;

alter table public.notas_sesion
drop constraint if exists notas_sesion_tipo_check;

alter table public.notas_sesion
add constraint notas_sesion_tipo_check
check (tipo in ('nota_sesion', 'observacion', 'supervision'));

create index if not exists idx_notas_sesion_paciente_fecha
on public.notas_sesion(paciente_id, fecha_clinica desc);

create or replace function public.set_nota_sesion_paciente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cita_record record;
begin
  select paciente_id, psicologo_id
  into cita_record
  from public.citas
  where id = new.cita_id;

  if cita_record.paciente_id is null then
    raise exception 'La cita seleccionada no existe.';
  end if;

  if cita_record.psicologo_id <> new.psicologo_id then
    raise exception 'La cita no pertenece al psicologo indicado.';
  end if;

  new.paciente_id = cita_record.paciente_id;
  return new;
end;
$$;

drop trigger if exists set_nota_sesion_paciente on public.notas_sesion;
create trigger set_nota_sesion_paciente
before insert or update of cita_id, psicologo_id, paciente_id on public.notas_sesion
for each row execute function public.set_nota_sesion_paciente();

notify pgrst, 'reload schema';
