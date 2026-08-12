-- Cambia el email por el correo del usuario psicólogo que estás probando.
with target_psychologist as (
  select p.id
  from public.psicologos p
  join public.usuarios u on u.id = p.usuario_id
  where lower(u.email) = lower('TU_EMAIL_AQUI')
  limit 1
)
insert into public.psicologo_configuracion (
  psicologo_id,
  horario_inicio,
  horario_cierre,
  duracion_sesion_minutos
)
select
  id,
  '08:00'::time,
  '22:00'::time,
  60
from target_psychologist
on conflict (psicologo_id) do update
set
  horario_inicio = excluded.horario_inicio,
  horario_cierre = excluded.horario_cierre,
  duracion_sesion_minutos = excluded.duracion_sesion_minutos,
  updated_at = now();

select
  u.email,
  p.id as psicologo_id,
  pc.horario_inicio,
  pc.horario_cierre
from public.psicologos p
join public.usuarios u on u.id = p.usuario_id
left join public.psicologo_configuracion pc on pc.psicologo_id = p.id
where lower(u.email) = lower('TU_EMAIL_AQUI');
