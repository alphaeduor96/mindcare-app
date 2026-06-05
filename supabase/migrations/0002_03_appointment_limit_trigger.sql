-- 0002_03 - Bloquea nuevas citas al llegar al limite del plan.

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
    select limite_citas_mensuales
      into limite
    from public.planes_suscripcion_psicologo
    where codigo = 'basico'
    limit 1;
  end if;

  if limite is null then
    return new;
  end if;

  inicio_mes := date_trunc('month', new.inicia_at);
  fin_mes := inicio_mes + interval '1 month';

  select count(*)
    into citas_mes
  from public.citas c
  where c.psicologo_id = new.psicologo_id
    and c.inicia_at >= inicio_mes
    and c.inicia_at < fin_mes
    and c.estado in ('solicitada', 'agendada', 'confirmada', 'completada');

  if citas_mes >= limite then
    raise exception 'Límite mensual de citas alcanzado para la suscripción actual (% citas)', limite
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_limite_citas_suscripcion_before_insert on public.citas;
create trigger validar_limite_citas_suscripcion_before_insert
before insert on public.citas
for each row execute function public.validar_limite_citas_suscripcion();

notify pgrst, 'reload schema';
