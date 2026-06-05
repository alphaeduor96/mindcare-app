-- Permisos RLS para que el panel administrador pueda listar psicologos
-- con su usuario, estado y datos de registro.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and u.rol = 'admin'
      and coalesce(u.estado, 'activo') = 'activo'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "usuarios_select_own_or_admin" on public.usuarios;
create policy "usuarios_select_own_or_admin"
on public.usuarios for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "usuarios_update_own_or_admin" on public.usuarios;
create policy "usuarios_update_own_or_admin"
on public.usuarios for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "psicologos_select_directory_or_owner_or_admin" on public.psicologos;
create policy "psicologos_select_directory_or_owner_or_admin"
on public.psicologos for select
to authenticated
using (
  estado = 'activo'
  or usuario_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "psicologos_update_owner_or_admin" on public.psicologos;
create policy "psicologos_update_owner_or_admin"
on public.psicologos for update
to authenticated
using (usuario_id = auth.uid() or public.is_admin())
with check (usuario_id = auth.uid() or public.is_admin());
