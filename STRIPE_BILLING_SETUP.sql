-- Base para guardar clientes, tarjetas tokenizadas y cargos de Stripe.
-- No guarda numeros de tarjeta: solo IDs de Stripe, marca y ultimos 4 digitos.

create table if not exists public.stripe_billing_customers (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null unique references public.psicologos(id) on delete cascade,
  stripe_customer_id text not null unique,
  default_payment_method_id text,
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  estado public.record_status not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_stripe_billing_customers_updated_at on public.stripe_billing_customers;
create trigger set_stripe_billing_customers_updated_at
before update on public.stripe_billing_customers
for each row execute function public.set_updated_at();

create index if not exists idx_stripe_billing_customers_psicologo
on public.stripe_billing_customers(psicologo_id);

create table if not exists public.stripe_billing_charges (
  id uuid primary key default gen_random_uuid(),
  billing_document_id uuid references public.psychologist_billing_documents(id) on delete set null,
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  stripe_customer_id text,
  stripe_payment_intent_id text unique,
  amount_centavos integer not null check (amount_centavos >= 0),
  moneda text not null default 'MXN',
  estado text not null default 'pendiente' check (estado in ('pendiente', 'procesando', 'pagado', 'fallido', 'cancelado')),
  error_message text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_stripe_billing_charges_updated_at on public.stripe_billing_charges;
create trigger set_stripe_billing_charges_updated_at
before update on public.stripe_billing_charges
for each row execute function public.set_updated_at();

create index if not exists idx_stripe_billing_charges_document
on public.stripe_billing_charges(billing_document_id);

create index if not exists idx_stripe_billing_charges_psicologo
on public.stripe_billing_charges(psicologo_id, created_at desc);

alter table public.stripe_billing_customers enable row level security;
alter table public.stripe_billing_charges enable row level security;

drop policy if exists "stripe_billing_customers_admin_all" on public.stripe_billing_customers;
create policy "stripe_billing_customers_admin_all"
on public.stripe_billing_customers for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "stripe_billing_customers_owner_select" on public.stripe_billing_customers;
create policy "stripe_billing_customers_owner_select"
on public.stripe_billing_customers for select
to authenticated
using (public.is_psychologist_profile_owner(psicologo_id));

drop policy if exists "stripe_billing_charges_admin_all" on public.stripe_billing_charges;
create policy "stripe_billing_charges_admin_all"
on public.stripe_billing_charges for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "stripe_billing_charges_owner_select" on public.stripe_billing_charges;
create policy "stripe_billing_charges_owner_select"
on public.stripe_billing_charges for select
to authenticated
using (public.is_psychologist_profile_owner(psicologo_id));

select 'stripe_billing_ready' as status;
