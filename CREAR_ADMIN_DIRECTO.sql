-- =====================================================
-- 🚀 OPCIÓN ALTERNATIVA: CREAR ADMIN DIRECTAMENTE DESDE SQL
-- =====================================================
--
-- Si prefieres crear el usuario admin directamente desde SQL
-- en lugar de usar la UI, puedes usar este script.
--
-- ⚠️ IMPORTANTE: Este método requiere que primero crees
-- el usuario en Supabase Auth manualmente.
--
-- =====================================================

-- INSTRUCCIONES:
--
-- OPCIÓN 1: Desde el Dashboard de Supabase Auth (Recomendado)
-- 1. Ve a: https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/auth/users
-- 2. Click en "Add user" > "Create new user"
-- 3. Completa:
--    - Email: admin@mindcare.mx
--    - Password: Admin2026! (o la que prefieras)
--    - Auto Confirm User: ✅ (activado)
-- 4. Click en "Create user"
-- 5. Copia el UUID del usuario que se creó
-- 6. Ejecuta el SQL de abajo reemplazando 'UUID-DEL-USUARIO'
--
-- OPCIÓN 2: Desde la aplicación (Más fácil)
-- 1. Usa el botón demo para acceder temporalmente como admin
-- 2. Ve a "Gestión de Usuarios"
-- 3. Crea el usuario admin desde ahí
--    (esto lo crea automáticamente en Auth y en la tabla usuarios)
--
-- =====================================================

-- Reemplaza 'UUID-DEL-USUARIO' con el UUID real del usuario creado en Auth
INSERT INTO usuarios (
  id,
  email,
  nombre,
  apellido,
  telefono,
  rol,
  foto_perfil,
  activo
) VALUES (
  'UUID-DEL-USUARIO', -- ⚠️ REEMPLAZA ESTO con el UUID de auth.users
  'admin@mindcare.mx',
  'Super',
  'Admin',
  '+52 33 1234 5678',
  'admin',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  telefono = EXCLUDED.telefono,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo;

-- Verificar que se creó correctamente
SELECT
  id,
  email,
  nombre,
  apellido,
  rol,
  activo,
  created_at
FROM usuarios
WHERE email = 'admin@mindcare.mx';

-- =====================================================
-- ✅ DESPUÉS DE EJECUTAR ESTE SQL:
-- =====================================================
--
-- 1. Refresca la aplicación en tu navegador
-- 2. Ingresa las credenciales:
--    📧 Email: admin@mindcare.mx
--    🔑 Contraseña: Admin2026! (o la que hayas usado)
-- 3. ¡Deberías poder entrar como administrador!
--
-- =====================================================
