-- MindCare clean Supabase schema
-- Run this only on a new/empty Supabase database.
-- It creates the core product data model without demo data.
--
-- Note for Supabase SQL Editor:
-- Do not create extensions from this migration. Some Supabase contexts run
-- extension commands in a read-only transaction. New Supabase projects normally
-- provide gen_random_uuid(); if yours does not, enable pgcrypto from
-- Database > Extensions in the Supabase dashboard, then run this file again.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.user_role as enum ('admin', 'psicologo', 'empresa', 'empleado', 'paciente');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.record_status as enum ('activo', 'inactivo', 'pendiente', 'suspendido');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.psychologist_membership as enum ('red_afiliado', 'independiente_free', 'independiente_basico', 'independiente_pro');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.company_size as enum ('micro', 'pequena', 'mediana', 'grande', 'enterprise');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_source as enum ('privado', 'red_mindcare');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_modality as enum ('presencial', 'virtual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_status as enum ('solicitada', 'agendada', 'confirmada', 'completada', 'cancelada', 'no_asistio');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('pendiente', 'procesando', 'pagado', 'fallido', 'reembolsado', 'cancelado');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payout_status as enum ('pendiente_factura', 'en_revision', 'aprobado', 'pagado', 'rechazado');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Shared functions
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity and access
-- ---------------------------------------------------------------------------

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nombre text not null,
  apellido text not null,
  telefono text,
  rol public.user_role not null,
  foto_perfil_url text,
  estado public.record_status not null default 'activo',
  zona_horaria text not null default 'America/Mexico_City',
  ultima_sesion_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usuarios_email_lowercase check (email = lower(email))
);

create trigger set_usuarios_updated_at
before update on public.usuarios
for each row execute function public.set_updated_at();

create index if not exists idx_usuarios_rol on public.usuarios(rol);
create index if not exists idx_usuarios_estado on public.usuarios(estado);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.usuarios where id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_psychologist_profile_owner(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.psicologos p
    where p.id = profile_id and p.usuario_id = auth.uid()
  );
$$;

create or replace function public.is_company_owner(company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.empresas e
    where e.id = company_id and e.usuario_id = auth.uid()
  );
$$;

create or replace function public.is_employee_for_company(company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.empleados em
    where em.empresa_id = company_id and em.usuario_id = auth.uid()
  );
$$;

create or replace function public.is_employee_record_owner(employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.empleados em
    where em.id = employee_id and em.usuario_id = auth.uid()
  );
$$;

create or replace function public.is_patient_user_owner(patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pacientes pa
    where pa.id = patient_id and pa.usuario_id = auth.uid()
  );
$$;

create or replace function public.is_patient_related_to_current_psychologist(patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.citas c
    where c.paciente_id = patient_id
      and public.is_psychologist_profile_owner(c.psicologo_id)
  );
$$;

