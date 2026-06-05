# ✅ Empresas - Conectadas a Base de Datos

## 🎯 Funcionalidad Implementada

La sección **"Empresas Asociadas"** en el panel de administración ahora está completamente conectada con la base de datos de Supabase.

---

## 📝 Funciones Disponibles

### 1. **Registrar Nueva Empresa** ➕

Desde el botón **"Nueva Empresa"** puedes dar de alta empresas con toda su información:

#### Información Empresarial
- ✅ **Razón Social** (requerida)
- ✅ **RFC** (requerido y único)
- ✅ Industria
- ✅ Tamaño de empresa (Pequeña, Mediana, Grande)
- ✅ Dirección completa

#### Información de Contacto
- ✅ Responsable de RRHH (nombre completo)
- ✅ **Email** (requerido, será el usuario de login)
- ✅ Teléfono corporativo

#### Información del Plan
- ✅ Número de empleados
- ✅ **Plan de sesiones:**
  - **Básico:** 2 sesiones por empleado
  - **Estándar:** 4 sesiones por empleado
  - **Premium:** 8 sesiones por empleado

**Cálculo automático:** Si tienes 100 empleados con plan Estándar = 400 sesiones totales

---

## 📊 Lista de Empresas

La tabla muestra información en tiempo real de la base de datos:

### Columnas Mostradas

| Columna | Descripción |
|---------|-------------|
| **Empresa** | Razón social e industria |
| **Contacto** | Nombre del responsable RRHH, email y teléfono |
| **RFC** | RFC de la empresa |
| **Empleados** | Número total de empleados |
| **Sesiones Disponibles** | Sesiones disponibles / sesiones contratadas |
| **Estado** | Activa/Inactiva |
| **Acciones** | Editar, Eliminar |

### Estadísticas en Tiempo Real

- 📈 **Total Empresas** - Total de empresas registradas
- ✅ **Activas** - Empresas activas
- 👥 **Total Empleados** - Suma de empleados de todas las empresas
- 📊 **Sesiones Disponibles** - Total de sesiones disponibles en todas las empresas

---

## 🔄 Flujo de Registro

### Paso 1: Crear Usuario
El sistema automáticamente crea:
1. Usuario en **Supabase Auth** (para login seguro)
2. Registro en tabla **usuarios** con rol "empresa"
3. Credenciales de acceso con contraseña temporal

### Paso 2: Crear Perfil Empresarial
Se crea el perfil en tabla **empresas** con:
- Vínculo al usuario creado
- Razón social y RFC
- Datos de contacto RRHH
- Información del plan
- Cálculo automático de sesiones totales
- Configuración inicial:
  - Sesiones usadas: 0
  - Sesiones disponibles: Total del plan
  - Activo: Sí

### Paso 3: Confirmación
- ✅ Notificación de éxito con credenciales
- ✅ **Credenciales copiadas al portapapeles automáticamente**
- ✅ Recarga automática de la lista
- ✅ La empresa aparece en la tabla inmediatamente

---

## 🔐 Acceso de Empresas

### Credenciales Generadas

Cuando creas una empresa, el sistema genera automáticamente:
- **Email:** El email del responsable RRHH que ingresaste
- **Contraseña:** Temporal aleatoria (ej: `Mind7a4c69!`)

**Las credenciales se copian automáticamente al portapapeles**

### Próximos Pasos para la Empresa

1. La empresa puede **iniciar sesión** con su email
2. Será redirigida a su **panel de empresa**
3. Podrá ver:
   - Dashboard de uso de sesiones
   - Gestión de empleados
   - Reportes de impacto
   - Métricas de bienestar
   - Sesiones disponibles/usadas

---

## 🎨 Estados y Badges

### Estado de la Empresa
- 🟢 **Activa** - Verde (puede usar sesiones)
- ⚫ **Inactiva** - Gris (no puede usar sesiones)

### Sesiones
- 🔵 Badge con sesiones disponibles
- 📊 Texto mostrando total contratado

---

## 📋 Validaciones Implementadas

### Campos Requeridos
- ✅ Razón Social
- ✅ **RFC** (único, 13 caracteres máximo)
- ✅ Responsable de RRHH
- ✅ Email (único)

### Validaciones Automáticas
- RFC en mayúsculas automáticamente
- Email válido
- Email no duplicado
- RFC no duplicado
- Cálculo automático de sesiones totales

