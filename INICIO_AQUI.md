# 🚀 INICIO AQUÍ - Configuración MindCare

## 📋 Sistema Actualizado: Supabase Auth

MindCare ahora usa **Supabase Auth** para autenticación profesional y segura.

---

## ⚡ 3 PASOS RÁPIDOS (5 minutos)

### ✅ PASO 1: Ejecutar Migración de Base de Datos

1. Abre: **https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/sql/new**
2. Abre el archivo **`MIGRACION_SUPABASE_AUTH.sql`**
3. Copia TODO el contenido
4. Pégalo en el SQL Editor de Supabase
5. Click en **"RUN"**
6. Espera el mensaje "Success"

### ✅ PASO 2: Crear Usuario Administrador

**Opción A: Desde la Aplicación (Recomendado - Más Fácil)**

1. Abre la aplicación MindCare
2. Usa el botón demo **"👨‍💼 Admin"** (esquina inferior derecha)
3. Ve a **"Gestión de Usuarios"** en el menú lateral
4. Click en **"Crear Usuario"**
5. Completa:
   - Tipo: **Administrador**
   - Email: **admin@mindcare.mx**
   - Contraseña: **Admin2026!** (o la que prefieras)
   - Nombre: **Admin**
   - Apellido: **MindCare**
6. Click en **"Crear Usuario"**
7. Cierra sesión del demo (botón 🚪)

**Opción B: Desde Supabase Auth (Manual)**

1. Ve a: https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/auth/users
2. Click "Add user" > "Create new user"
3. Email: `admin@mindcare.mx`, Password: `Admin2026!`
4. Auto Confirm User: ✅ activado
5. Copia el UUID del usuario creado
6. Sigue las instrucciones en **`CREAR_ADMIN_DIRECTO.sql`**

### ✅ PASO 3: Iniciar Sesión

1. Refresca la aplicación
2. Ingresa tus credenciales:
   ```
   📧 Email: admin@mindcare.mx
   🔑 Contraseña: Admin2026!
   ```
3. ¡Listo! Ya puedes usar MindCare

---

## 🎯 Siguiente: Crear Usuarios

Una vez dentro como administrador:

1. Ve a **"Gestión de Usuarios"**
2. Crea usuarios para:
   - ✅ Psicólogos
   - ✅ Empresas
   - ✅ Empleados
   - ✅ Más administradores

Los usuarios se crearán automáticamente en Supabase Auth y podrán iniciar sesión inmediatamente.

---

## 📁 Archivos de Documentación

| Archivo | Para qué sirve |
|---------|----------------|
| **`INICIO_AQUI.md`** | Este archivo - Guía de inicio rápido |
| **`MIGRACION_SUPABASE_AUTH.sql`** | Script SQL de migración (ejecutar primero) |
| **`README_CONFIGURACION_AUTH.md`** | Documentación completa del sistema Auth |
| **`CREAR_ADMIN_DIRECTO.sql`** | Crear admin desde SQL (alternativa a la UI) |

---

## 🔧 Desplegar Cambios del Servidor (Opcional)

Los cambios del servidor se han actualizado en el código. Para desplegarlos:

**Desde tu máquina local:**
```bash
supabase functions deploy make-server-0e77298f
```

**Desde el Dashboard de Supabase:**
1. Ve a: https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/functions
2. Busca `make-server-0e77298f`
3. Click en "Deploy" si ves cambios pendientes

**Nota:** Si usas el método de la Opción A (crear admin desde la UI), el código se desplegará automáticamente cuando uses la función de crear usuario.

---

## 🆘 ¿Problemas?

Consulta **`README_CONFIGURACION_AUTH.md`** para solución de problemas detallada.

---

## ✨ ¿Qué cambió?

### Antes
- ❌ Contraseñas en texto plano
- ❌ Autenticación manual en tabla usuarios
- ❌ Sin gestión de sesiones

### Ahora
- ✅ Supabase Auth profesional
- ✅ Contraseñas encriptadas
- ✅ Tokens JWT seguros
- ✅ Gestión de sesiones
- ✅ Login para todos los roles

---

## 🎉 ¡Todo listo!

Siguiendo estos 3 pasos tendrás MindCare funcionando con autenticación profesional.

**¡Bienvenido a MindCare!** 🧠💚
