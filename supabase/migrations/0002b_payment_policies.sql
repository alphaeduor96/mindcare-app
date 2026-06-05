-- 0002B - Policies de pagos, cuentas bancarias y movimientos.
-- Ejecutar despues de 0002A.

drop policy if exists "pagos_cita_insert_psychologist_owner" on public.pagos_cita;
create policy "pagos_cita_insert_psychologist_owner"
on public.pagos_cita for insert
to authenticated
with check (
  estado = 'pagado'
  and exists (
    select 1
    from public.citas c
    join public.psicologos p on p.id = c.psicologo_id
    where c.id = cita_id and p.usuario_id = auth.uid()
  )
  and (
    cuenta_bancaria_id is null
    or exists (
      select 1
      from public.cuentas_bancarias cb
      join public.psicologos p on p.id = cb.psicologo_id
      where cb.id = cuenta_bancaria_id and p.usuario_id = auth.uid()
    )
  )
);

drop policy if exists "cuentas_bancarias_select_owner_or_admin" on public.cuentas_bancarias;
create policy "cuentas_bancarias_select_owner_or_admin"
on public.cuentas_bancarias for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "cuentas_bancarias_write_owner_or_admin" on public.cuentas_bancarias;
create policy "cuentas_bancarias_write_owner_or_admin"
on public.cuentas_bancarias for all
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

drop policy if exists "movimientos_cuenta_select_owner_or_admin" on public.movimientos_cuenta_bancaria;
create policy "movimientos_cuenta_select_owner_or_admin"
on public.movimientos_cuenta_bancaria for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.cuentas_bancarias cb
    join public.psicologos p on p.id = cb.psicologo_id
    where cb.id = cuenta_bancaria_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "movimientos_cuenta_write_owner_or_admin" on public.movimientos_cuenta_bancaria;
create policy "movimientos_cuenta_write_owner_or_admin"
on public.movimientos_cuenta_bancaria for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.cuentas_bancarias cb
    join public.psicologos p on p.id = cb.psicologo_id
    where cb.id = cuenta_bancaria_id and p.usuario_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.cuentas_bancarias cb
    join public.psicologos p on p.id = cb.psicologo_id
    where cb.id = cuenta_bancaria_id and p.usuario_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
