-- Crea un usuario demo por rol en Supabase Auth y public.usuarios.
-- Ejecutar en Supabase SQL Editor del proyecto ssnfoheivrzhbfsrnswi.
--
-- Password para todos:
--   MindCare2026!

create extension if not exists pgcrypto;

do $$
declare
  demo_password text := 'MindCare2026!';
  demo_users jsonb := '[
    {
      "email": "admin.demo@example.com",
      "nombre": "Admin",
      "apellido": "Demo",
      "rol": "admin"
    },
    {
      "email": "psicologo.demo@example.com",
      "nombre": "Psicologo",
      "apellido": "Demo",
      "rol": "psicologo"
    },
    {
      "email": "empresa.demo@example.com",
      "nombre": "Empresa",
      "apellido": "Demo",
      "rol": "empresa"
    },
    {
      "email": "empleado.demo@example.com",
      "nombre": "Empleado",
      "apellido": "Demo",
      "rol": "empleado"
    }
  ]'::jsonb;
  item jsonb;
  auth_user_id uuid;
begin
  for item in select * from jsonb_array_elements(demo_users)
  loop
    select id
      into auth_user_id
    from auth.users
    where email = lower(item->>'email')
    limit 1;

    if auth_user_id is null then
      auth_user_id := gen_random_uuid();

      insert into auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
      )
      values (
        auth_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        lower(item->>'email'),
        crypt(demo_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
          'nombre', item->>'nombre',
          'apellido', item->>'apellido',
          'rol', item->>'rol',
          'telefono', '+52 33 0000 0000'
        ),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );

      insert into auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      values (
        auth_user_id,
        auth_user_id,
        lower(item->>'email'),
        jsonb_build_object(
          'sub', auth_user_id::text,
          'email', lower(item->>'email'),
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
      )
      on conflict (provider, provider_id) do nothing;
    else
      update auth.users
      set
        encrypted_password = crypt(demo_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object(
          'nombre', item->>'nombre',
          'apellido', item->>'apellido',
          'rol', item->>'rol',
          'telefono', '+52 33 0000 0000'
        ),
        updated_at = now()
      where id = auth_user_id;
    end if;

    insert into public.usuarios (
      id,
      email,
      nombre,
      apellido,
      telefono,
      rol,
      estado
    )
    values (
      auth_user_id,
      lower(item->>'email'),
      item->>'nombre',
      item->>'apellido',
      '+52 33 0000 0000',
      (item->>'rol')::public.user_role,
      'activo'::public.record_status
    )
    on conflict (id) do update
    set
      email = excluded.email,
      nombre = excluded.nombre,
      apellido = excluded.apellido,
      telefono = excluded.telefono,
      rol = excluded.rol,
      estado = 'activo'::public.record_status,
      updated_at = now();
  end loop;
end $$;

select
  email,
  raw_user_meta_data->>'rol' as rol,
  email_confirmed_at is not null as confirmado
from auth.users
where email in (
  'admin.demo@example.com',
  'psicologo.demo@example.com',
  'empresa.demo@example.com',
  'empleado.demo@example.com'
)
order by email;
