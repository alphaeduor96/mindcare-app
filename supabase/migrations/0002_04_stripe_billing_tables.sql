-- 0002_04 - Metodo de pago Stripe e historial de facturacion.

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

alter table public.stripe_billing_customers enable row level security;
alter table public.psychologist_billing_documents enable row level security;

notify pgrst, 'reload schema';
