-- 0002_06 - Policies para anticipos y saldos de pacientes.

drop policy if exists "pagos_anticipados_owner_or_admin" on public.pagos_anticipados_paciente;
create policy "pagos_anticipados_owner_or_admin"
on public.pagos_anticipados_paciente for all
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

drop policy if exists "movimientos_saldo_owner_or_admin" on public.movimientos_saldo_paciente;
create policy "movimientos_saldo_owner_or_admin"
on public.movimientos_saldo_paciente for all
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

notify pgrst, 'reload schema';
