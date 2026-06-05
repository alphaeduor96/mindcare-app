-- Agregar columna de contraseña a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Insertar/Actualizar el usuario administrador con contraseña
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
  'admin@mindcare.com',
  'Administrador',
  'MindCare',
  '+52 33 1234 5678',
  'admin',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  true,
  'Admin2026!' -- TEMPORAL: En producción usar hash real
)
ON CONFLICT (email)
DO UPDATE SET
  password_hash = 'Admin2026!',
  activo = true,
  rol = 'admin';

-- Verificar
SELECT email, nombre, apellido, rol, activo, password_hash FROM usuarios WHERE email = 'admin@mindcare.com';
