# 🔐 CONFIGURACIÓN DE SUPABASE AUTH - MindCare

## ✨ NUEVO: Sistema de Autenticación Profesional

Ahora MindCare usa **Supabase Auth** para autenticación segura de todos los usuarios (administradores, psicólogos, empresas y empleados).

---

## ⚡ PASOS PARA CONFIGURAR (5 minutos)

### PASO 1: Ejecutar la Migración SQL 🗄️

1. Abre este link: **https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/sql/new**
2. Abre el archivo **`MIGRACION_SUPABASE_AUTH.sql`** (está en la raíz del proyecto)
3. Copia **TODO** el contenido del archivo
4. Pega en el SQL Editor de Supabase
5. Click en el botón **"RUN"** (verde, arriba a la derecha)
6. Espera a que termine (verás "Success")

### PASO 2: Crear el Usuario Administrador 👤

Desde la aplicación MindCare:

1. **Accede temporalmente con el botón demo:**
   - En la esquina inferior derecha verás botones de demo
   - Click en el botón **"👨‍💼 Admin"**
   - Esto te llevará al panel de administración

2. **Crea el usuario administrador real:**
   - En el menú lateral, click en **"Gestión de Usuarios"**
   - Click en **"Crear Usuario"**
   - Completa el formulario:
     ```
     Tipo: Administrador
     Email: admin@mindcare.mx
     Contraseña: Admin2026! (o la que prefieras)
     Nombre: Admin
     Apellido: MindCare
     Teléfono: +52 33 1234 5678
     ```
   - Click en **"Crear Usuario"**

3. **Cierra sesión del demo:**
   - Click en el botón de **cerrar sesión** (🚪) en la esquina inferior derecha

4. **Inicia sesión con tu usuario real:**
   - Usa las credenciales que acabas de crear
   - Email: `admin@mindcare.mx`
   - Contraseña: `Admin2026!` (o la que elegiste)

### PASO 3: ¡Listo! 🎉

Ya puedes usar la plataforma. Desde "Gestión de Usuarios" podrás crear:
- ✅ Psicólogos
- ✅ Empresas
- ✅ Empleados
- ✅ Más administradores

---

## 🔒 Cómo Funciona

### Sistema de Doble Tabla

Cuando creas un usuario, el sistema:

1. **Crea el usuario en Supabase Auth** (`auth.users`)
   - Maneja la autenticación y contraseñas seguras
   - Genera tokens JWT
   - Gestiona sesiones

2. **Crea el perfil en tu tabla** (`usuarios`)
   - Guarda información del perfil (nombre, rol, etc.)
   - Se vincula con `auth.users` mediante el mismo ID (UUID)

### Login Seguro

Cuando un usuario inicia sesión:

1. Supabase Auth verifica el email y contraseña
2. Si es correcto, genera un token de sesión
3. El sistema busca el perfil en la tabla `usuarios`
4. Redirige según el rol del usuario

---

## 🎯 Crear Usuarios

### Desde el Panel de Administración

1. Ve a **"Gestión de Usuarios"**
2. Click en **"Crear Usuario"**
3. Selecciona el **tipo** (Psicólogo, Empresa, Empleado, Admin)
4. Completa la información
5. Click en **"Crear Usuario"**

El usuario se creará automáticamente en:
- ✅ Supabase Auth (para login)
- ✅ Tabla usuarios (para perfil)

### Tipos de Usuario

| Rol | Acceso |
|-----|--------|
| **Administrador** | Panel completo, gestión de usuarios, reportes |
| **Psicólogo** | Calendario, pacientes, cortes de pago |
| **Empresa** | Dashboard de empleados, métricas, reportes |
| **Empleado** | Buscar psicólogos, agendar citas, ver historial |

---

## 🆘 Solución de Problemas

### "Email already in use" al crear usuario

**Problema:** El email ya está registrado en Supabase Auth.

**Solución:**
1. Ve a: https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/auth/users
2. Busca el email y elimina el usuario
3. Intenta crear el usuario nuevamente

### "User not found" al hacer login

**Problema:** El usuario existe en Auth pero no en la tabla usuarios.

**Solución:**
1. Ve a: https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/auth/users
2. Copia el UUID del usuario
3. Ejecuta este SQL:
   ```sql
   INSERT INTO usuarios (id, email, nombre, apellido, rol, activo)
   VALUES (
     'uuid-del-usuario',
     'email@ejemplo.com',
     'Nombre',
     'Apellido',
     'rol', -- admin, psicologo, empresa o empleado
     true
   );
   ```

### "Invalid credentials" al hacer login

**Causas posibles:**
- Email incorrecto
- Contraseña incorrecta
- Usuario no confirmado (debería auto-confirmarse)
- Usuario inactivo en la tabla usuarios

**Solución:**
- Verifica el email y contraseña
- Verifica que el usuario esté activo:
  ```sql
  SELECT id, email, nombre, rol, activo
  FROM usuarios
  WHERE email = 'tu@email.com';
  ```

---

## 📋 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `MIGRACION_SUPABASE_AUTH.sql` | Script de migración (ejecutar en Supabase) |
| `README_CONFIGURACION_AUTH.md` | Este archivo - instrucciones de configuración |
| `/supabase/functions/server/index.tsx` | Endpoints de autenticación actualizados |

---

## 🔐 Seguridad

### Ventajas de Supabase Auth

✅ **Contraseñas encriptadas** - Nunca se guardan en texto plano  
✅ **Tokens JWT seguros** - Autenticación stateless  
✅ **Sesiones gestionadas** - Control de sesiones activas  
✅ **Email confirmado** - Auto-confirmación habilitada  
✅ **Row Level Security** - Políticas de acceso a datos  

### Recomendaciones

1. **Contraseñas fuertes:**
   - Mínimo 8 caracteres
   - Mayúsculas, minúsculas, números y símbolos
   - Ejemplo: `MindCare2026!`

2. **Cambio de contraseña:**
   - Pide a los usuarios cambiar su contraseña en el primer acceso
   - (Funcionalidad de cambio de contraseña: próximamente)

3. **Gestión de accesos:**
   - Desactiva usuarios que ya no deban tener acceso
   - No elimines usuarios, márcalos como inactivos

---

## 🎊 ¡Todo Listo!

Ahora tienes un sistema de autenticación profesional y seguro.

**Siguiente paso:** Crea tus primeros usuarios y comienza a usar MindCare.

¡Bienvenido a MindCare! 🧠💚
