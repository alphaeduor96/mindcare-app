select
  auth.uid() as auth_user_id,
  u.id as public_usuario_id,
  u.email,
  u.rol,
  p.id as psicologo_id,
  pc.horario_inicio,
  pc.horario_cierre
from public.usuarios u
left join public.psicologos p on p.usuario_id = u.id
left join public.psicologo_configuracion pc on pc.psicologo_id = p.id
where u.id = auth.uid();
