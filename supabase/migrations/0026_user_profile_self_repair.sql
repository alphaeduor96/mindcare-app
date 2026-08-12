-- 0026 - Permite reparar public.usuarios cuando Auth ya tiene la cuenta.
-- Corre esto si al agregar tarjeta aparece que falta public.usuarios.

drop policy if exists "usuarios_insert_own_or_admin" on public.usuarios;
create policy "usuarios_insert_own_or_admin"
on public.usuarios
for insert
to authenticated
with check (
  id = auth.uid()
  or public.is_admin()
);

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
    'signup_source', coalesce(au.raw_user_meta_data->>'signup_source', 'repair'),
    'repaired_at', now()
  )
from auth.users au
where coalesce(au.raw_user_meta_data->>'rol', 'psicologo') = 'psicologo'
  and not exists (
    select 1 from public.usuarios u where u.id = au.id
  )
on conflict (id) do nothing;

notify pgrst, 'reload schema';
