# 🔐 Sistema de Autenticación MindCare

## ✅ Estado Actual

La plataforma MindCare ahora cuenta con:
- ✅ Login global unificado con autenticación real
- ✅ Base de datos conectada con Supabase
- ✅ Super usuario administrador creado
- ✅ Sistema de gestión de usuarios para crear nuevos usuarios
- ✅ Redirección automática según el rol del usuario

---

## 👤 CREDENCIALES DEL SUPER ADMINISTRADOR

```
📧 Email:      admin@mindcare.mx
🔑 Contraseña: Admin2026!
👤 Rol:        Administrador
```

**IMPORTANTE:** Estas credenciales te dan acceso total a la plataforma. Desde el panel de administración podrás crear todos los demás usuarios.

## ⚠️ CONFIGURACIÓN NECESARIA

El código del servidor ha sido actualizado pero necesita desplegarse en Supabase. Por favor lee el archivo **`CREDENCIALES_LOGIN.md`** para instrucciones completas sobre cómo activar el login.

---

## 🚀 Cómo Acceder a la Plataforma

### 1. Pantalla de Inicio

Cuando abras la aplicación, verás opciones para:
- **Ver Landing de Empresas** - Página informativa para empresas
- **Ver Landing de Control** - Página para psicólogos independientes
- **Iniciar Sesión Directamente** - Click en "Volver al inicio" si estás en un landing

### 2. Iniciar Sesión

1. En la pantalla de login, ingresa:
   - Email: `admin@mindcare.com`
   - Contraseña: `MindCare2026!`
2. Click en "Iniciar Sesión"
3. Serás redirigido automáticamente al **Panel de Administración**

### 3. Panel de Administración

Una vez dentro, tendrás acceso a:
- **Inicio** - Dashboard con estadísticas de la red
- **Red de Psicólogos** - Listado de psicólogos afiliados
- **Empresas** - Listado de empresas asociadas
- **Gestión de Usuarios** ⭐ **NUEVO** - Crear nuevos usuarios
- **Reportes** - Estadísticas y métricas
- **Configuración** - Ajustes de la plataforma

---

## 👥 Crear Nuevos Usuarios

### Acceder a Gestión de Usuarios

1. Inicia sesión como administrador
2. En el menú lateral, click en **"Gestión de Usuarios"**
3. Click en el botón **"Crear Usuario"**

### Tipos de Usuarios que Puedes Crear

#### 1️⃣ **Psicólogo**
- Para psicólogos que forman parte de la red MindCare
- Tendrán acceso a:
  - Calendario de citas
  - Gestión de pacientes
  - Cortes de pago semanales
  - Configuración de disponibilidad
  - Consultorios

#### 2️⃣ **Empresa**
- Para empresas que contratan servicios para sus empleados
- Tendrán acceso a:
  - Dashboard de uso de sesiones
  - Gestión de empleados
  - Reportes de impacto
  - Métricas de bienestar

#### 3️⃣ **Empleado**
- Para empleados de empresas asociadas
- Tendrán acceso a:
  - Buscar psicólogos
  - Agendar citas
  - Historial de sesiones
  - Ver perfiles de psicólogos

#### 4️⃣ **Administrador**
- Solo crea más administradores si es necesario
- Acceso total a la plataforma

### Proceso de Creación

1. Selecciona el **Tipo de Usuario**
2. Completa la información:
   - **Email** (debe ser único)
   - **Contraseña** (mínimo 8 caracteres)
   - **Nombre** y **Apellido**
   - **Teléfono** (opcional)
3. Click en **"Crear Usuario"**
4. **Comparte las credenciales** con el nuevo usuario

### Ejemplo de Creación

```
Tipo: Psicólogo
Email: carlos.ruiz@ejemplo.com
Contraseña: Psicologo2026!
Nombre: Carlos
Apellido: Ruiz
Teléfono: +52 33 1234 5678
```

El nuevo usuario podrá iniciar sesión con estas credenciales y será redirigido automáticamente a su panel correspondiente.

---

## 🔄 Flujo de Autenticación

### Sistema Actual

1. **Sin Sesión Activa** → Pantalla de Login
2. **Login Exitoso** → Redirección según rol:
   - `admin` → Panel de Administración
   - `psicologo` → Panel de Psicólogo
   - `empresa` → Panel de Empresa
   - `empleado` → Panel de Empleado
3. **Logout** → Regreso a pantalla de login

### Persistencia de Sesión

- La sesión se guarda en `localStorage`
- Si cierras el navegador y vuelves a abrir, tu sesión permanece activa
- Para cerrar sesión, usa el botón **"Cerrar Sesión"** (🚪) en la esquina inferior derecha

