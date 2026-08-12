-- 0008 - Asegura que las altas self-service de psicólogos creen su perfil operativo.
-- También permite autocrear el perfil si una cuenta quedó creada antes de aplicar el trigger.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $mindcare_profile$
declare
  meta jsonb;
  user_role text;
  first_name text;
  last_name text;
  phone text;
  psychologist_id uuid;
  basic_plan_id uuid;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  user_role := coalesce(meta->>'rol', 'psicologo');

  if coalesce(meta->>'signup_source', '') <> 'self_service'
    and user_role <> 'psicologo' then
    return new;
  end if;

  first_name := nullif(trim(coalesce(meta->>'nombre', split_part(new.email, '@', 1))), '');
  last_name := nullif(
    trim(
      coalesce(
        meta->>'apellido',
        concat_ws(' ', nullif(meta->>'apellido_paterno', ''), nullif(meta->>'apellido_materno', ''))
      )
    ),
    ''
  );
  phone := nullif(trim(coalesce(meta->>'telefono', '')), '');

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
  values (
    new.id,
    lower(new.email),
    coalesce(first_name, 'Usuario'),
    coalesce(last_name, ''),
    phone,
    user_role::public.user_role,
    'activo',
    jsonb_build_object(
      'apellido_paterno', meta->>'apellido_paterno',
      'apellido_materno', meta->>'apellido_materno',
      'signup_source', coalesce(meta->>'signup_source', 'self_service')
    )
  )
  on conflict (id) do update
  set
    email = excluded.email,
    nombre = excluded.nombre,
    apellido = excluded.apellido,
    telefono = excluded.telefono,
    rol = excluded.rol,
    estado = excluded.estado,
    metadata = public.usuarios.metadata || excluded.metadata,
    updated_at = now();

  if user_role = 'psicologo' then
    insert into public.psicologos (
      usuario_id,
      cedula_profesional,
      especialidades,
      membresia,
      modalidades,
      acepta_nuevos_pacientes,
      estado
    )
    values (
      new.id,
      coalesce(nullif(meta->>'cedula_profesional', ''), 'PENDIENTE-' || new.id::text),
      case
        when nullif(meta->>'especialidad', '') is null then '{}'::text[]
        else array[meta->>'especialidad']
      end,
      'independiente_free',
      array['presencial'::public.appointment_modality, 'virtual'::public.appointment_modality],
      true,
      'activo'
    )
    on conflict (usuario_id) do update
    set
      estado = 'activo',
      membresia = coalesce(public.psicologos.membresia, 'independiente_free'),
      updated_at = now()
    returning id into psychologist_id;

    select id
      into basic_plan_id
    from public.planes_suscripcion_psicologo
    where codigo = 'basico'
    limit 1;

    if basic_plan_id is not null then
      insert into public.suscripciones_psicologo (
        psicologo_id,
        plan_id,
        estado
      )
      values (
        psychologist_id,
        basic_plan_id,
        'activa'
      )
      on conflict (psicologo_id) do nothing;
    end if;
  end if;

  return new;
end;
$mindcare_profile$;

drop trigger if exists on_auth_user_created_mindcare_profile on auth.users;
create trigger on_auth_user_created_mindcare_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop policy if exists "psicologos_insert_owner" on public.psicologos;
create policy "psicologos_insert_owner"
on public.psicologos for insert
to authenticated
with check (usuario_id = auth.uid() or public.is_admin());

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
    trim(concat_ws(' ', nullif(au.raw_user_meta_data->>'apellido_paterno', ''), nullif(au.raw_user_meta_data->>'apellido_materno', '')))
  ),
  nullif(trim(coalesce(au.raw_user_meta_data->>'telefono', '')), ''),
  'psicologo'::public.user_role,
  'activo'::public.record_status,
  jsonb_build_object(
    'apellido_paterno', au.raw_user_meta_data->>'apellido_paterno',
    'apellido_materno', au.raw_user_meta_data->>'apellido_materno',
    'signup_source', coalesce(au.raw_user_meta_data->>'signup_source', 'self_service'),
    'backfilled_at', now()
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

insert into public.suscripciones_psicologo (
  psicologo_id,
  plan_id,
  estado
)
select
  p.id,
  plan.id,
  'activa'
from public.psicologos p
join public.planes_suscripcion_psicologo plan on plan.codigo = 'basico'
where not exists (
  select 1 from public.suscripciones_psicologo s where s.psicologo_id = p.id
)
on conflict (psicologo_id) do nothing;

notify pgrst, 'reload schema';
