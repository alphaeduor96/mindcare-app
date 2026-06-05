-- Corrige el error:
-- 42P17 infinite recursion detected in policy for relation "empresas"
--
-- Ejecuta este archivo en Supabase SQL Editor.

create or replace function public.is_psychologist_profile_owner(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.psicologos p
    where p.id = profile_id
      and p.usuario_id = auth.uid()
  );
$$;

create or replace function public.is_company_owner(company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.empresas e
    where e.id = company_id
      and e.usuario_id = auth.uid()
  );
$$;

create or replace function public.is_employee_for_company(company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.empleados em
    where em.empresa_id = company_id
      and em.usuario_id = auth.uid()
  );
$$;

create or replace function public.is_employee_record_owner(employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.empleados em
    where em.id = employee_id
      and em.usuario_id = auth.uid()
  );
$$;

create or replace function public.is_patient_user_owner(patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pacientes pa
    where pa.id = patient_id
      and pa.usuario_id = auth.uid()
  );
$$;

create or replace function public.is_patient_related_to_current_psychologist(patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.citas c
    where c.paciente_id = patient_id
      and public.is_psychologist_profile_owner(c.psicologo_id)
  );
$$;

create or replace function public.is_appointment_related_to_current_user(appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.citas c
    where c.id = appointment_id
      and (
        public.is_psychologist_profile_owner(c.psicologo_id)
        or public.is_patient_user_owner(c.paciente_id)
        or public.is_employee_record_owner(c.empleado_id)
        or public.is_company_owner(c.empresa_id)
      )
  );
$$;

drop policy if exists "empresas_select_related" on public.empresas;
create policy "empresas_select_related"
on public.empresas for select
to authenticated
using (
  public.is_admin()
  or usuario_id = auth.uid()
  or public.is_employee_for_company(id)
);

drop policy if exists "contratos_empresa_select_company_or_admin" on public.contratos_empresa;
create policy "contratos_empresa_select_company_or_admin"
on public.contratos_empresa for select
to authenticated
using (
  public.is_admin()
  or public.is_company_owner(empresa_id)
);

drop policy if exists "empleados_select_related" on public.empleados;
create policy "empleados_select_related"
on public.empleados for select
to authenticated
using (
  public.is_admin()
  or usuario_id = auth.uid()
  or public.is_company_owner(empresa_id)
);

drop policy if exists "empleados_update_company_or_admin" on public.empleados;
create policy "empleados_update_company_or_admin"
on public.empleados for update
to authenticated
using (
  public.is_admin()
  or public.is_company_owner(empresa_id)
)
with check (
  public.is_admin()
  or public.is_company_owner(empresa_id)
);

drop policy if exists "pacientes_select_related" on public.pacientes;
create policy "pacientes_select_related"
on public.pacientes for select
to authenticated
using (
  public.is_admin()
  or usuario_id = auth.uid()
  or public.is_employee_record_owner(empleado_id)
  or public.is_psychologist_profile_owner(creado_por_psicologo_id)
  or public.is_patient_related_to_current_psychologist(id)
);

drop policy if exists "pacientes_write_owner_psychologist_or_admin" on public.pacientes;
create policy "pacientes_write_owner_psychologist_or_admin"
on public.pacientes for all
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(creado_por_psicologo_id)
)
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(creado_por_psicologo_id)
);

drop policy if exists "citas_select_related" on public.citas;
create policy "citas_select_related"
on public.citas for select
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
  or public.is_patient_user_owner(paciente_id)
  or public.is_employee_record_owner(empleado_id)
  or public.is_company_owner(empresa_id)
);

drop policy if exists "citas_write_psychologist_company_or_admin" on public.citas;
create policy "citas_write_psychologist_company_or_admin"
on public.citas for all
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
  or public.is_company_owner(empresa_id)
)
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
  or public.is_company_owner(empresa_id)
);

drop policy if exists "pagos_cita_select_related" on public.pagos_cita;
create policy "pagos_cita_select_related"
on public.pagos_cita for select
to authenticated
using (
  public.is_admin()
  or public.is_appointment_related_to_current_user(cita_id)
);

select
  'rls_empresas_recursion_fixed' as status,
  now() as fixed_at;
