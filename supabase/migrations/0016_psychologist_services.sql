create table if not exists public.psicologo_servicios (
  id uuid primary key default gen_random_uuid(),
  psicologo_id uuid not null references public.psicologos(id) on delete cascade,
  nombre text not null,
  descripcion text,
  duracion_minutos integer not null default 50,
  precio_centavos integer,
  modalidad text not null default 'ambas'
    check (modalidad in ('presencial', 'virtual', 'ambas')),
  visible_directorio boolean not null default true,
  orden integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.psicologo_servicios enable row level security;

drop policy if exists "services public read" on public.psicologo_servicios;
create policy "services public read"
on public.psicologo_servicios for select
to anon, authenticated
using (visible_directorio = true);

drop policy if exists "services owner manage" on public.psicologo_servicios;
create policy "services owner manage"
on public.psicologo_servicios for all
to authenticated
using (
  exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.psicologos p
    where p.id = psicologo_id and p.usuario_id = auth.uid()
  )
);

create or replace view public.v_psicologos_directorio as
with resenas_resumen as (
  select psicologo_id, coalesce(avg(calificacion)::numeric(3,2), 0) as calificacion_promedio, count(id)::integer as total_resenas
  from public.resenas
  where visible = true
  group by psicologo_id
)
select
  p.id, p.usuario_id, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil_url,
  p.cedula_profesional, p.especialidades, p.enfoque_principal, p.biografia,
  p.anos_experiencia, p.membresia, p.tarifa_privada_centavos, p.tarifa_red_centavos,
  p.duracion_sesion_minutos, p.modalidades, p.acepta_nuevos_pacientes,
  p.verificado_at is not null as verificado, p.estado,
  coalesce(rr.calificacion_promedio, 0) as calificacion_promedio,
  coalesce(rr.total_resenas, 0) as total_resenas,
  p.visible_directorio, plan.codigo as plan_codigo, plan.nombre as plan_nombre,
  oficina.colonia as consultorio_colonia, oficina.municipio as consultorio_municipio,
  oficina.estado_region as consultorio_estado, oficina.latitud as consultorio_latitud,
  oficina.longitud as consultorio_longitud, oficina.fotos_urls as consultorio_fotos_urls,
  coalesce(servicios.servicios, '[]'::jsonb) as servicios
from public.psicologos p
join public.usuarios u on u.id = p.usuario_id
left join public.suscripciones_psicologo s on s.psicologo_id = p.id and s.estado = 'activa'
left join public.planes_suscripcion_psicologo plan on plan.id = s.plan_id
left join resenas_resumen rr on rr.psicologo_id = p.id
left join lateral (
  select c.colonia, c.municipio, c.estado_region, c.latitud, c.longitud, c.fotos_urls
  from public.psicologo_consultorios pc
  join public.consultorios c on c.id = pc.consultorio_id
  where pc.psicologo_id = p.id and c.estado = 'activo'
  order by pc.es_principal desc, pc.created_at asc
  limit 1
) oficina on true
left join lateral (
  select jsonb_agg(jsonb_build_object(
    'nombre', ps.nombre, 'descripcion', ps.descripcion, 'duracion_minutos', ps.duracion_minutos,
    'precio_centavos', ps.precio_centavos, 'modalidad', ps.modalidad
  ) order by ps.orden, ps.nombre) as servicios
  from public.psicologo_servicios ps
  where ps.psicologo_id = p.id and ps.visible_directorio = true
) servicios on true
where p.estado = 'activo' and p.visible_directorio = true and p.acepta_nuevos_pacientes = true;

grant select on public.v_psicologos_directorio to anon, authenticated;
