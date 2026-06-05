-- =====================================================
-- ⚠️ EJECUTA ESTE SQL EN SUPABASE AHORA
-- =====================================================
--
-- Instrucciones:
-- 1. Ve a https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/sql/new
-- 2. Copia y pega TODO este archivo
-- 3. Click en "RUN" (botón verde)
-- 4. Después intenta hacer login con las credenciales de abajo
--
-- =====================================================

-- Paso 1: Agregar columna password_hash a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Paso 2: Eliminar cualquier usuario admin anterior
DELETE FROM usuarios WHERE email LIKE '%admin%' OR email LIKE '%mindcare%';

-- Paso 3: Crear el super usuario administrador
INSERT INTO usuarios (
  email,
  nombre,
  apellido,
  telefono,
  rol,
  foto_perfil,
  activo,
  password_hash
) VALUES (
  'admin@test.com',
  'Super',
  'Admin',
  '+52 33 1234 5678',
  'admin',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  true,
  '12345678'
);

-- Paso 4: Verificar que se creó correctamente
SELECT
  email,
  nombre,
  apellido,
  rol,
  activo,
  CASE WHEN password_hash IS NOT NULL THEN '✅ Tiene contraseña' ELSE '❌ Sin contraseña' END as estado_password
FROM usuarios
WHERE email = 'admin@test.com';

-- =====================================================
-- ✅ CREDENCIALES PARA HACER LOGIN:
-- =====================================================
--
-- 📧 Email:      admin@test.com
-- 🔑 Contraseña: 12345678
-- 👤 Rol:        admin
--
-- =====================================================
-- DESPUÉS DE EJECUTAR ESTE SQL:
-- =====================================================
--
-- 1. Refresca la aplicación en tu navegador
-- 2. Ingresa las credenciales de arriba
-- 3. ¡Deberías poder entrar como administrador!
-- 4. Desde "Gestión de Usuarios" podrás crear más usuarios
--
-- =====================================================
