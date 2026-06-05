-- Permite CRUD real de consultorios desde el panel de psicologo.
-- El borrado en la app es logico: actualiza estado = 'inactivo'.

drop policy if exists "consultorios_select_active" on public.consultorios;
create policy "consultorios_select_active"
on public.consultorios for select
to authenticated
using (
  estado = 'activo'
  or public.current_user_role() in ('admin', 'psicologo')
);

drop policy if exists "consultorios_psychologist_insert" on public.consultorios;
create policy "consultorios_psychologist_insert"
on public.consultorios for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'psicologo')
);

drop policy if exists "consultorios_psychologist_update" on public.consultorios;
create policy "consultorios_psychologist_update"
on public.consultorios for update
to authenticated
using (
  public.current_user_role() in ('admin', 'psicologo')
)
with check (
  public.current_user_role() in ('admin', 'psicologo')
);

select
  'consultorios_crud_rls_fixed' as status,
  now() as fixed_at;
