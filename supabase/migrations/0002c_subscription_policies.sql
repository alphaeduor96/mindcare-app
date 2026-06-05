-- 0002C - Policies de suscripcion, tarjeta e historial de facturacion.
-- Ejecutar despues de 0002B.

drop policy if exists "planes_suscripcion_select_active" on public.planes_suscripcion_psicologo;
create policy "planes_suscripcion_select_active"
on public.planes_suscripcion_psicologo for select
to authenticated
using (activo = true or public.is_admin());

drop policy if exists "suscripciones_psicologo_select_owner_or_admin" on public.suscripciones_psicologo;
create policy "suscripciones_psicologo_select_owner_or_admin"
on public.suscripciones_psicologo for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "suscripciones_psicologo_write_owner_or_admin" on public.suscripciones_psicologo;
create policy "suscripciones_psicologo_write_owner_or_admin"
on public.suscripciones_psicologo for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "stripe_billing_customers_select_owner_or_admin" on public.stripe_billing_customers;
create policy "stripe_billing_customers_select_owner_or_admin"
on public.stripe_billing_customers for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "stripe_billing_customers_write_owner_or_admin" on public.stripe_billing_customers;
create policy "stripe_billing_customers_write_owner_or_admin"
on public.stripe_billing_customers for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "psychologist_billing_documents_select_owner_or_admin" on public.psychologist_billing_documents;
create policy "psychologist_billing_documents_select_owner_or_admin"
on public.psychologist_billing_documents for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "psychologist_billing_documents_admin_write" on public.psychologist_billing_documents;
create policy "psychologist_billing_documents_admin_write"
on public.psychologist_billing_documents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

notify pgrst, 'reload schema';
