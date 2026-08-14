-- Harden sensitive API surface exposed through PostgREST.
-- Keep the public psychologist directory readable, but make private views
-- obey the caller's RLS policies and remove anonymous access.

alter view public.v_citas_detalle set (security_invoker = true);
alter view public.v_cuentas_bancarias_estado set (security_invoker = true);
alter view public.v_saldos_paciente set (security_invoker = true);
alter view public.v_uso_empresa set (security_invoker = true);

revoke all privileges on table public.v_citas_detalle from anon, authenticated;
revoke all privileges on table public.v_cuentas_bancarias_estado from anon, authenticated;
revoke all privileges on table public.v_saldos_paciente from anon, authenticated;
revoke all privileges on table public.v_uso_empresa from anon, authenticated;

grant select on table public.v_citas_detalle to authenticated;
grant select on table public.v_cuentas_bancarias_estado to authenticated;
grant select on table public.v_saldos_paciente to authenticated;
grant select on table public.v_uso_empresa to authenticated;

-- Public directory stays public, but only as read-only view access.
revoke all privileges on table public.v_psicologos_directorio from anon, authenticated;
grant select on table public.v_psicologos_directorio to anon, authenticated;

-- Remove anonymous direct grants from private or internally managed tables.
revoke all privileges on table public.bloqueos_horario from anon;
revoke all privileges on table public.consultorios from anon;
revoke all privileges on table public.edge_rate_limits from anon, authenticated;
revoke all privileges on table public.psicologos from anon;
revoke all privileges on table public.psicologo_servicios from anon;
revoke all privileges on table public.videollamada_sesiones from anon;

-- Authenticated users do not need these elevated table capabilities.
revoke truncate, references, trigger on table public.bloqueos_horario from authenticated;
revoke truncate, references, trigger on table public.consultorios from authenticated;
revoke truncate, references, trigger on table public.psicologos from authenticated;
revoke truncate, references, trigger on table public.psicologo_servicios from authenticated;
revoke truncate, references, trigger on table public.videollamada_sesiones from authenticated;

drop policy if exists "bloqueos_horario_select_owner_or_admin" on public.bloqueos_horario;
drop policy if exists "bloqueos_horario_write_owner_or_admin" on public.bloqueos_horario;

create policy "bloqueos_horario_select_owner_or_admin"
on public.bloqueos_horario for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = bloqueos_horario.psicologo_id
      and p.usuario_id = auth.uid()
  )
);

create policy "bloqueos_horario_write_owner_or_admin"
on public.bloqueos_horario for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = bloqueos_horario.psicologo_id
      and p.usuario_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = bloqueos_horario.psicologo_id
      and p.usuario_id = auth.uid()
  )
);

drop policy if exists "consultorios_psychologist_update" on public.consultorios;

create policy "consultorios_psychologist_update"
on public.consultorios for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.psicologo_consultorios pc
    join public.psicologos p on p.id = pc.psicologo_id
    where pc.consultorio_id = consultorios.id
      and p.usuario_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.psicologo_consultorios pc
    join public.psicologos p on p.id = pc.psicologo_id
    where pc.consultorio_id = consultorios.id
      and p.usuario_id = auth.uid()
  )
);
