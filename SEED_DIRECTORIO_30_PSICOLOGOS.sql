create extension if not exists pgcrypto;

alter table public.psicologos
add column if not exists visible_directorio boolean not null default true;

insert into public.planes_suscripcion_psicologo
  (codigo, nombre, precio_mensual_centavos, limite_citas_mensuales, orden)
values
  ('basico', 'Plan Básico', 0, 10, 1),
  ('intermedio', 'Plan Intermedio', 15000, 20, 2),
  ('pro', 'Plan Pro', 25000, 50, 3),
  ('afiliado', 'Afiliado MindCare', 0, null, 4)
on conflict (codigo) do update set
  nombre = excluded.nombre,
  precio_mensual_centavos = excluded.precio_mensual_centavos,
  limite_citas_mensuales = excluded.limite_citas_mensuales,
  orden = excluded.orden,
  updated_at = now();

delete from public.psicologo_consultorios
where consultorio_id in (
  select id from public.consultorios
  where nombre like 'Consultorio Demo MindCare %'
);

delete from public.consultorios
where nombre like 'Consultorio Demo MindCare %';

delete from public.usuarios
where email like 'directorio.demo+%@mindcare.local';

with seed as (
  select * from (values
  ('ana','Ana','Mendoza Ruiz','Ansiedad y estrés laboral','Ansiedad,Estrés,Burnout','Acompaño a adultos que viven ansiedad, cansancio emocional o presión laboral. Trabajo con objetivos claros y herramientas prácticas.',8,85000,50,'pro','Providencia','Guadalajara','44630','Calle Quebec 920',20.694700,-103.384400),
  ('luis','Luis','Herrera Gómez','Terapia cognitivo conductual','Depresión,Ansiedad,Hábitos','Trabajo con adultos desde un enfoque cognitivo conductual para ordenar pensamientos, emociones y rutinas sostenibles.',11,90000,50,'intermedio','Ladrón de Guevara','Guadalajara','44600','Av. México 2550',20.682900,-103.377900),
  ('paula','Paula','Cervantes Ortiz','Autoestima y relaciones','Autoestima,Relaciones,Duelo','Creo espacios cálidos para revisar vínculos, límites personales y procesos de duelo con acompañamiento profesional.',6,75000,55,'afiliado','Americana','Guadalajara','44160','Calle Libertad 1457',20.673900,-103.364000),
  ('diego','Diego','Salazar Peña','Psicoterapia para adolescentes','Adolescentes,Familia,Ansiedad','Atiendo adolescentes y familias, cuidando comunicación, regulación emocional y acuerdos realistas en casa.',9,80000,50,'basico','Chapalita','Guadalajara','44500','Av. Guadalupe 1450',20.662900,-103.399800),
  ('mariana','Mariana','Vega Torres','Terapia de pareja','Pareja,Comunicación,Crisis','Facilito procesos de pareja orientados a comunicación, reparación de confianza y toma de decisiones.',13,110000,60,'pro','Ciudad del Sol','Zapopan','45050','Av. Moctezuma 3515',20.653700,-103.417200),
  ('jorge','Jorge','Ibarra Luna','Manejo de crisis','Crisis,Estrés,Trauma','Acompaño momentos de crisis con intervención breve, contención emocional y seguimiento terapéutico.',10,95000,50,'intermedio','Vallarta Universidad','Zapopan','45110','Av. Universidad 1795',20.703900,-103.413200),
  ('sofia','Sofía','Aguilar Ramos','Mindfulness clínico','Estrés,Regulación emocional,Mindfulness','Integro mindfulness y terapia basada en evidencia para trabajar estrés, ansiedad y autocuidado.',7,85000,50,'afiliado','Jardines Universidad','Zapopan','45110','Av. Naciones Unidas 5200',20.700800,-103.424100),
  ('raul','Raúl','Padilla Cruz','Psicología infantil','Infantil,Crianza,Conducta','Trabajo con niñas, niños y cuidadores para fortalecer habilidades socioemocionales y dinámica familiar.',12,80000,45,'pro','Prados Vallarta','Zapopan','45020','Av. Patria 1201',20.679200,-103.425500),
  ('camila','Camila','Núñez Flores','Duelo y pérdidas','Duelo,Depresión,Transiciones','Acompaño pérdidas, separaciones y cambios vitales con un proceso respetuoso y estructurado.',5,70000,50,'basico','Arcos Vallarta','Guadalajara','44130','Av. Vallarta 2200',20.674500,-103.379100),
  ('hector','Héctor','Rojas Medina','Trauma y EMDR','Trauma,Ansiedad,EMDR','Trabajo con experiencias traumáticas desde técnicas de estabilización y reprocesamiento emocional.',15,120000,60,'pro','Puerta de Hierro','Zapopan','45116','Blvd. Puerta de Hierro 5153',20.713100,-103.411600),
  ('valeria','Valeria','Castillo Mora','Ansiedad social','Ansiedad social,Autoestima,Habilidades sociales','Apoyo a personas que desean sentirse más seguras en relaciones, exposición social y toma de decisiones.',4,65000,50,'intermedio','Santa Tere','Guadalajara','44600','Calle Manuel Acuña 1520',20.684800,-103.369900),
  ('oscar','Óscar','Reyes Galván','Adicciones y hábitos','Adicciones,Hábitos,Familia','Trabajo procesos de consumo, recaídas y hábitos desde prevención, motivación y soporte familiar.',14,95000,55,'afiliado','Jardines del Bosque','Guadalajara','44520','Av. Niños Héroes 2805',20.656700,-103.388900),
  ('natalia','Natalia','Santos Bravo','Terapia humanista','Autoconocimiento,Autoestima,Duelo','Acompaño desde una mirada humanista, priorizando claridad emocional, sentido personal y bienestar cotidiano.',9,78000,50,'basico','Centro','Guadalajara','44100','Av. Juárez 456',20.674200,-103.348500),
  ('emilio','Emilio','Fuentes León','Psicología deportiva','Rendimiento,Estrés,Disciplina','Trabajo con deportistas y profesionales que buscan regular presión, enfoque y consistencia.',6,90000,50,'intermedio','Monraz','Guadalajara','44670','Av. Manuel Acuña 3184',20.685900,-103.393200),
  ('andrea','Andrea','Romero Díaz','Terapia familiar','Familia,Crianza,Comunicación','Acompaño familias en conflictos, acuerdos, crianza y formas más sanas de comunicación.',10,88000,60,'pro','Bugambilias','Zapopan','45238','Av. Bugambilias 2299',20.610700,-103.454700),
  ('fernando','Fernando','Mejía Soto','Depresión y motivación','Depresión,Motivación,Ansiedad','Trabajo con adultos que atraviesan bajo ánimo, falta de dirección o desgaste emocional.',8,76000,50,'basico','Oblatos','Guadalajara','44700','Av. Circunvalación Oblatos 2100',20.689800,-103.316100),
  ('karla','Karla','Ponce Villarreal','Sexualidad y pareja','Sexualidad,Pareja,Autoestima','Acompaño temas de sexualidad, intimidad, límites y construcción de vínculos sanos.',7,92000,50,'afiliado','La Estancia','Zapopan','45030','Av. Beethoven 5610',20.666500,-103.430500),
  ('miguel','Miguel','Campos Arias','Neuropsicología','Neuropsicología,Evaluación,Atención','Realizo evaluación y acompañamiento en atención, memoria, funciones ejecutivas y adaptación cotidiana.',16,130000,60,'pro','Colomos Providencia','Guadalajara','44660','Av. Acueducto 2380',20.705500,-103.386200),
  ('elena','Elena','Bautista Navarro','Acompañamiento perinatal','Perinatal,Maternidad,Ansiedad','Trabajo con mujeres y parejas durante embarazo, posparto, cambios familiares y ansiedad perinatal.',6,82000,50,'intermedio','Las Águilas','Zapopan','45080','Av. López Mateos Sur 5050',20.633600,-103.408500),
  ('ricardo','Ricardo','Delgado Paredes','Terapia breve estratégica','Crisis,Solución de problemas,Estrés','Uso terapia breve para ordenar problemas, construir alternativas y avanzar en objetivos concretos.',12,90000,50,'basico','Tlaquepaque Centro','Tlaquepaque','45500','Calle Independencia 205',20.640500,-103.312700),
  ('gabriela','Gabriela','Molina Escobar','Trastornos alimentarios','Alimentación,Autoimagen,Ansiedad','Acompaño relación con comida, cuerpo y ansiedad desde un enfoque clínico y compasivo.',10,105000,55,'pro','San Javier','Guadalajara','44660','Av. Pablo Neruda 3040',20.703200,-103.398300),
  ('ivan','Iván','Cárdenas Rivas','Orientación vocacional','Vocacional,Adolescentes,Proyecto de vida','Apoyo a jóvenes y adultos en decisiones académicas, laborales y proyecto de vida.',5,65000,45,'intermedio','Santa Margarita','Zapopan','45140','Av. Santa Margarita 3600',20.741000,-103.430200),
  ('monica','Mónica','Quintero Leal','Terapia sistémica','Familia,Pareja,Relaciones','Trabajo desde enfoque sistémico para comprender patrones relacionales y generar cambios sostenibles.',13,98000,60,'afiliado','El Colli Urbano','Zapopan','45070','Av. Patria 3400',20.657600,-103.435800),
  ('adrian','Adrián','Lozano Peralta','Estrés ejecutivo','Burnout,Liderazgo,Estrés','Atiendo profesionales y líderes con desgaste laboral, toma de decisiones y equilibrio personal.',11,115000,50,'pro','Andares','Zapopan','45116','Blvd. Puerta de Hierro 4965',20.710200,-103.412900),
  ('laura','Laura','Carrillo Benítez','Terapia afirmativa','LGBTQ+,Identidad,Ansiedad','Acompaño procesos de identidad, relaciones y bienestar emocional desde una práctica afirmativa.',8,80000,50,'intermedio','Mezquitán Country','Guadalajara','44260','Av. Federalismo 1780',20.696900,-103.361800),
  ('samuel','Samuel','Ortega Figueroa','Manejo de ira','Regulación emocional,Ira,Relaciones','Trabajo regulación emocional, impulsividad y comunicación para reducir conflictos cotidianos.',9,76000,50,'basico','Tonalá Centro','Tonalá','45400','Av. Tonaltecas 125',20.624700,-103.242400),
  ('beatriz','Beatriz','López Andrade','Adultos mayores','Adultos mayores,Duelo,Familia','Acompaño envejecimiento, pérdidas, cambios familiares y adaptación emocional en adultos mayores.',18,85000,50,'afiliado','Huentitán','Guadalajara','44390','Calzada Independencia Norte 3295',20.729500,-103.309700),
  ('mauricio','Mauricio','Serrano Valdez','Terapia online','Ansiedad,Trabajo remoto,Hábitos','Atiendo principalmente en línea con sesiones estructuradas, seguimiento y herramientas entre sesiones.',6,70000,50,'intermedio','Ciudad Granja','Zapopan','45010','Calzada Central 735',20.669000,-103.452300),
  ('ximena','Ximena','Morales Cortés','Psicooncología','Salud,Duelo,Familia','Acompaño pacientes y familias frente a diagnóstico médico, incertidumbre y ajuste emocional.',12,110000,60,'pro','Country Club','Guadalajara','44610','Mar Egeo 1525',20.702100,-103.376200),
  ('pablo','Pablo','Navarro Salas','Terapia para hombres','Masculinidades,Ansiedad,Relaciones','Trabajo con hombres en salud emocional, vínculos, presión social y toma de decisiones.',7,78000,50,'basico','Mirador del Sol','Zapopan','45054','Av. Copérnico 3900',20.641900,-103.430000)
  ) as t(slug,nombre,apellido,enfoque,especialidades,bio,exp,tarifa,duracion,plan,colonia,ciudad,cp,direccion,lat,lng)
),
auth_existing as (
  select au.id, au.email
  from auth.users au
  join seed s on au.email = 'directorio.demo+'||s.slug||'@mindcare.local'
),
auth_inserted as (
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  select gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'directorio.demo+'||slug||'@mindcare.local',
    crypt('MindCareDemo2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nombre', nombre, 'apellido', apellido, 'seed', 'directorio_30'),
    now(), now(), '', '', '', ''
  from seed
  where not exists (
    select 1
    from auth.users au
    where au.email = 'directorio.demo+'||seed.slug||'@mindcare.local'
  )
  returning id,email
),
auth_upsert as (
  select id,email from auth_existing
  union all
  select id,email from auth_inserted
),
users_upsert as (
  insert into public.usuarios (id,email,nombre,apellido,telefono,rol,foto_perfil_url,estado,metadata)
  select au.id, 'directorio.demo+'||s.slug||'@mindcare.local', s.nombre, s.apellido,
    '+52 33 '||lpad((10000000 + row_number() over ())::text,8,'0'),
    'psicologo', null, 'activo', jsonb_build_object('seed','directorio_30')
  from seed s
  join auth_upsert au on au.email='directorio.demo+'||s.slug||'@mindcare.local'
  on conflict (email) do update set
    nombre=excluded.nombre, apellido=excluded.apellido, telefono=excluded.telefono,
    rol=excluded.rol, estado='activo', metadata=excluded.metadata, updated_at=now()
  returning id,email
),
psys as (
  insert into public.psicologos (
    usuario_id,cedula_profesional,especialidades,enfoque_principal,biografia,
    anos_experiencia,membresia,tarifa_privada_centavos,duracion_sesion_minutos,
    modalidades,acepta_nuevos_pacientes,verificado_at,estado,visible_directorio
  )
  select u.id, 'DEMO-'||upper(s.slug), string_to_array(s.especialidades, ','),
    s.enfoque, s.bio, s.exp,
    case when s.plan='afiliado' then 'red_afiliado'::public.psychologist_membership else 'independiente_pro'::public.psychologist_membership end,
    s.tarifa, s.duracion,
    case when s.slug in ('mauricio','laura') then array['virtual'::public.appointment_modality]
      else array['presencial'::public.appointment_modality,'virtual'::public.appointment_modality] end,
    true, now(), 'activo', true
  from seed s join users_upsert u on u.email='directorio.demo+'||s.slug||'@mindcare.local'
  on conflict (usuario_id) do update set
    especialidades=excluded.especialidades,enfoque_principal=excluded.enfoque_principal,
    biografia=excluded.biografia,anos_experiencia=excluded.anos_experiencia,
    membresia=excluded.membresia,tarifa_privada_centavos=excluded.tarifa_privada_centavos,
    duracion_sesion_minutos=excluded.duracion_sesion_minutos,modalidades=excluded.modalidades,
    acepta_nuevos_pacientes=true,verificado_at=now(),estado='activo',
    visible_directorio=true,updated_at=now()
  returning id,usuario_id
),
offices as (
  insert into public.consultorios (nombre,direccion,colonia,municipio,estado_region,codigo_postal,latitud,longitud,telefono,descripcion,amenidades,estado)
  select 'Consultorio Demo MindCare '||s.slug, s.direccion, s.colonia, s.ciudad, 'Jalisco',
    s.cp, s.lat, s.lng, '+52 33 3000 0000',
    'Consultorio privado preparado para atención presencial y sesiones de seguimiento.',
    array['wifi','estacionamiento','sillas','aire_acondicionado'], 'activo'
  from seed s
  returning id,nombre
)
insert into public.psicologo_consultorios (psicologo_id,consultorio_id,es_principal)
select p.id, o.id, true
from seed s
join users_upsert u on u.email='directorio.demo+'||s.slug||'@mindcare.local'
join psys p on p.usuario_id=u.id
join offices o on o.nombre='Consultorio Demo MindCare '||s.slug
on conflict (psicologo_id,consultorio_id) do update set es_principal=true;

insert into public.suscripciones_psicologo (psicologo_id,plan_id,estado,inicia_at)
select p.id, plan.id, 'activa', now()
from public.psicologos p
join public.usuarios u on u.id=p.usuario_id and u.email like 'directorio.demo+%@mindcare.local'
join public.planes_suscripcion_psicologo plan
  on plan.codigo = case
    when u.email like '%ana%' or u.email like '%mariana%' or u.email like '%hector%' or u.email like '%raul%' or u.email like '%andrea%' or u.email like '%miguel%' or u.email like '%gabriela%' or u.email like '%adrian%' or u.email like '%ximena%' then 'pro'
    when u.email like '%paula%' or u.email like '%sofia%' or u.email like '%oscar%' or u.email like '%karla%' or u.email like '%monica%' or u.email like '%beatriz%' then 'afiliado'
    when u.email like '%diego%' or u.email like '%camila%' or u.email like '%natalia%' or u.email like '%fernando%' or u.email like '%ricardo%' or u.email like '%samuel%' or u.email like '%pablo%' then 'basico'
    else 'intermedio'
  end
on conflict (psicologo_id) do update set plan_id=excluded.plan_id, estado='activa', updated_at=now();

notify pgrst, 'reload schema';