create or replace function public.is_appointment_related_to_current_user(appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.citas c
    where c.id = appointment_id
      and (
        public.is_psychologist_profile_owner(c.psicologo_id)
        or public.is_patient_user_owner(c.paciente_id)
        or public.is_employee_record_owner(c.empleado_id)
        or public.is_company_owner(c.empresa_id)
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Psychologist network
-- ---------------------------------------------------------------------------

create table if not exists public.psicologos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references public.usuarios(id) on delete cascade,
  cedula_profesional text not null unique,
  especialidades text[] not null default '{}',
  enfoque_principal text,
  biografia text,
  anos_experiencia integer check (anos_experiencia is null or anos_experiencia >= 0),
  membresia public.psychologist_membership not null default 'independiente_free',
  tarifa_privada_centavos integer check (tarifa_privada_centavos is null or tarifa_privada_centavos >= 0),
  tarifa_red_centavos integer not null default 35000 check (tarifa_red_centavos >= 0),
  duracion_sesion_minutos integer not null default 60 check (duracion_sesion_minutos between 15 and 240),
  modalidades public.appointment_modality[] not null default array['presencial'::public.appointment_modality, 'virtual'::public.appointment_modality],
  acepta_nuevos_pacientes boolean not null default true,
  verificado_at timestamptz,
  aprobado_por uuid references public.usuarios(id),
  estado public.record_status not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_psicologos_updated_at
before update on public.psicologos
for each row execute function public.set_updated_at();

create index if not exists idx_psicologos_usuario on public.psicologos(usuario_id);
create index if not exists idx_psicologos_estado on public.psicologos(estado);
create index if not exists idx_psicologos_membresia on public.psicologos(membresia);
create index if not exists idx_psicologos_especialidades on public.psicologos using gin(especialidades);

create table if not exists public.consultorios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text not null,
  colonia text,
  municipio text not null,
  estado_region text not null default 'Jalisco',
  codigo_postal text,
  latitud numeric(9,6),
  longitud numeric(9,6),
  telefono text,
  descripcion text,
  amenidades text[] not null default '{}',
  fotos_urls text[] not null default '{}',
  estado public.record_status not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consultorios_coords_pair check (
    (latitud is null and longitud is null) or (latitud is not null and longitud is not null)
  )
);

create trigger set_consultorios_updated_at
before update on public.consultorios
for each row execute function public.set_updated_at();

create index if not exists idx_consultorios_estado on public.consultorios(estado);
create index if not exists idx_consultorios_municipio on public.consultorios(municipio);

create table if not exists public.psicologo_consultorios (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  consultorio_id uuid not null references public.consultorios(id) on delete restrict,
  es_principal boolean not null default false,
  created_at timestamptz not null default now(),
  unique(psicologo_id, consultorio_id)
);

create index if not exists idx_psicologo_consultorios_psicologo on public.psicologo_consultorios(psicologo_id);
create index if not exists idx_psicologo_consultorios_consultorio on public.psicologo_consultorios(consultorio_id);

create table if not exists public.disponibilidad_horarios (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  modalidad public.appointment_modality,
  consultorio_id uuid references public.consultorios(id) on delete set null,
  buffer_minutos integer not null default 0 check (buffer_minutos >= 0),
  estado public.record_status not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint disponibilidad_hora_valida check (hora_fin > hora_inicio)
);

create trigger set_disponibilidad_horarios_updated_at
before update on public.disponibilidad_horarios
for each row execute function public.set_updated_at();

create index if not exists idx_disponibilidad_psicologo on public.disponibilidad_horarios(psicologo_id);
create index if not exists idx_disponibilidad_dia on public.disponibilidad_horarios(dia_semana);

-- ---------------------------------------------------------------------------
-- Companies and employees
-- ---------------------------------------------------------------------------

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique references public.usuarios(id) on delete set null,
  razon_social text not null,
  nombre_comercial text,
  rfc text not null unique,
  industria text,
  tamano public.company_size,
  numero_empleados integer check (numero_empleados is null or numero_empleados >= 0),
  direccion text,
  contacto_nombre text,
  contacto_email text,
  contacto_telefono text,
  estado public.record_status not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint empresas_rfc_uppercase check (rfc = upper(rfc))
);

create trigger set_empresas_updated_at
before update on public.empresas
for each row execute function public.set_updated_at();

create index if not exists idx_empresas_usuario on public.empresas(usuario_id);
create index if not exists idx_empresas_estado on public.empresas(estado);

create table if not exists public.contratos_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre_plan text not null,
  sesiones_por_empleado integer not null check (sesiones_por_empleado > 0),
  precio_por_empleado_centavos integer check (precio_por_empleado_centavos is null or precio_por_empleado_centavos >= 0),
  inicia_el date not null,
  termina_el date,
  estado public.record_status not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contratos_fecha_valida check (termina_el is null or termina_el >= inicia_el)
);

create trigger set_contratos_empresa_updated_at
before update on public.contratos_empresa
for each row execute function public.set_updated_at();

create index if not exists idx_contratos_empresa_empresa on public.contratos_empresa(empresa_id);
create index if not exists idx_contratos_empresa_estado on public.contratos_empresa(estado);

create table if not exists public.empleados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references public.usuarios(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  numero_empleado text,
  departamento text,
  puesto text,
  fecha_ingreso date,
  estado public.record_status not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(empresa_id, numero_empleado)
);

create trigger set_empleados_updated_at
before update on public.empleados
for each row execute function public.set_updated_at();