---

## 🔍 Consultas a la Base de Datos

### Endpoints Utilizados

#### GET - Listar Empresas
```
GET /make-server-0e77298f/empresas
```
Retorna todas las empresas con datos del usuario (nombre, email, teléfono).

#### POST - Crear Usuario
```
POST /make-server-0e77298f/auth/signup
```
Crea el usuario en Supabase Auth y tabla usuarios.

#### POST - Crear Empresa
```
POST /make-server-0e77298f/empresas
```
Crea el perfil empresarial.

---

## 🎯 Ejemplo de Registro

### Datos de Entrada
```
Razón Social: TechCorp Solutions SA de CV
RFC: TEC120315XYZ
Industria: Tecnología
Tamaño: Mediana
Responsable RRHH: María González López
Email: maria.gonzalez@techcorp.com
Teléfono: +52 33 1234 5678
Dirección: Av. Vallarta 1234, Guadalajara, Jal.
Número de Empleados: 150
Plan: Estándar (4 sesiones/empleado)
```

### Resultado en Base de Datos

**Tabla `usuarios`:**
- email: maria.gonzalez@techcorp.com
- nombre: María
- apellido: González López
- telefono: +52 33 1234 5678
- rol: empresa
- activo: true

**Tabla `empresas`:**
- razon_social: TechCorp Solutions SA de CV
- rfc: TEC120315XYZ
- industria: Tecnología
- tamano_empresa: mediana
- numero_empleados: 150
- sesiones_contratadas: 600 (150 × 4)
- sesiones_usadas: 0
- sesiones_disponibles: 600
- activo: true

### Credenciales Generadas
```
Email: maria.gonzalez@techcorp.com
Contraseña: Mind7a4c69! (copiado automáticamente)
```

---

## 💡 Consejos de Uso

1. **RFC Único** - Cada empresa debe tener un RFC único
2. **Email Único** - No puedes registrar dos empresas con el mismo email
3. **Plan Adecuado** - Elige el plan según las necesidades de bienestar de la empresa
4. **Empleados** - El número de empleados determina el total de sesiones
5. **Compartir Credenciales** - Las credenciales se copian al portapapeles automáticamente

---

## 🔄 Gestión de Sesiones

### Cómo Funciona
- Cada empresa tiene un paquete de sesiones
- Las sesiones se **asignan** a empleados
- Cuando un empleado toma una cita, se descuenta una sesión
- Las empresas pueden monitorear el uso en su dashboard

### Planes Disponibles

| Plan | Sesiones/Empleado | Ejemplo (100 empleados) |
|------|-------------------|-------------------------|
| **Básico** | 2 | 200 sesiones |
| **Estándar** | 4 | 400 sesiones |
| **Premium** | 8 | 800 sesiones |

---

## 🛠️ Próximas Mejoras

### Funcionalidad Pendiente
- [ ] **Editar empresa** - Actualizar información
- [ ] **Eliminar/Desactivar** - Dar de baja empresa
- [ ] **Ver dashboard de empresa** - Métricas y uso
- [ ] **Agregar más sesiones** - Comprar paquetes adicionales
- [ ] **Gestionar empleados** - Dar de alta/baja empleados
- [ ] **Reportes de uso** - Estadísticas de consumo

---

## ✅ Estado Actual

- ✅ Formulario de registro completo y funcional
- ✅ Validaciones implementadas
- ✅ Conexión con Supabase Auth
- ✅ Creación en tabla usuarios
- ✅ Creación en tabla empresas
- ✅ Lista dinámica desde base de datos
- ✅ Estadísticas en tiempo real
- ✅ Cálculo automático de sesiones
- ✅ Credenciales copiadas al portapapeles
- ✅ Estados visuales (activo, sesiones disponibles)
- ✅ Recarga automática después de registro

---

## 🎊 ¡Listo para Usar!

La funcionalidad de **Empresas Asociadas** está completamente operativa. Las empresas pueden:
- ✅ Registrarse en el sistema
- ✅ Iniciar sesión con sus credenciales
- ✅ Acceder a su panel de empresa
- ✅ Gestionar a sus empleados
- ✅ Monitorear el uso de sesiones

**¡Bienvenido a MindCare!** 🧠💚
