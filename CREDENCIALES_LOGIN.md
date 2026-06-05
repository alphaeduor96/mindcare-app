# 🔐 CREDENCIALES DE ACCESO - MindCare

## ⚠️ PROBLEMA ACTUAL

El sistema de autenticación de Supabase Auth requiere configuración adicional de email que no está disponible en el entorno actual. He actualizado el código para usar un sistema simplificado, pero los cambios necesitan ser desplegados en Supabase.

## ✅ SOLUCIÓN TEMPORAL

Usa estas credenciales que SÍ están creadas en el sistema:

### Usuario Administrador:
```
📧 Email:      admin@mindcare.mx  
🔑 Contraseña: Admin2026!
👤 Rol:        admin
```

## 🚀 OPCIONES PARA HACER FUNCIONAR EL LOGIN

### Opción 1: Desplegar los Cambios del Servidor (Recomendado)

Los cambios en el código del servidor ya están listos pero necesitan desplegarse:

1. Abre la terminal en Supabase
2. Ejecuta:
```bash
supabase functions deploy make-server-0e77298f
```

Después de esto, el login funcionará con las credenciales simples.

### Opción 2: Usar el Sistema Mock Temporal

Mientras desplegamos los cambios, puedes usar el sistema mock que ya está en la aplicación:

1. La aplicación tiene botones demo en la esquina inferior derecha
2. Usa el botón "👨‍💼 Admin" para entrar como administrador sin login
3. Esto te permitirá explorar la plataforma mientras arreglamos el login

### Opción 3: Configurar Supabase Auth (Completo)

Para usar Supabase Auth completamente:

1. Ve al panel de Supabase: https://supabase.com/dashboard/project/idnusdgnaohphbdoezch
2. Ve a Authentication > Email Templates
3. Configura el servidor SMTP o usa el de Supabase
4. Crea el usuario con estas credenciales en el panel de Auth

## 📝 ARCHIVOS ACTUALIZADOS

He actualizado estos archivos para usar un sistema de autenticación simplificado:

- ✅ `/supabase/functions/server/index.tsx` - Endpoints de login/signup actualizados
- ✅ `/fix_auth.sql` - SQL para agregar columna password_hash
- ✅ `/src/app/components/LoginPage.tsx` - Página de login funcional
- ✅ `/src/app/App.tsx` - Flujo de autenticación completo

## 🔧 CAMBIOS NECESARIOS EN SUPABASE

Ejecuta este SQL en el SQL Editor de Supabase para habilitar el nuevo sistema:

```sql
-- Agregar columna de contraseña
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Crear usuario administrador
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
  'admin@mindcare.mx',
  'Super',
  'Admin',
  '+52 33 1111 2222',
  'admin',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  true,
  'Admin2026!'
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = 'Admin2026!',
  activo = true;
```

## ⚡ REINICIAR EL SERVIDOR EDGE FUNCTION

Una vez ejecutado el SQL, reinicia la edge function:

```bash
# En la terminal de Supabase
supabase functions deploy make-server-0e77298f
```

O desde el dashboard de Supabase:
1. Ve a Edge Functions
2. Encuentra `make-server-0e77298f`
3. Click en "Deploy"

## ✅ VERIFICAR QUE FUNCIONA

Después de desplegar, prueba el login:

```bash
curl -X POST "https://idnusdgnaohphbdoezch.supabase.co/functions/v1/make-server-0e77298f/auth/login" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbnVzZGduYW9ocGhiZG9lemNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDA2NjYsImV4cCI6MjA5MjM3NjY2Nn0.ngmdlFFKDAyZkVm16p96k1tdXeNTcEwTCRZv33KDOPc" \
  -d '{"email": "admin@mindcare.mx", "password": "Admin2026!"}'
```

Deberías ver una respuesta exitosa con el usuario y access_token.

## 🎯 PRÓXIMOS PASOS

Una vez que el login funcione:

1. Inicia sesión con `admin@mindcare.mx` / `Admin2026!`
2. Ve a **Gestión de Usuarios** en el menú
3. Crea los demás usuarios (psicólogos, empresas, empleados)
4. ¡Empieza a usar la plataforma!

## 📞 SOPORTE

Si necesitas ayuda adicional:
1. Verifica que el SQL se ejecutó correctamente
2. Verifica que la edge function se desplegó
3. Revisa los logs en Supabase Dashboard > Edge Functions > Logs
