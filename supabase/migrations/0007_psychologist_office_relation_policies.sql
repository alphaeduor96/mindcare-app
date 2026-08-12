-- Allow psychologists to link, update, and unlink their own offices.
-- The base schema had select policies for psicologo_consultorios, but not write policies.

drop policy if exists "psicologo_consultorios_psychologist_insert" on public.psicologo_consultorios;
drop policy if exists "psicologo_consultorios_psychologist_update" on public.psicologo_consultorios;
drop policy if exists "psicologo_consultorios_psychologist_delete" on public.psicologo_consultorios;

create policy "psicologo_consultorios_psychologist_insert"
on public.psicologo_consultorios for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = psicologo_id
      and p.usuario_id = auth.uid()
  )
);

create policy "psicologo_consultorios_psychologist_update"
on public.psicologo_consultorios for update
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

create policy "psicologo_consultorios_psychologist_delete"
on public.psicologo_consultorios for delete
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = psicologo_id
      and p.usuario_id = auth.uid()
  )
);
