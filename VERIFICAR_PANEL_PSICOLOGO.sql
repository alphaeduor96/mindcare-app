-- Verifica por que el panel de psicologo no esta trayendo datos.
-- Cambia solo este correo por el email con el que estas iniciando sesion.

create temp table if not exists _mindcare_target_psicologo(email text) on commit drop;
truncate table _mindcare_target_psicologo;
insert into _mindcare_target_psicologo(email) values ('psicologo.demo@example.com');

select
  au.id as auth_user_id,
  au.email,
  u.id is not null as tiene_usuario,
  u.rol,
  u.estado as usuario_estado,
  p.id as psicologo_id,
  p.estado as psicologo_estado,
  p.cedula_profesional
from auth.users au
left join public.usuarios u on u.id = au.id
left join public.psicologos p on p.usuario_id = au.id
where au.email = lower((select email from _mindcare_target_psicologo limit 1));

select
  count(c.id) as citas_del_psicologo,
  count(distinct c.paciente_id) as pacientes_con_cita,
  count(c.id) filter (where c.estado = 'completada') as citas_completadas
from public.citas c
join public.psicologos p on p.id = c.psicologo_id
join auth.users au on au.id = p.usuario_id
where au.email = lower((select email from _mindcare_target_psicologo limit 1));

select
  count(pa.id) as pacientes_creados_por_psicologo
from public.pacientes pa
join public.psicologos p on p.id = pa.creado_por_psicologo_id
join auth.users au on au.id = p.usuario_id
where au.email = lower((select email from _mindcare_target_psicologo limit 1));

select
  routine_name,
  security_type
from information_schema.routines
where specific_schema = 'public'
  and routine_name in (
    'is_psychologist_profile_owner',
    'is_company_owner',
    'is_employee_for_company',
    'is_employee_record_owner',
    'is_patient_user_owner',
    'is_patient_related_to_current_psychologist',
    'is_appointment_related_to_current_user'
  )
order by routine_name;
