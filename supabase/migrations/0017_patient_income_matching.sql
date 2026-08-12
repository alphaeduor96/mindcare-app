create table if not exists public.ingresos_paciente (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  monto_centavos integer not null check (monto_centavos > 0),
  moneda char(3) not null default 'MXN',
  estado text not null default 'pendiente_aplicar'
    check (estado in ('pendiente_aplicar', 'aplicado', 'cancelado')),
  fecha_pago date not null default current_date,
  referencia text,
  notas text,
  aplicado_a_cita_id uuid references public.citas(id) on delete set null,
  aplicado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_ingresos_paciente_updated_at
before update on public.ingresos_paciente
for each row execute function public.set_updated_at();

create index if not exists idx_ingresos_paciente_psicologo
on public.ingresos_paciente(psicologo_id);

create index if not exists idx_ingresos_paciente_estado
on public.ingresos_paciente(estado);

alter table public.ingresos_paciente enable row level security;

drop policy if exists "ingresos_paciente_owner_select" on public.ingresos_paciente;
create policy "ingresos_paciente_owner_select"
on public.ingresos_paciente for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "ingresos_paciente_owner_insert" on public.ingresos_paciente;
create policy "ingresos_paciente_owner_insert"
on public.ingresos_paciente for insert
to authenticated
with check (
  exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "ingresos_paciente_owner_update" on public.ingresos_paciente;
create policy "ingresos_paciente_owner_update"
on public.ingresos_paciente for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);
