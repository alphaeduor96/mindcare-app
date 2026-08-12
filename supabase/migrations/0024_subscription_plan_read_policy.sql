-- 0024 - Permite leer planes activos desde el panel de psicologo.
-- Los planes no contienen datos sensibles y deben ser visibles para calcular limites.

drop policy if exists "planes_suscripcion_select_active" on public.planes_suscripcion_psicologo;
drop policy if exists "planes_suscripcion_public_read_active" on public.planes_suscripcion_psicologo;

create policy "planes_suscripcion_public_read_active"
on public.planes_suscripcion_psicologo
for select
to anon, authenticated
using (activo = true or public.is_admin());

notify pgrst, 'reload schema';
