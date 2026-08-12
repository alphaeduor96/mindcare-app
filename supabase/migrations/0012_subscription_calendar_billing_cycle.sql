-- 0012 - Ciclo de cobro calendario para suscripciones.

alter table public.suscripciones_psicologo
add column if not exists current_period_start date;

alter table public.suscripciones_psicologo
add column if not exists current_period_end date;

alter table public.suscripciones_psicologo
add column if not exists next_billing_at timestamptz;

alter table public.suscripciones_psicologo
add column if not exists last_charge_at timestamptz;

notify pgrst, 'reload schema';
