-- MindCare psychologist payments and subscription support.
-- Run after 0001_mindcare_clean_schema.sql.

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

create index if not exists idx_cuentas_bancarias_psicologo on public.cuentas_bancarias(psicologo_id);

alter table public.pagos_cita
add column if not exists cuenta_bancaria_id uuid references public.cuentas_bancarias(id) on delete set null;

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

create index if not exists idx_movimientos_cuenta on public.movimientos_cuenta_bancaria(cuenta_bancaria_id, movimiento_at desc);
create index if not exists idx_movimientos_pago on public.movimientos_cuenta_bancaria(pago_cita_id);

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

create index if not exists idx_suscripciones_psicologo_plan on public.suscripciones_psicologo(plan_id);
create index if not exists idx_suscripciones_psicologo_estado on public.suscripciones_psicologo(estado);

create table if not exists public.stripe_billing_customers (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null unique references public.psicologos(id) on delete cascade,
  stripe_customer_id text,
  default_payment_method_id text,
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create index if not exists idx_psychologist_billing_documents_psicologo on public.psychologist_billing_documents(psicologo_id, created_at desc);

alter table public.cuentas_bancarias enable row level security;
alter table public.movimientos_cuenta_bancaria enable row level security;
alter table public.planes_suscripcion_psicologo enable row level security;
alter table public.suscripciones_psicologo enable row level security;
alter table public.stripe_billing_customers enable row level security;
alter table public.psychologist_billing_documents enable row level security;

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

drop policy if exists "planes_suscripcion_select_active" on public.planes_suscripcion_psicologo;
create policy "planes_suscripcion_select_active"
on public.planes_suscripcion_psicologo for select
to authenticated
using (activo = true or public.is_admin());

drop policy if exists "suscripciones_psicologo_select_owner_or_admin" on public.suscripciones_psicologo;
create policy "suscripciones_psicologo_select_owner_or_admin"
on public.suscripciones_psicologo for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "suscripciones_psicologo_write_owner_or_admin" on public.suscripciones_psicologo;
create policy "suscripciones_psicologo_write_owner_or_admin"
on public.suscripciones_psicologo for all
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

drop policy if exists "stripe_billing_customers_select_owner_or_admin" on public.stripe_billing_customers;
create policy "stripe_billing_customers_select_owner_or_admin"
on public.stripe_billing_customers for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "stripe_billing_customers_write_owner_or_admin" on public.stripe_billing_customers;
create policy "stripe_billing_customers_write_owner_or_admin"
on public.stripe_billing_customers for all
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

drop policy if exists "psychologist_billing_documents_select_owner_or_admin" on public.psychologist_billing_documents;
create policy "psychologist_billing_documents_select_owner_or_admin"
on public.psychologist_billing_documents for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "psychologist_billing_documents_admin_write" on public.psychologist_billing_documents;
create policy "psychologist_billing_documents_admin_write"
on public.psychologist_billing_documents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

notify pgrst, 'reload schema';
