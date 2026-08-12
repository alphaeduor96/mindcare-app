-- Categorias/subcategorias financieras por psicologo y soporte en movimientos.
-- Ejecutar en Supabase SQL Editor antes de usar la configuracion de Pagos.

create table if not exists public.categorias_financieras (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  parent_id uuid references public.categorias_financieras(id) on delete cascade,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  nombre text not null,
  estado text not null default 'activa' check (estado in ('activa', 'inactiva')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categorias_financieras_parent_not_self check (parent_id is null or parent_id <> id)
);

drop trigger if exists set_categorias_financieras_updated_at on public.categorias_financieras;
create trigger set_categorias_financieras_updated_at
before update on public.categorias_financieras
for each row execute function public.set_updated_at();

create index if not exists idx_categorias_financieras_psicologo
on public.categorias_financieras(psicologo_id, tipo, parent_id, estado);

alter table public.movimientos_cuenta_bancaria
add column if not exists categoria_id uuid references public.categorias_financieras(id) on delete set null,
add column if not exists subcategoria_id uuid references public.categorias_financieras(id) on delete set null;

alter table public.categorias_financieras enable row level security;

drop policy if exists "categorias_financieras_select_owner_or_admin" on public.categorias_financieras;
create policy "categorias_financieras_select_owner_or_admin"
on public.categorias_financieras for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

drop policy if exists "categorias_financieras_write_owner_or_admin" on public.categorias_financieras;
create policy "categorias_financieras_write_owner_or_admin"
on public.categorias_financieras for all
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

notify pgrst, 'reload schema';
