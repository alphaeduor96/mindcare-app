-- Base administrativa para cobros mensuales a psicologos.
-- Crea configuracion de cobro, prefacturas internas, facturas y estados de pago.

create table if not exists public.psychologist_billing_settings (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null unique references public.psicologos(id) on delete cascade,
  plan_nombre text not null default 'basico',
  mensualidad_centavos integer not null default 0 check (mensualidad_centavos >= 0),
  dia_corte smallint not null default 1 check (dia_corte between 1 and 28),
  moneda text not null default 'MXN',
  requiere_factura boolean not null default true,
  metodo_cobro text,
  notas text,
  estado public.record_status not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_psychologist_billing_settings_updated_at on public.psychologist_billing_settings;
create trigger set_psychologist_billing_settings_updated_at
before update on public.psychologist_billing_settings
for each row execute function public.set_updated_at();

create index if not exists idx_psychologist_billing_settings_psicologo
on public.psychologist_billing_settings(psicologo_id);

create table if not exists public.psychologist_billing_documents (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  settings_id uuid references public.psychologist_billing_settings(id) on delete set null,
  periodo_inicio date not null,
  periodo_fin date not null,
  tipo text not null default 'pre_factura' check (tipo in ('pre_factura', 'factura', 'cobro')),
  estado text not null default 'borrador' check (estado in ('borrador', 'emitida', 'enviada', 'pagada', 'cancelada', 'error')),
  subtotal_centavos integer not null default 0 check (subtotal_centavos >= 0),
  iva_centavos integer not null default 0 check (iva_centavos >= 0),
  total_centavos integer not null default 0 check (total_centavos >= 0),
  moneda text not null default 'MXN',
  concepto text not null,
  external_invoice_id text,
  cfdi_uuid text,
  pdf_url text,
  xml_url text,
  emitted_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psychologist_billing_period_valid check (periodo_fin >= periodo_inicio)
);

drop trigger if exists set_psychologist_billing_documents_updated_at on public.psychologist_billing_documents;
create trigger set_psychologist_billing_documents_updated_at
before update on public.psychologist_billing_documents
for each row execute function public.set_updated_at();

create index if not exists idx_psychologist_billing_documents_psicologo
on public.psychologist_billing_documents(psicologo_id, periodo_inicio desc);

create index if not exists idx_psychologist_billing_documents_estado
on public.psychologist_billing_documents(estado);

alter table public.psychologist_billing_settings enable row level security;
alter table public.psychologist_billing_documents enable row level security;

drop policy if exists "psychologist_billing_settings_admin_all" on public.psychologist_billing_settings;
create policy "psychologist_billing_settings_admin_all"
on public.psychologist_billing_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "psychologist_billing_settings_owner_select" on public.psychologist_billing_settings;
create policy "psychologist_billing_settings_owner_select"
on public.psychologist_billing_settings for select
to authenticated
using (public.is_psychologist_profile_owner(psicologo_id));

drop policy if exists "psychologist_billing_documents_admin_all" on public.psychologist_billing_documents;
create policy "psychologist_billing_documents_admin_all"
on public.psychologist_billing_documents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "psychologist_billing_documents_owner_select" on public.psychologist_billing_documents;
create policy "psychologist_billing_documents_owner_select"
on public.psychologist_billing_documents for select
to authenticated
using (public.is_psychologist_profile_owner(psicologo_id));

insert into public.psychologist_billing_settings (
  psicologo_id,
  plan_nombre,
  mensualidad_centavos,
  dia_corte,
  requiere_factura,
  estado
)
select
  p.id,
  case
    when p.membresia = 'independiente_pro' then 'pro'
    when p.membresia = 'independiente_basico' then 'intermedio'
    when p.membresia = 'red_afiliado' then 'afiliado'
    else 'basico'
  end,
  case
    when p.membresia = 'independiente_pro' then 25000
    when p.membresia = 'independiente_basico' then 15000
    else 0
  end,
  1,
  true,
  'activo'::public.record_status
from public.psicologos p
left join public.psychologist_billing_settings s on s.psicologo_id = p.id
where s.id is null;

select 'admin_billing_ready' as status, count(*) as configuraciones
from public.psychologist_billing_settings;
