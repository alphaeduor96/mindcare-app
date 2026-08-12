-- Bloqueos de agenda para horarios no disponibles por motivos distintos a citas.
-- Ejecuta este SQL en Supabase SQL Editor antes de usar "Bloquear horario".

create table if not exists public.bloqueos_horario (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  titulo text not null default 'Horario bloqueado',
  motivo text,
  inicia_at timestamptz not null,
  termina_at timestamptz not null,
  color text not null default '#94A3B8',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bloqueos_horario_rango_valido check (termina_at > inicia_at)
);

drop trigger if exists set_bloqueos_horario_updated_at on public.bloqueos_horario;
create trigger set_bloqueos_horario_updated_at
before update on public.bloqueos_horario
for each row execute function public.set_updated_at();

create index if not exists idx_bloqueos_horario_psicologo_fecha
on public.bloqueos_horario(psicologo_id, inicia_at);

alter table public.bloqueos_horario enable row level security;

drop policy if exists "bloqueos_horario_select_owner_or_admin" on public.bloqueos_horario;
create policy "bloqueos_horario_select_owner_or_admin"
on public.bloqueos_horario for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = bloqueos_horario.psicologo_id
      and p.usuario_id = auth.uid()
  )
);

drop policy if exists "bloqueos_horario_write_owner_or_admin" on public.bloqueos_horario;
create policy "bloqueos_horario_write_owner_or_admin"
on public.bloqueos_horario for all
using (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = bloqueos_horario.psicologo_id
      and p.usuario_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.psicologos p
    where p.id = bloqueos_horario.psicologo_id
      and p.usuario_id = auth.uid()
  )
);
