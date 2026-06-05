-- =====================================================
-- ⚠️ EJECUTA ESTE SQL EN SUPABASE PARA MIGRAR A SUPABASE AUTH
-- =====================================================
--
-- Instrucciones:
-- 1. Ve a https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/sql/new
-- 2. Copia y pega TODO este archivo
-- 3. Click en "RUN" (botón verde)
-- 4. Después de ejecutar, crea el usuario admin desde la aplicación
--
-- =====================================================

-- Paso 1: Eliminar columna password_hash (ya no se usa con Auth)
ALTER TABLE usuarios DROP COLUMN IF EXISTS password_hash;

-- Paso 2: Modificar la tabla usuarios para usar UUID (compatible con auth.users)
-- Primero guardamos los datos existentes en una tabla temporal
CREATE TABLE IF NOT EXISTS usuarios_backup AS SELECT * FROM usuarios;

-- Paso 3: Borrar la tabla usuarios actual
DROP TABLE IF EXISTS usuarios CASCADE;

-- Paso 4: Recrear la tabla usuarios con UUID
CREATE TABLE usuarios (
  id UUID PRIMARY KEY, -- Ahora usa UUID para coincidir con auth.users
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'psicologo', 'empresa', 'empleado')),
  foto_perfil TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paso 5: Crear índices
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- Paso 6: Recrear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Paso 7: Habilitar Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Paso 8: Crear políticas RLS
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON usuarios FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON usuarios FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role tiene acceso completo"
  ON usuarios FOR ALL
  USING (true);

-- Paso 9: Limpiar tabla de respaldo (opcional)
-- DROP TABLE IF EXISTS usuarios_backup;

-- =====================================================
-- ✅ MIGRACIÓN COMPLETADA
-- =====================================================
--
-- IMPORTANTE: La tabla usuarios ahora está vacía y lista para usar
-- con Supabase Auth.
--
-- SIGUIENTE PASO:
-- 1. Ve a la aplicación MindCare
-- 2. Accede a "Gestión de Usuarios" (desde el menú demo si aún no tienes un admin)
-- 3. Crea el primer usuario administrador
-- 4. Los usuarios se crearán automáticamente en:
--    - auth.users (Supabase Auth)
--    - usuarios (tu tabla)
--
-- =====================================================
