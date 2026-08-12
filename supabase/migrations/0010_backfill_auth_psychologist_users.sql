-- 0010 - Backfill corto para cuentas de psicólogo creadas en Auth sin public.usuarios.

insert into public.usuarios (
  id,
  email,
  nombre,
  apellido,
  telefono,
  rol,
  estado,
  metadata
)
select
  au.id,
  lower(au.email),
  coalesce(nullif(trim(au.raw_user_meta_data->>'nombre'), ''), split_part(au.email, '@', 1)),
  coalesce(
    nullif(trim(au.raw_user_meta_data->>'apellido'), ''),
    nullif(trim(concat_ws(' ', au.raw_user_meta_data->>'apellido_paterno', au.raw_user_meta_data->>'apellido_materno')), ''),
    ''
  ),
  nullif(trim(coalesce(au.raw_user_meta_data->>'telefono', '')), ''),
  'psicologo'::public.user_role,
  'activo'::public.record_status,
  jsonb_build_object(
    'apellido_paterno', au.raw_user_meta_data->>'apellido_paterno',
    'apellido_materno', au.raw_user_meta_data->>'apellido_materno',
    'signup_source', coalesce(au.raw_user_meta_data->>'signup_source', 'self_service')
  )
from auth.users au
where coalesce(au.raw_user_meta_data->>'rol', '') = 'psicologo'
  and not exists (
    select 1 from public.usuarios u where u.id = au.id
  )
on conflict (id) do nothing;

insert into public.psicologos (
  usuario_id,
  cedula_profesional,
  especialidades,
  membresia,
  modalidades,
  acepta_nuevos_pacientes,
  estado
)
select
  u.id,
  'PENDIENTE-' || u.id::text,
  '{}'::text[],
  'independiente_free'::public.psychologist_membership,
  array['presencial'::public.appointment_modality, 'virtual'::public.appointment_modality],
  true,
  'activo'::public.record_status
from public.usuarios u
where u.rol = 'psicologo'
  and not exists (
    select 1 from public.psicologos p where p.usuario_id = u.id
  )
on conflict (usuario_id) do nothing;

notify pgrst, 'reload schema';
