-- 0002_02 - Planes y suscripciones de psicologos.

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

alter table public.planes_suscripcion_psicologo enable row level security;
alter table public.suscripciones_psicologo enable row level security;

notify pgrst, 'reload schema';
