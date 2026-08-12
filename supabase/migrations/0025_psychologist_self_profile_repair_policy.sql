-- 0025 - Permite reparar perfiles de psicologo faltantes para usuarios nuevos.
-- Necesario cuando el usuario existe pero no tiene fila en public.psicologos.

drop policy if exists "psicologos_insert_owner" on public.psicologos;
create policy "psicologos_insert_owner"
on public.psicologos
for insert
to authenticated
with check (
  usuario_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "suscripciones_psicologo_write_owner_or_admin" on public.suscripciones_psicologo;
create policy "suscripciones_psicologo_write_owner_or_admin"
on public.suscripciones_psicologo
for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = psicologo_id
      and p.usuario_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = psicologo_id
      and p.usuario_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
