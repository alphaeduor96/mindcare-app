alter table public.pagos_cita
add column if not exists ingreso_paciente_id uuid references public.ingresos_paciente(id) on delete set null;

create index if not exists idx_pagos_cita_ingreso_paciente
on public.pagos_cita(ingreso_paciente_id);
