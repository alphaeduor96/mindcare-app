-- 0002A - Tablas, vistas, triggers y planes base.
-- Ejecutar primero.

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

create table if not exists public.planes_suscripcion_psicologo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  precio_mensual_centavos integer not null default 0 check (precio_mensual_centavos >= 0),
  limite_citas_mensuales integer,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planes_limite_valido check (limite_citas_mensuales is null or limite_citas_mensuales > 0)
);

drop trigger if exists set_planes_suscripcion_psicologo_updated_at on public.planes_suscripcion_psicologo;
create trigger set_planes_suscripcion_psicologo_updated_at
before update on public.planes_suscripcion_psicologo
for each row execute function public.set_updated_at();

insert into public.planes_suscripcion_psicologo
  (codigo, nombre, precio_mensual_centavos, limite_citas_mensuales, orden)
values
  ('basico', 'Plan Básico', 0, 10, 1),
  ('intermedio', 'Plan Intermedio', 15000, 20, 2),
  ('pro', 'Plan Pro', 25000, 50, 3),
  ('afiliado', 'Afiliado MindCare', 0, null, 4)
on conflict (codigo) do update set
  nombre = excluded.nombre,
  precio_mensual_centavos = excluded.precio_mensual_centavos,
  limite_citas_mensuales = excluded.limite_citas_mensuales,
  orden = excluded.orden,
  updated_at = now();

create table if not exists public.suscripciones_psicologo (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null unique references public.psicologos(id) on delete cascade,
  plan_id uuid not null references public.planes_suscripcion_psicologo(id),
  estado text not null default 'activa' check (estado in ('activa', 'cancelada', 'pausada')),
  inicia_at timestamptz not null default now(),
  termina_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  default_payment_method_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_suscripciones_psicologo_updated_at on public.suscripciones_psicologo;
create trigger set_suscripciones_psicologo_updated_at
before update on public.suscripciones_psicologo
for each row execute function public.set_updated_at();

create index if not exists idx_suscripciones_psicologo_plan
on public.suscripciones_psicologo(plan_id);

create index if not exists idx_suscripciones_psicologo_estado
on public.suscripciones_psicologo(estado);

create or replace function public.validar_limite_citas_suscripcion()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  limite integer;
  citas_mes integer;
  inicio_mes timestamptz;
  fin_mes timestamptz;
begin
  if new.estado not in ('solicitada', 'agendada', 'confirmada', 'completada') then
    return new;
  end if;

  select p.limite_citas_mensuales
    into limite
  from public.suscripciones_psicologo s
  join public.planes_suscripcion_psicologo p on p.id = s.plan_id
  where s.psicologo_id = new.psicologo_id
    and s.estado = 'activa'
  limit 1;

  if limite is null then
    select limite_citas_mensuales
      into limite
    from public.planes_suscripcion_psicologo
    where codigo = 'basico'
    limit 1;
  end if;

  if limite is null then
    return new;
  end if;

  inicio_mes := date_trunc('month', new.inicia_at);
  fin_mes := inicio_mes + interval '1 month';

  select count(*)
    into citas_mes
  from public.citas c
  where c.psicologo_id = new.psicologo_id
    and c.inicia_at >= inicio_mes
    and c.inicia_at < fin_mes
    and c.estado in ('solicitada', 'agendada', 'confirmada', 'completada');

  if citas_mes >= limite then
    raise exception 'Límite mensual de citas alcanzado para la suscripción actual (% citas)', limite
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_limite_citas_suscripcion_before_insert on public.citas;
create trigger validar_limite_citas_suscripcion_before_insert
before insert on public.citas
for each row execute function public.validar_limite_citas_suscripcion();

create table if not exists public.stripe_billing_customers (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null unique references public.psicologos(id) on delete cascade,
  stripe_customer_id text,
  default_payment_method_id text,
  payment_method_type text,
  wallet_type text,
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  estado text not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_billing_customers
add column if not exists payment_method_type text;

alter table public.stripe_billing_customers
add column if not exists wallet_type text;

alter table public.stripe_billing_customers
add column if not exists estado text not null default 'activo';

drop trigger if exists set_stripe_billing_customers_updated_at on public.stripe_billing_customers;
create trigger set_stripe_billing_customers_updated_at
before update on public.stripe_billing_customers
for each row execute function public.set_updated_at();

create table if not exists public.psychologist_billing_documents (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  periodo_inicio date not null,
  periodo_fin date not null,
  tipo text not null default 'factura',
  estado text not null default 'pendiente',
  total_centavos integer not null default 0,
  concepto text not null,
  documento_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_psychologist_billing_documents_updated_at on public.psychologist_billing_documents;
create trigger set_psychologist_billing_documents_updated_at
before update on public.psychologist_billing_documents
for each row execute function public.set_updated_at();

create index if not exists idx_psychologist_billing_documents_psicologo
on public.psychologist_billing_documents(psicologo_id, created_at desc);

alter table public.cuentas_bancarias enable row level security;
alter table public.movimientos_cuenta_bancaria enable row level security;
alter table public.planes_suscripcion_psicologo enable row level security;
alter table public.suscripciones_psicologo enable row level security;
alter table public.stripe_billing_customers enable row level security;
alter table public.psychologist_billing_documents enable row level security;

notify pgrst, 'reload schema';
