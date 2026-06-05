-- =====================================================
-- 🔍 VERIFICACIÓN DEL SISTEMA DE AUTENTICACIÓN
-- =====================================================
--
-- Ejecuta este SQL para verificar el estado de tu sistema
-- =====================================================

-- 1. Verificar estructura de la tabla usuarios
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- 2. Verificar si existe la columna password_hash
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'usuarios'
      AND column_name = 'password_hash'
    ) THEN '✅ Sí existe password_hash (sistema legacy)'
    ELSE '❌ No existe password_hash (sistema nuevo con Supabase Auth)'
  END as estado_password_hash;

-- 3. Ver usuarios existentes
SELECT
  id,
  email,
  nombre,
  apellido,
  rol,
  activo,
  CASE
    WHEN password_hash IS NOT NULL THEN '✅ Tiene password_hash (legacy)'
    ELSE '❌ Sin password_hash (usa Supabase Auth)'
  END as sistema_auth,
  created_at
FROM usuarios
ORDER BY created_at DESC;

-- 4. Ver usuarios en Supabase Auth
SELECT
  id,
  email,
  created_at,
  confirmed_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- 📊 RESULTADOS ESPERADOS
-- =====================================================
--
-- Si la columna password_hash EXISTE:
-- - Sistema LEGACY activo
-- - Usuarios pueden login con email + password_hash
-- - Nuevos usuarios se crean en Supabase Auth
--
-- Si la columna password_hash NO EXISTE:
-- - Sistema NUEVO con Supabase Auth
-- - Todos los usuarios deben estar en auth.users
-- - Login funciona con Supabase Auth
--
-- =====================================================
