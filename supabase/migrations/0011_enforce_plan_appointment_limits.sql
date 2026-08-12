-- 0011 - Límite real de citas por plan en INSERT y UPDATE.

create or replace function public.validar_limite_citas_suscripcion()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  limite integer;
  citas_mes integer;
  inicio_mes timestamptz;
  fin_mes timestamptz;
begin
  if new.estado not in ('solicitada', 'agendada', 'confirmada', 'completada') then
    return new;
  end if;

  select p.limite_citas_mensuales
    into limite
  from public.suscripciones_psicologo s
  join public.planes_suscripcion_psicologo p on p.id = s.plan_id
  where s.psicologo_id = new.psicologo_id
    and s.estado = 'activa'
  limit 1;

  if limite is null then
    select limite_citas_mensuales into limite
    from public.planes_suscripcion_psicologo
    where codigo = 'basico'
    limit 1;
  end if;

  if limite is null then
    return new;
  end if;

  inicio_mes := date_trunc('month', new.inicia_at);
  fin_mes := inicio_mes + interval '1 month';

  select count(*) into citas_mes
  from public.citas c
  where c.psicologo_id = new.psicologo_id
    and c.inicia_at >= inicio_mes
    and c.inicia_at < fin_mes
    and c.estado in ('solicitada', 'agendada', 'confirmada', 'completada')
    and (tg_op = 'INSERT' or c.id <> old.id);

  if citas_mes >= limite then
    raise exception 'Límite mensual de citas alcanzado para tu plan actual (% citas)', limite
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_limite_citas_suscripcion_before_insert on public.citas;
create trigger validar_limite_citas_suscripcion_before_insert
before insert on public.citas
for each row execute function public.validar_limite_citas_suscripcion();

drop trigger if exists validar_limite_citas_suscripcion_before_update on public.citas;
create trigger validar_limite_citas_suscripcion_before_update
before update of psicologo_id, inicia_at, estado on public.citas
for each row execute function public.validar_limite_citas_suscripcion();

update public.planes_suscripcion_psicologo
set limite_citas_mensuales = 10
where codigo = 'basico'
  and (limite_citas_mensuales is null or limite_citas_mensuales <> 10);

drop policy if exists "planes_suscripcion_admin_write" on public.planes_suscripcion_psicologo;
create policy "planes_suscripcion_admin_write"
on public.planes_suscripcion_psicologo for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

notify pgrst, 'reload schema';
