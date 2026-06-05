-- 0002_01 - Cuentas bancarias, movimientos y vista de saldo.

create table if not exists public.cuentas_bancarias (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  nombre text not null,
  banco text,
  clabe text,
  ultimos_4 text,
  moneda char(3) not null default 'MXN',
  saldo_inicial_centavos integer not null default 0,
  estado text not null default 'activa' check (estado in ('activa', 'inactiva')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_cuentas_bancarias_updated_at on public.cuentas_bancarias;
create trigger set_cuentas_bancarias_updated_at
before update on public.cuentas_bancarias
for each row execute function public.set_updated_at();

create index if not exists idx_cuentas_bancarias_psicologo
on public.cuentas_bancarias(psicologo_id);

alter table public.pagos_cita
add column if not exists cuenta_bancaria_id uuid references public.cuentas_bancarias(id) on delete set null;

create table if not exists public.movimientos_cuenta_bancaria (
  id uuid primary key default gen_random_uuid(),
  cuenta_bancaria_id uuid not null references public.cuentas_bancarias(id) on delete cascade,
  pago_cita_id uuid references public.pagos_cita(id) on delete set null,
  tipo text not null check (tipo in ('ingreso', 'egreso', 'ajuste')),
  monto_centavos integer not null check (monto_centavos >= 0),
  descripcion text,
  referencia text,
  movimiento_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_movimientos_cuenta
on public.movimientos_cuenta_bancaria(cuenta_bancaria_id, movimiento_at desc);

create index if not exists idx_movimientos_pago
on public.movimientos_cuenta_bancaria(pago_cita_id);

create or replace view public.v_cuentas_bancarias_estado as
select
  cb.id,
  cb.psicologo_id,
  cb.nombre,
  cb.banco,
  cb.ultimos_4,
  cb.moneda,
  cb.estado,
  cb.created_at,
  cb.saldo_inicial_centavos
    + coalesce(sum(
      case
        when m.tipo = 'ingreso' then m.monto_centavos
        when m.tipo = 'egreso' then -m.monto_centavos
        else m.monto_centavos
      end
    ), 0)::integer as saldo_actual_centavos
from public.cuentas_bancarias cb
left join public.movimientos_cuenta_bancaria m on m.cuenta_bancaria_id = cb.id
group by cb.id;

alter table public.cuentas_bancarias enable row level security;
alter table public.movimientos_cuenta_bancaria enable row level security;

notify pgrst, 'reload schema';