create index if not exists idx_empleados_usuario on public.empleados(usuario_id);
create index if not exists idx_empleados_empresa on public.empleados(empresa_id);
create index if not exists idx_empleados_estado on public.empleados(estado);

-- ---------------------------------------------------------------------------
-- Patients, appointments, notes and reviews
-- ---------------------------------------------------------------------------

create table if not exists public.pacientes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique references public.usuarios(id) on delete set null,
  empleado_id uuid unique references public.empleados(id) on delete set null,
  creado_por_psicologo_id uuid references public.psicologos(id) on delete set null,
  fuente public.appointment_source not null,
  nombre text not null,
  apellido text not null,
  email text,
  telefono text,
  fecha_nacimiento date,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  estado public.record_status not null default 'activo',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pacientes_red_requiere_empleado check (
    fuente <> 'red_mindcare' or empleado_id is not null
  )
);

create trigger set_pacientes_updated_at
before update on public.pacientes
for each row execute function public.set_updated_at();

create index if not exists idx_pacientes_usuario on public.pacientes(usuario_id);
create index if not exists idx_pacientes_empleado on public.pacientes(empleado_id);
create index if not exists idx_pacientes_psicologo on public.pacientes(creado_por_psicologo_id);
create index if not exists idx_pacientes_fuente on public.pacientes(fuente);

create table if not exists public.citas (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete restrict,
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  empresa_id uuid references public.empresas(id) on delete set null,
  empleado_id uuid references public.empleados(id) on delete set null,
  fuente public.appointment_source not null,
  inicia_at timestamptz not null,
  termina_at timestamptz not null,
  modalidad public.appointment_modality not null,
  consultorio_id uuid references public.consultorios(id) on delete set null,
  link_videollamada text,
  estado public.appointment_status not null default 'agendada',
  motivo_consulta text,
  costo_centavos integer check (costo_centavos is null or costo_centavos >= 0),
  cancelada_at timestamptz,
  motivo_cancelacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint citas_horario_valido check (termina_at > inicia_at),
  constraint citas_presencial_requiere_consultorio check (
    modalidad <> 'presencial' or consultorio_id is not null
  ),
  constraint citas_red_requiere_empresa_empleado check (
    fuente <> 'red_mindcare' or (empresa_id is not null and empleado_id is not null)
  )
);

create trigger set_citas_updated_at
before update on public.citas
for each row execute function public.set_updated_at();

create index if not exists idx_citas_psicologo_fecha on public.citas(psicologo_id, inicia_at);
create index if not exists idx_citas_paciente_fecha on public.citas(paciente_id, inicia_at);
create index if not exists idx_citas_empresa_fecha on public.citas(empresa_id, inicia_at);
create index if not exists idx_citas_estado on public.citas(estado);

