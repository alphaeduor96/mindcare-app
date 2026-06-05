-- =====================================================
-- LIMPIAR BASE DE DATOS Y CREAR SUPER USUARIO
-- MindCare - Red de Psicólogos Profesional
-- =====================================================

-- PASO 1: LIMPIAR TODAS LAS TABLAS (orden correcto para evitar violaciones FK)
-- =====================================================

TRUNCATE TABLE notificaciones CASCADE;
TRUNCATE TABLE reportes_empresariales CASCADE;
TRUNCATE TABLE cortes_pago CASCADE;
TRUNCATE TABLE suscripciones CASCADE;
TRUNCATE TABLE resenas CASCADE;
TRUNCATE TABLE citas CASCADE;
TRUNCATE TABLE disponibilidad_horarios CASCADE;
TRUNCATE TABLE empleados CASCADE;
TRUNCATE TABLE empresas CASCADE;
TRUNCATE TABLE psicologo_consultorios CASCADE;
TRUNCATE TABLE psicologos CASCADE;
TRUNCATE TABLE consultorios CASCADE;
TRUNCATE TABLE usuarios CASCADE;

-- PASO 2: CREAR SUPER USUARIO ADMINISTRADOR
-- =====================================================

-- CREDENCIALES DEL SUPER ADMIN:
-- Email: admin@mindcare.com
-- Contraseña: MindCare2026!
-- Rol: admin

-- Primero, crear el usuario en Supabase Auth (esto se hará a través de la API)
-- Aquí solo insertamos el registro en la tabla usuarios con un ID específico

-- IMPORTANTE: Después de ejecutar este script, debes crear el usuario en Supabase Auth
-- usando el siguiente código en la consola de Supabase o mediante el endpoint signup:

/*
Ejecuta esto en el SQL Editor de Supabase para obtener el hash de la contraseña:
SELECT crypt('MindCare2026!', gen_salt('bf'));

O usa el endpoint de signup que ya creamos para registrar automáticamente.
*/

-- Insertamos el usuario administrador con un UUID fijo
INSERT INTO usuarios (
  id,
  email,
  nombre,
  apellido,
  telefono,
  rol,
  foto_perfil,
  activo,
  metadata
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- UUID fijo para facilitar referencia
  'admin@mindcare.com',
  'Administrador',
  'MindCare',
  '+52 33 1234 5678',
  'admin',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  true,
  '{"is_super_admin": true, "created_by": "system"}'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo;

-- PASO 3: CREAR EL USUARIO EN SUPABASE AUTH
-- =====================================================
-- EJECUTA ESTE CÓDIGO EN TU APLICACIÓN O VÍA API:

/*
fetch('https://idnusdgnaohphbdoezch.supabase.co/functions/v1/make-server-0e77298f/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    email: 'admin@mindcare.com',
    password: 'MindCare2026!',
    nombre: 'Administrador',
    apellido: 'MindCare',
    rol: 'admin',
    telefono: '+52 33 1234 5678'
  })
});
*/

-- PASO 4: DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar algunos consultorios de ejemplo en Guadalajara
INSERT INTO consultorios (nombre, direccion, colonia, municipio, codigo_postal, activo) VALUES
('Consultorio Centro', 'Av. Hidalgo 123', 'Centro', 'Guadalajara', '44100', true),
('Consultorio Providencia', 'Av. Providencia 456', 'Providencia', 'Guadalajara', '44630', true),
('Consultorio Chapultepec', 'Av. Chapultepec 789', 'Americana', 'Guadalajara', '44160', true),
('Consultorio Zapopan', 'Av. Patria 321', 'Jardines de San Ignacio', 'Zapopan', '45040', true),
('Consultorio Tlaquepaque', 'Av. Niños Héroes 654', 'Centro', 'Tlaquepaque', '45500', true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el usuario admin fue creado
SELECT
  id,
  email,
  nombre,
  apellido,
  rol,
  activo,
  fecha_registro
FROM usuarios
WHERE email = 'admin@mindcare.com';

-- Verificar consultorios
SELECT COUNT(*) as total_consultorios FROM consultorios WHERE activo = true;

-- =====================================================
-- RESUMEN
-- =====================================================

/*
✅ BASE DE DATOS LIMPIADA
✅ SUPER USUARIO ADMINISTRADOR CREADO

📧 CREDENCIALES DEL ADMINISTRADOR:
   Email: admin@mindcare.com
   Contraseña: MindCare2026!
   Rol: admin

⚠️ IMPORTANTE:
   Debes crear el usuario en Supabase Auth usando el endpoint /auth/signup
   con las credenciales de arriba, o ejecuta el siguiente comando:

   curl -X POST https://idnusdgnaohphbdoezch.supabase.co/functions/v1/make-server-0e77298f/auth/signup \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbnVzZGduYW9ocGhiZG9lemNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDA2NjYsImV4cCI6MjA5MjM3NjY2Nn0.ngmdlFFKDAyZkVm16p96k1tdXeNTcEwTCRZv33KDOPc" \
     -d '{
       "email": "admin@mindcare.com",
       "password": "MindCare2026!",
       "nombre": "Administrador",
       "apellido": "MindCare",
       "rol": "admin",
       "telefono": "+52 33 1234 5678"
     }'

🎉 Listo para usar!
   Accede con las credenciales de arriba y crea los demás usuarios desde el panel de administración.
*/