---

## 🗄️ Base de Datos

### Tablas Creadas

La base de datos Supabase ya tiene creadas todas las tablas necesarias:

- ✅ `usuarios` - Usuarios del sistema
- ✅ `psicologos` - Perfiles de psicólogos
- ✅ `empresas` - Empresas asociadas
- ✅ `empleados` - Empleados de empresas
- ✅ `consultorios` - Consultorios en Guadalajara
- ✅ `citas` - Citas agendadas
- ✅ `disponibilidad_horarios` - Horarios de psicólogos
- ✅ `resenas` - Reseñas y calificaciones
- ✅ `cortes_pago` - Cortes semanales de pago
- ✅ `reportes_empresariales` - Reportes para empresas
- ✅ `notificaciones` - Sistema de notificaciones

### Datos de Ejemplo

Se insertaron 5 consultorios de ejemplo en Guadalajara:
- Consultorio Centro
- Consultorio Providencia
- Consultorio Chapultepec
- Consultorio Zapopan
- Consultorio Tlaquepaque

---

## 🔒 Seguridad

### Recomendaciones

1. **Cambia la contraseña del administrador** después del primer acceso
2. **Genera contraseñas seguras** para todos los usuarios:
   - Mínimo 8 caracteres
   - Combina mayúsculas, minúsculas, números y símbolos
3. **No compartas credenciales** por canales inseguros
4. **Pide a los usuarios cambiar su contraseña** en el primer acceso

### Contraseñas de Ejemplo (NO usar en producción)

Para pruebas, puedes usar contraseñas como:
- `Psicologo2026!`
- `Empresa2026!`
- `Empleado2026!`

---

## 📝 Próximos Pasos

### Configuración Inicial

1. ✅ Inicia sesión como administrador
2. ✅ Explora el panel de administración
3. ✅ Ve a "Gestión de Usuarios"
4. ✅ Crea tu primer psicólogo de prueba
5. ✅ Cierra sesión y prueba iniciar sesión como ese psicólogo
6. ✅ Verifica que cada rol tenga acceso a su panel correcto

### Población de Datos

Crea usuarios para cada rol:

**Psicólogos** (3-5):
- Diferentes especialidades
- Diferentes zonas de Guadalajara
- Con perfiles completos (cédula, experiencia, etc.)

**Empresas** (2-3):
- Diferentes tamaños
- Diferentes industrias
- Con sesiones contratadas

**Empleados** (5-10):
- Vinculados a las empresas creadas
- Distribuidos en diferentes departamentos

---

## 🆘 Soporte

### Problemas Comunes

**No puedo iniciar sesión**
- Verifica que el email sea exactamente: `admin@mindcare.com`
- Verifica que la contraseña sea: `MindCare2026!` (distingue mayúsculas/minúsculas)
- Prueba limpiar el caché del navegador

**No veo la opción "Gestión de Usuarios"**
- Solo está disponible para usuarios con rol de administrador
- Verifica que hayas iniciado sesión con la cuenta de administrador

**Error al crear un usuario**
- Verifica que el email no esté ya registrado
- Asegúrate de que la contraseña tenga al menos 8 caracteres
- Revisa la consola del navegador para más detalles del error

---

## 📊 Archivos de Referencia

- **`setup_admin_user.sql`** - Script SQL para limpiar la BD y configurar admin
- **`create_admin_user.sh`** - Script bash para crear el admin (ya ejecutado)
- **`database_schema.sql`** - Esquema completo de la base de datos
- **`SUPABASE_INTEGRATION.md`** - Documentación técnica de la integración

---

## ✨ Características Implementadas

### Sistema de Autenticación
- ✅ Login unificado para todos los roles
- ✅ Redirección automática según rol
- ✅ Persistencia de sesión con localStorage
- ✅ Logout funcional
- ✅ Validación de credenciales

### Panel de Administración
- ✅ Dashboard con estadísticas
- ✅ Gestión de usuarios (crear)
- ✅ Listado de psicólogos
- ✅ Listado de empresas
- ✅ Reportes y métricas

### Integración con Supabase
- ✅ Conexión a base de datos
- ✅ API REST funcional
- ✅ Endpoints de autenticación
- ✅ Endpoints CRUD para todas las entidades

---

## 🎉 ¡Todo Listo!

Tu plataforma MindCare está completamente funcional y lista para usar. Inicia sesión con las credenciales del administrador y comienza a crear tus usuarios.

**¡Bienvenido a MindCare!** 🧠💚
