-- Crea o repara el perfil de psicologo para un usuario existente de Supabase Auth.
-- Cambia solo este correo por el email con el que estas iniciando sesion como psicologo.
create temp table if not exists _mindcare_target_psicologo(email text) on commit drop;
truncate table _mindcare_target_psicologo;
insert into _mindcare_target_psicologo(email) values ('psicologo.demo@example.com');

do $$
declare
  target_email text;
  profile_user_id uuid;
begin
  select email into target_email from _mindcare_target_psicologo limit 1;

  select id
    into profile_user_id
  from auth.users
  where email = lower(target_email)
  limit 1;

  if profile_user_id is null then
    raise exception 'No existe usuario Auth con email %', target_email;
  end if;

  insert into public.psicologos (
    usuario_id,
    cedula_profesional,
    especialidades,
    enfoque_principal,
    biografia,
    anos_experiencia,
    membresia,
    tarifa_privada_centavos,
    tarifa_red_centavos,
    duracion_sesion_minutos,
    modalidades,
    acepta_nuevos_pacientes,
    verificado_at,
    estado
  )
  values (
    profile_user_id,
    'DEMO-' || substring(profile_user_id::text, 1, 8),
    array['general']::text[],
    'Psicologia general',
    'Perfil creado para habilitar el panel de psicologo.',
    0,
    'independiente_free'::public.psychologist_membership,
    80000,
    35000,
    60,
    array['virtual'::public.appointment_modality],
    true,
    now(),
    'activo'::public.record_status
  )
  on conflict (usuario_id) do update
  set
    estado = 'activo'::public.record_status,
    verificado_at = coalesce(public.psicologos.verificado_at, now()),
    updated_at = now();

  update public.usuarios
  set
    rol = 'psicologo'::public.user_role,
    estado = 'activo'::public.record_status,
    updated_at = now()
  where id = profile_user_id;
end $$;

select
  au.id as auth_user_id,
  au.email,
  u.rol,
  u.estado as usuario_estado,
  p.id as psicologo_id,
  p.estado as psicologo_estado,
  p.cedula_profesional
from auth.users au
left join public.usuarios u on u.id = au.id
left join public.psicologos p on p.usuario_id = au.id
where au.email = lower((select email from _mindcare_target_psicologo limit 1));