create table if not exists public.notas_sesion (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null unique references public.citas(id) on delete cascade,
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  contenido text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_notas_sesion_updated_at
before update on public.notas_sesion
for each row execute function public.set_updated_at();

create index if not exists idx_notas_sesion_psicologo on public.notas_sesion(psicologo_id);

create table if not exists public.resenas (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null unique references public.citas(id) on delete cascade,
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  calificacion smallint not null check (calificacion between 1 and 5),
  comentario text,
  anonima boolean not null default true,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_resenas_updated_at
before update on public.resenas
for each row execute function public.set_updated_at();

create index if not exists idx_resenas_psicologo on public.resenas(psicologo_id);
create index if not exists idx_resenas_visible on public.resenas(visible);

-- ---------------------------------------------------------------------------
-- Payments and payouts
-- ---------------------------------------------------------------------------

create table if not exists public.pagos_cita (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null references public.citas(id) on delete cascade,
  pagador_tipo text not null check (pagador_tipo in ('paciente', 'empresa', 'mindcare')),
  monto_centavos integer not null check (monto_centavos >= 0),
  moneda char(3) not null default 'MXN',
  estado public.payment_status not null default 'pendiente',
  proveedor_pago text,
  referencia_externa text,
  pagado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_pagos_cita_updated_at
before update on public.pagos_cita
for each row execute function public.set_updated_at();

create index if not exists idx_pagos_cita_cita on public.pagos_cita(cita_id);
create index if not exists idx_pagos_cita_estado on public.pagos_cita(estado);

create table if not exists public.cortes_pago (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  periodo_inicio date not null,
  periodo_fin date not null,
  total_citas integer not null default 0 check (total_citas >= 0),
  total_centavos integer not null default 0 check (total_centavos >= 0),
  estado public.payout_status not null default 'pendiente_factura',
  factura_pdf_url text,
  factura_xml_url text,
  folio_factura text,
  pagado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cortes_periodo_valido check (periodo_fin >= periodo_inicio),
  unique(psicologo_id, periodo_inicio, periodo_fin)
);

create trigger set_cortes_pago_updated_at
before update on public.cortes_pago
for each row execute function public.set_updated_at();

create index if not exists idx_cortes_pago_psicologo on public.cortes_pago(psicologo_id);
create index if not exists idx_cortes_pago_estado on public.cortes_pago(estado);

create table if not exists public.cortes_pago_items (
  id uuid primary key default gen_random_uuid(),
  corte_pago_id uuid not null references public.cortes_pago(id) on delete cascade,
  cita_id uuid not null unique references public.citas(id) on delete restrict,
  monto_centavos integer not null check (monto_centavos >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_cortes_pago_items_corte on public.cortes_pago_items(corte_pago_id);

-- ---------------------------------------------------------------------------
-- Notifications and audit
-- ---------------------------------------------------------------------------

create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensaje text not null,
  accion_url text,
  leida_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notificaciones_usuario on public.notificaciones(usuario_id, created_at desc);

create table if not exists public.calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null unique references public.psicologos(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_calendar_feeds_updated_at
before update on public.calendar_feeds
for each row execute function public.set_updated_at();

create index if not exists idx_calendar_feeds_token on public.calendar_feeds(token);
create index if not exists idx_calendar_feeds_psicologo on public.calendar_feeds(psicologo_id);

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

create trigger set_psychologist_billing_documents_updated_at
before update on public.psychologist_billing_documents
for each row execute function public.set_updated_at();

create index if not exists idx_psychologist_billing_documents_psicologo
on public.psychologist_billing_documents(psicologo_id, periodo_inicio desc);

create index if not exists idx_psychologist_billing_documents_estado
on public.psychologist_billing_documents(estado);

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

create trigger set_stripe_billing_charges_updated_at
before update on public.stripe_billing_charges
for each row execute function public.set_updated_at();

create index if not exists idx_stripe_billing_charges_document
on public.stripe_billing_charges(billing_document_id);

create index if not exists idx_stripe_billing_charges_psicologo
on public.stripe_billing_charges(psicologo_id, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_usuario_id uuid references public.usuarios(id) on delete set null,
  entidad text not null,
  entidad_id uuid,
  accion text not null,
  cambios jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entidad on public.audit_logs(entidad, entidad_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_usuario_id);

-- ---------------------------------------------------------------------------
-- Analytics-friendly views
-- ---------------------------------------------------------------------------

create or replace view public.v_psicologos_directorio as
select
  p.id,
  p.usuario_id,
  u.nombre,
  u.apellido,
  u.email,
  u.telefono,
  u.foto_perfil_url,
  p.cedula_profesional,
  p.especialidades,
  p.enfoque_principal,
  p.biografia,
  p.anos_experiencia,
  p.membresia,
  p.tarifa_privada_centavos,
  p.tarifa_red_centavos,
  p.duracion_sesion_minutos,
  p.modalidades,
  p.acepta_nuevos_pacientes,
  p.verificado_at is not null as verificado,
  p.estado,
  coalesce(avg(r.calificacion)::numeric(3,2), 0) as calificacion_promedio,
  count(r.id)::integer as total_resenas
from public.psicologos p
join public.usuarios u on u.id = p.usuario_id
left join public.resenas r on r.psicologo_id = p.id and r.visible = true
group by p.id, u.id;

create or replace view public.v_citas_detalle as
select
  c.id,
  c.psicologo_id,
  psu.nombre || ' ' || psu.apellido as psicologo_nombre,
  c.paciente_id,
  pa.nombre || ' ' || pa.apellido as paciente_nombre,
  c.empresa_id,
  e.razon_social as empresa_nombre,
  c.fuente,
  c.inicia_at,
  c.termina_at,
  c.modalidad,
  c.estado,
  c.costo_centavos,
  c.created_at
from public.citas c
join public.psicologos ps on ps.id = c.psicologo_id
join public.usuarios psu on psu.id = ps.usuario_id
join public.pacientes pa on pa.id = c.paciente_id
left join public.empresas e on e.id = c.empresa_id;

create or replace view public.v_uso_empresa as
select
  e.id as empresa_id,
  e.razon_social,
  count(distinct em.id)::integer as empleados_registrados,
  count(c.id) filter (where c.estado in ('agendada', 'confirmada', 'completada'))::integer as sesiones_usadas_o_reservadas,
  count(c.id) filter (where c.estado = 'completada')::integer as sesiones_completadas
from public.empresas e
left join public.empleados em on em.empresa_id = e.id and em.estado = 'activo'
left join public.citas c on c.empresa_id = e.id
group by e.id;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.usuarios enable row level security;
alter table public.psicologos enable row level security;
alter table public.consultorios enable row level security;
alter table public.psicologo_consultorios enable row level security;
alter table public.disponibilidad_horarios enable row level security;
alter table public.empresas enable row level security;
alter table public.contratos_empresa enable row level security;
alter table public.empleados enable row level security;
alter table public.pacientes enable row level security;
alter table public.citas enable row level security;
alter table public.notas_sesion enable row level security;
alter table public.resenas enable row level security;
alter table public.pagos_cita enable row level security;
alter table public.cortes_pago enable row level security;
alter table public.cortes_pago_items enable row level security;
alter table public.notificaciones enable row level security;
alter table public.calendar_feeds enable row level security;
alter table public.psychologist_billing_settings enable row level security;
alter table public.psychologist_billing_documents enable row level security;
alter table public.stripe_billing_customers enable row level security;
alter table public.stripe_billing_charges enable row level security;
alter table public.audit_logs enable row level security;

create policy "usuarios_select_own_or_admin"
on public.usuarios for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "usuarios_update_own_or_admin"
on public.usuarios for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "psicologos_select_directory_or_owner_or_admin"
on public.psicologos for select
to authenticated
using (
  estado = 'activo'
  or usuario_id = auth.uid()
  or public.is_admin()
);

create policy "psicologos_update_owner_or_admin"
on public.psicologos for update
to authenticated
using (usuario_id = auth.uid() or public.is_admin())
with check (usuario_id = auth.uid() or public.is_admin());

create policy "consultorios_select_active"
on public.consultorios for select
to authenticated
using (
  estado = 'activo'
  or public.current_user_role() in ('admin', 'psicologo')
);

create policy "consultorios_admin_write"
on public.consultorios for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "consultorios_psychologist_insert"
on public.consultorios for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'psicologo')
);

create policy "consultorios_psychologist_update"
on public.consultorios for update
to authenticated
using (
  public.current_user_role() in ('admin', 'psicologo')
)
with check (
  public.current_user_role() in ('admin', 'psicologo')
);

create policy "psicologo_consultorios_select_related"
on public.psicologo_consultorios for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

create policy "disponibilidad_select_related"
on public.disponibilidad_horarios for select
to authenticated
using (
  estado = 'activo'
  or public.is_admin()
  or exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

create policy "disponibilidad_write_owner_or_admin"
on public.disponibilidad_horarios for all
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

create policy "empresas_select_related"
on public.empresas for select
to authenticated
using (
  public.is_admin()
  or usuario_id = auth.uid()
  or public.is_employee_for_company(id)
);

create policy "empresas_update_owner_or_admin"
on public.empresas for update
to authenticated
using (public.is_admin() or usuario_id = auth.uid())
with check (public.is_admin() or usuario_id = auth.uid());

create policy "contratos_empresa_select_company_or_admin"
on public.contratos_empresa for select
to authenticated
using (
  public.is_admin()
  or public.is_company_owner(empresa_id)
);

create policy "empleados_select_related"
on public.empleados for select
to authenticated
using (
  public.is_admin()
  or usuario_id = auth.uid()
  or public.is_company_owner(empresa_id)
);

create policy "empleados_update_company_or_admin"
on public.empleados for update
to authenticated
using (
  public.is_admin()
  or public.is_company_owner(empresa_id)
)
with check (
  public.is_admin()
  or public.is_company_owner(empresa_id)
);

create policy "pacientes_select_related"
on public.pacientes for select
to authenticated
using (
  public.is_admin()
  or usuario_id = auth.uid()
  or public.is_employee_record_owner(empleado_id)
  or public.is_psychologist_profile_owner(creado_por_psicologo_id)
  or public.is_patient_related_to_current_psychologist(id)
);

create policy "pacientes_write_owner_psychologist_or_admin"
on public.pacientes for all
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(creado_por_psicologo_id)
)
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(creado_por_psicologo_id)
);

create policy "citas_select_related"
on public.citas for select
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
  or public.is_patient_user_owner(paciente_id)
  or public.is_employee_record_owner(empleado_id)
  or public.is_company_owner(empresa_id)
);

create policy "citas_write_psychologist_company_or_admin"
on public.citas for all
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
  or public.is_company_owner(empresa_id)
)
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
  or public.is_company_owner(empresa_id)
);

create policy "notas_sesion_only_psychologist_owner"
on public.notas_sesion for all
to authenticated
using (
  exists (
    select 1 from public.psicologos ps
    where ps.id = psicologo_id and ps.usuario_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.psicologos ps
    where ps.id = psicologo_id and ps.usuario_id = auth.uid()
  )
);

create policy "resenas_select_visible_or_related"
on public.resenas for select
to authenticated
using (
  visible
  or public.is_admin()
  or exists (
    select 1 from public.psicologos ps
    where ps.id = psicologo_id and ps.usuario_id = auth.uid()
  )
);

create policy "pagos_cita_select_related"
on public.pagos_cita for select
to authenticated
using (
  public.is_admin()
  or public.is_appointment_related_to_current_user(cita_id)
);

create policy "cortes_pago_select_psychologist_or_admin"
on public.cortes_pago for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.psicologos ps
    where ps.id = psicologo_id and ps.usuario_id = auth.uid()
  )
);

