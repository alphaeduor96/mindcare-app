-- 0002_05 - Anticipos y saldos a favor de pacientes.

create table if not exists public.pagos_anticipados_paciente (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  cuenta_bancaria_id uuid references public.cuentas_bancarias(id) on delete set null,
  monto_centavos integer not null check (monto_centavos > 0),
  moneda char(3) not null default 'MXN',
  referencia text,
  notas text,
  pagado_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_pagos_anticipados_paciente_updated_at on public.pagos_anticipados_paciente;
create trigger set_pagos_anticipados_paciente_updated_at
before update on public.pagos_anticipados_paciente
for each row execute function public.set_updated_at();

create index if not exists idx_pagos_anticipados_psicologo
on public.pagos_anticipados_paciente(psicologo_id, pagado_at desc);

create index if not exists idx_pagos_anticipados_paciente
on public.pagos_anticipados_paciente(paciente_id);

create table if not exists public.movimientos_saldo_paciente (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  pago_anticipado_id uuid references public.pagos_anticipados_paciente(id) on delete set null,
  cita_id uuid references public.citas(id) on delete set null,
  tipo text not null check (tipo in ('ingreso', 'aplicacion', 'ajuste')),
  monto_centavos integer not null check (monto_centavos > 0),
  descripcion text,
  movimiento_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_movimientos_saldo_paciente
on public.movimientos_saldo_paciente(psicologo_id, paciente_id, movimiento_at desc);

create or replace view public.v_saldos_paciente as
select
  m.psicologo_id,
  m.paciente_id,
  p.nombre,
  p.apellido,
  coalesce(sum(
    case
      when m.tipo = 'ingreso' then m.monto_centavos
      when m.tipo = 'aplicacion' then -m.monto_centavos
      else m.monto_centavos
    end
  ), 0)::integer as saldo_centavos
from public.movimientos_saldo_paciente m
join public.pacientes p on p.id = m.paciente_id
group by m.psicologo_id, m.paciente_id, p.nombre, p.apellido;

alter table public.pagos_anticipados_paciente enable row level security;
alter table public.movimientos_saldo_paciente enable row level security;

notify pgrst, 'reload schema';
