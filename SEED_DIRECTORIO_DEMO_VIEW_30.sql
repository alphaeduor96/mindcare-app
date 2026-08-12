drop view if exists public.v_psicologos_directorio;

alter table public.psicologos
add column if not exists visible_directorio boolean not null default true;

create view public.v_psicologos_directorio as
with resenas_resumen as (
  select psicologo_id,
    coalesce(avg(calificacion)::numeric(3,2), 0) as calificacion_promedio,
    count(id)::integer as total_resenas
  from public.resenas
  where visible = true
  group by psicologo_id
),
reales as (
  select
    p.id, p.usuario_id, u.nombre, u.apellido, u.email, u.telefono,
    u.foto_perfil_url, p.cedula_profesional, p.especialidades,
    p.enfoque_principal, p.biografia, p.anos_experiencia, p.membresia,
    p.tarifa_privada_centavos, p.tarifa_red_centavos,
    p.duracion_sesion_minutos, p.modalidades, p.acepta_nuevos_pacientes,
    p.verificado_at is not null as verificado, p.estado,
    coalesce(rr.calificacion_promedio, 0) as calificacion_promedio,
    coalesce(rr.total_resenas, 0) as total_resenas,
    p.visible_directorio, plan.codigo as plan_codigo, plan.nombre as plan_nombre,
    oficina.colonia as consultorio_colonia,
    oficina.municipio as consultorio_municipio,
    oficina.estado_region as consultorio_estado,
    oficina.latitud as consultorio_latitud,
    oficina.longitud as consultorio_longitud,
    oficina.fotos_urls as consultorio_fotos_urls
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
  where p.estado = 'activo'
    and p.visible_directorio = true
    and p.acepta_nuevos_pacientes = true
),
demo as (
  select * from (values
  ('ana','Ana','Mendoza Ruiz','Ansiedad y estrés laboral','Ansiedad,Estrés,Burnout','Acompaño a adultos que viven ansiedad, cansancio emocional o presión laboral. Trabajo con objetivos claros y herramientas prácticas.',8,85000,50,'pro','Providencia','Guadalajara','44630',20.694700,-103.384400,4.9,18),
  ('luis','Luis','Herrera Gómez','Terapia cognitivo conductual','Depresión,Ansiedad,Hábitos','Trabajo con adultos desde un enfoque cognitivo conductual para ordenar pensamientos, emociones y rutinas sostenibles.',11,90000,50,'intermedio','Ladrón de Guevara','Guadalajara','44600',20.682900,-103.377900,4.7,11),
  ('paula','Paula','Cervantes Ortiz','Autoestima y relaciones','Autoestima,Relaciones,Duelo','Creo espacios cálidos para revisar vínculos, límites personales y procesos de duelo con acompañamiento profesional.',6,75000,55,'afiliado','Americana','Guadalajara','44160',20.673900,-103.364000,4.8,14),
  ('diego','Diego','Salazar Peña','Psicoterapia para adolescentes','Adolescentes,Familia,Ansiedad','Atiendo adolescentes y familias, cuidando comunicación, regulación emocional y acuerdos realistas en casa.',9,80000,50,'basico','Chapalita','Guadalajara','44500',20.662900,-103.399800,4.5,7),
  ('mariana','Mariana','Vega Torres','Terapia de pareja','Pareja,Comunicación,Crisis','Facilito procesos de pareja orientados a comunicación, reparación de confianza y toma de decisiones.',13,110000,60,'intermedio','Ciudad del Sol','Zapopan','45050',20.653700,-103.417200,4.9,21),
  ('jorge','Jorge','Ibarra Luna','Manejo de crisis','Crisis,Estrés,Trauma','Acompaño momentos de crisis con intervención breve, contención emocional y seguimiento terapéutico.',10,95000,50,'basico','Vallarta Universidad','Zapopan','45110',20.703900,-103.413200,4.6,9),
  ('sofia','Sofía','Aguilar Ramos','Mindfulness clínico','Estrés,Regulación emocional,Mindfulness','Integro mindfulness y terapia basada en evidencia para trabajar estrés, ansiedad y autocuidado.',7,85000,50,'afiliado','Jardines Universidad','Zapopan','45110',20.700800,-103.424100,4.8,16),
  ('raul','Raúl','Padilla Cruz','Psicología infantil','Infantil,Crianza,Conducta','Trabajo con niñas, niños y cuidadores para fortalecer habilidades socioemocionales y dinámica familiar.',12,80000,45,'intermedio','Prados Vallarta','Zapopan','45020',20.679200,-103.425500,4.9,25),
  ('camila','Camila','Núñez Flores','Duelo y pérdidas','Duelo,Depresión,Transiciones','Acompaño pérdidas, separaciones y cambios vitales con un proceso respetuoso y estructurado.',5,70000,50,'basico','Arcos Vallarta','Guadalajara','44130',20.674500,-103.379100,4.4,5),
  ('hector','Héctor','Rojas Medina','Trauma y EMDR','Trauma,Ansiedad,EMDR','Trabajo con experiencias traumáticas desde técnicas de estabilización y reprocesamiento emocional.',15,120000,60,'pro','Puerta de Hierro','Zapopan','45116',20.713100,-103.411600,5.0,29),
  ('valeria','Valeria','Castillo Mora','Ansiedad social','Ansiedad social,Autoestima,Habilidades sociales','Apoyo a personas que desean sentirse más seguras en relaciones, exposición social y toma de decisiones.',4,65000,50,'basico','Santa Tere','Guadalajara','44600',20.684800,-103.369900,4.6,8),
  ('oscar','Óscar','Reyes Galván','Adicciones y hábitos','Adicciones,Hábitos,Familia','Trabajo procesos de consumo, recaídas y hábitos desde prevención, motivación y soporte familiar.',14,95000,55,'basico','Jardines del Bosque','Guadalajara','44520',20.656700,-103.388900,4.7,12),
  ('natalia','Natalia','Santos Bravo','Terapia humanista','Autoconocimiento,Autoestima,Duelo','Acompaño desde una mirada humanista, priorizando claridad emocional, sentido personal y bienestar cotidiano.',9,78000,50,'basico','Centro','Guadalajara','44100',20.674200,-103.348500,4.5,6),
  ('emilio','Emilio','Fuentes León','Psicología deportiva','Rendimiento,Estrés,Disciplina','Trabajo con deportistas y profesionales que buscan regular presión, enfoque y consistencia.',6,90000,50,'basico','Monraz','Guadalajara','44670',20.685900,-103.393200,4.6,10),
  ('andrea','Andrea','Romero Díaz','Terapia familiar','Familia,Crianza,Comunicación','Acompaño familias en conflictos, acuerdos, crianza y formas más sanas de comunicación.',10,88000,60,'basico','Bugambilias','Zapopan','45238',20.610700,-103.454700,4.8,17),
  ('fernando','Fernando','Mejía Soto','Depresión y motivación','Depresión,Motivación,Ansiedad','Trabajo con adultos que atraviesan bajo ánimo, falta de dirección o desgaste emocional.',8,76000,50,'basico','Oblatos','Guadalajara','44700',20.689800,-103.316100,4.3,4),
  ('karla','Karla','Ponce Villarreal','Sexualidad y pareja','Sexualidad,Pareja,Autoestima','Acompaño temas de sexualidad, intimidad, límites y construcción de vínculos sanos.',7,92000,50,'basico','La Estancia','Zapopan','45030',20.666500,-103.430500,4.8,15),
  ('miguel','Miguel','Campos Arias','Neuropsicología','Neuropsicología,Evaluación,Atención','Realizo evaluación y acompañamiento en atención, memoria, funciones ejecutivas y adaptación cotidiana.',16,130000,60,'intermedio','Colomos Providencia','Guadalajara','44660',20.705500,-103.386200,4.9,22),
  ('elena','Elena','Bautista Navarro','Acompañamiento perinatal','Perinatal,Maternidad,Ansiedad','Trabajo con mujeres y parejas durante embarazo, posparto, cambios familiares y ansiedad perinatal.',6,82000,50,'basico','Las Águilas','Zapopan','45080',20.633600,-103.408500,4.7,13),
  ('ricardo','Ricardo','Delgado Paredes','Terapia breve estratégica','Crisis,Solución de problemas,Estrés','Uso terapia breve para ordenar problemas, construir alternativas y avanzar en objetivos concretos.',12,90000,50,'basico','Tlaquepaque Centro','Tlaquepaque','45500',20.640500,-103.312700,4.4,7),
  ('gabriela','Gabriela','Molina Escobar','Trastornos alimentarios','Alimentación,Autoimagen,Ansiedad','Acompaño relación con comida, cuerpo y ansiedad desde un enfoque clínico y compasivo.',10,105000,55,'intermedio','San Javier','Guadalajara','44660',20.703200,-103.398300,4.9,24),
  ('ivan','Iván','Cárdenas Rivas','Orientación vocacional','Vocacional,Adolescentes,Proyecto de vida','Apoyo a jóvenes y adultos en decisiones académicas, laborales y proyecto de vida.',5,65000,45,'basico','Santa Margarita','Zapopan','45140',20.741000,-103.430200,4.5,5),
  ('monica','Mónica','Quintero Leal','Terapia sistémica','Familia,Pareja,Relaciones','Trabajo desde enfoque sistémico para comprender patrones relacionales y generar cambios sostenibles.',13,98000,60,'afiliado','El Colli Urbano','Zapopan','45070',20.657600,-103.435800,4.7,19),
  ('adrian','Adrián','Lozano Peralta','Estrés ejecutivo','Burnout,Liderazgo,Estrés','Atiendo profesionales y líderes con desgaste laboral, toma de decisiones y equilibrio personal.',11,115000,50,'pro','Andares','Zapopan','45116',20.710200,-103.412900,5.0,27),
  ('laura','Laura','Carrillo Benítez','Terapia afirmativa','LGBTQ+,Identidad,Ansiedad','Acompaño procesos de identidad, relaciones y bienestar emocional desde una práctica afirmativa.',8,80000,50,'basico','Mezquitán Country','Guadalajara','44260',20.696900,-103.361800,4.8,18),
  ('samuel','Samuel','Ortega Figueroa','Manejo de ira','Regulación emocional,Ira,Relaciones','Trabajo regulación emocional, impulsividad y comunicación para reducir conflictos cotidianos.',9,76000,50,'basico','Tonalá Centro','Tonalá','45400',20.624700,-103.242400,4.2,3),
  ('beatriz','Beatriz','López Andrade','Adultos mayores','Adultos mayores,Duelo,Familia','Acompaño envejecimiento, pérdidas, cambios familiares y adaptación emocional en adultos mayores.',18,85000,50,'afiliado','Huentitán','Guadalajara','44390',20.729500,-103.309700,4.8,20),
  ('mauricio','Mauricio','Serrano Valdez','Terapia online','Ansiedad,Trabajo remoto,Hábitos','Atiendo principalmente en línea con sesiones estructuradas, seguimiento y herramientas entre sesiones.',6,70000,50,'basico','Ciudad Granja','Zapopan','45010',20.669000,-103.452300,4.6,8),
  ('ximena','Ximena','Morales Cortés','Psicooncología','Salud,Duelo,Familia','Acompaño pacientes y familias frente a diagnóstico médico, incertidumbre y ajuste emocional.',12,110000,60,'pro','Country Club','Guadalajara','44610',20.702100,-103.376200,4.9,23),
  ('pablo','Pablo','Navarro Salas','Terapia para hombres','Masculinidades,Ansiedad,Relaciones','Trabajo con hombres en salud emocional, vínculos, presión social y toma de decisiones.',7,78000,50,'basico','Mirador del Sol','Zapopan','45054',20.641900,-103.430000,4.5,9)
  ) as t(slug,nombre,apellido,enfoque,especialidades,bio,exp,tarifa,duracion,plan,colonia,ciudad,cp,lat,lng,rating,reviews)
)
select * from reales
union all
select
  (substr(md5('psy-'||slug),1,8)||'-'||substr(md5('psy-'||slug),9,4)||'-'||substr(md5('psy-'||slug),13,4)||'-'||substr(md5('psy-'||slug),17,4)||'-'||substr(md5('psy-'||slug),21,12))::uuid as id,
  (substr(md5('user-'||slug),1,8)||'-'||substr(md5('user-'||slug),9,4)||'-'||substr(md5('user-'||slug),13,4)||'-'||substr(md5('user-'||slug),17,4)||'-'||substr(md5('user-'||slug),21,12))::uuid as usuario_id,
  nombre, apellido, 'directorio.demo+'||slug||'@mindcare.local' as email,
  '+52 33 3000 0000' as telefono,
  null::text as foto_perfil_url,
  'DEMO-'||upper(slug) as cedula_profesional,
  string_to_array(especialidades, ',') as especialidades,
  enfoque as enfoque_principal,
  bio as biografia,
  exp as anos_experiencia,
  case when plan='afiliado' then 'red_afiliado'::public.psychologist_membership else 'independiente_pro'::public.psychologist_membership end as membresia,
  tarifa as tarifa_privada_centavos,
  35000 as tarifa_red_centavos,
  duracion as duracion_sesion_minutos,
  case when slug in ('mauricio','laura') then array['virtual'::public.appointment_modality]
    else array['presencial'::public.appointment_modality,'virtual'::public.appointment_modality] end as modalidades,
  true as acepta_nuevos_pacientes,
  true as verificado,
  'activo'::public.record_status as estado,
  rating::numeric(3,2) as calificacion_promedio,
  reviews::integer as total_resenas,
  true as visible_directorio,
  plan as plan_codigo,
  case plan when 'pro' then 'Plan Pro' when 'intermedio' then 'Plan Intermedio' when 'afiliado' then 'Afiliado MindCare' else 'Plan Básico' end as plan_nombre,
  colonia as consultorio_colonia,
  ciudad as consultorio_municipio,
  'Jalisco' as consultorio_estado,
  lat::numeric(9,6) as consultorio_latitud,
  lng::numeric(9,6) as consultorio_longitud,
  '{}'::text[] as consultorio_fotos_urls
from demo;

grant select on public.v_psicologos_directorio to anon, authenticated;
notify pgrst, 'reload schema';