create policy "cortes_pago_items_select_via_corte"
on public.cortes_pago_items for select
to authenticated
using (
  exists (
    select 1 from public.cortes_pago cp
    join public.psicologos ps on ps.id = cp.psicologo_id
    where cp.id = corte_pago_id and (ps.usuario_id = auth.uid() or public.is_admin())
  )
);

create policy "notificaciones_select_own"
on public.notificaciones for select
to authenticated
using (usuario_id = auth.uid() or public.is_admin());

create policy "notificaciones_update_own"
on public.notificaciones for update
to authenticated
using (usuario_id = auth.uid() or public.is_admin())
with check (usuario_id = auth.uid() or public.is_admin());

create policy "calendar_feeds_select_owner_or_admin"
on public.calendar_feeds for select
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
);

create policy "calendar_feeds_insert_owner_or_admin"
on public.calendar_feeds for insert
to authenticated
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
);

create policy "calendar_feeds_update_owner_or_admin"
on public.calendar_feeds for update
to authenticated
using (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
)
with check (
  public.is_admin()
  or public.is_psychologist_profile_owner(psicologo_id)
);

create policy "psychologist_billing_settings_admin_all"
on public.psychologist_billing_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "psychologist_billing_settings_owner_select"
on public.psychologist_billing_settings for select
to authenticated
using (public.is_psychologist_profile_owner(psicologo_id));

create policy "psychologist_billing_documents_admin_all"
on public.psychologist_billing_documents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "psychologist_billing_documents_owner_select"
on public.psychologist_billing_documents for select
to authenticated
using (public.is_psychologist_profile_owner(psicologo_id));

create policy "stripe_billing_customers_admin_all"
on public.stripe_billing_customers for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "stripe_billing_customers_owner_select"
on public.stripe_billing_customers for select
to authenticated
using (public.is_psychologist_profile_owner(psicologo_id));

create policy "stripe_billing_charges_admin_all"
on public.stripe_billing_charges for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "stripe_billing_charges_owner_select"
on public.stripe_billing_charges for select
to authenticated
using (public.is_psychologist_profile_owner(psicologo_id));

create policy "audit_logs_admin_only"
on public.audit_logs for select
to authenticated
using (public.is_admin());
