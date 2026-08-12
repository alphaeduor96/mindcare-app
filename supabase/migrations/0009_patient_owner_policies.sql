-- 0009 - Policies mínimas para que psicólogos creen y administren sus pacientes privados.

drop policy if exists "pacientes_write_owner_psychologist_or_admin" on public.pacientes;

create policy "pacientes_write_owner_psychologist_or_admin"
on public.pacientes for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = creado_por_psicologo_id
      and p.usuario_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = creado_por_psicologo_id
      and p.usuario_id = auth.uid()
  )
);

drop policy if exists "pacientes_select_related" on public.pacientes;

create policy "pacientes_select_related"
on public.pacientes for select
to authenticated
using (
  public.is_admin()
  or usuario_id = auth.uid()
  or exists (
    select 1
    from public.psicologos p
    where p.id = creado_por_psicologo_id
      and p.usuario_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
