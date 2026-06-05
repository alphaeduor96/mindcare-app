# ✅ Red de Psicólogos - Conectada a Base de Datos

## 🎯 Funcionalidad Implementada

La sección **"Red de Psicólogos"** en el panel de administración ahora está completamente conectada con la base de datos de Supabase.

---

## 📝 Funciones Disponibles

### 1. **Registrar Nuevo Psicólogo** ➕

Desde el botón **"Nuevo Psicólogo"** puedes dar de alta psicólogos con toda su información:

#### Información Personal
- ✅ Nombre completo
- ✅ Fecha de nacimiento
- ✅ Email
- ✅ Teléfono
- ✅ Fotografía de perfil (automática)

#### Información Profesional
- ✅ **Cédula profesional** (requerida)
- ✅ **Enfoque terapéutico principal**
  - Psicoanálisis
  - Cognitivo-Conductual
  - Gestalt
  - Sistémico
  
- ✅ **Subespecialidades** (mínimo 1 requerida)
  - Ansiedad y Estrés
  - Depresión
  - Trastornos del Estado de Ánimo
  - Trauma y TEPT
  - Terapia de Pareja
  - Terapia Familiar
  - Psicología Infantil y Adolescentes
  - Adicciones
  - Trastornos Alimentarios
  - Duelo y Pérdida
  - Autoestima y Desarrollo Personal
  - Trastornos de Personalidad
  - TOC
  - Fobias
  - Estrés Laboral y Burnout
  - Orientación Vocacional
  - Problemas de Sueño
  - Sexualidad
  - Violencia y Abuso
  - Neuropsicología

#### Información de Práctica
- ✅ Años de experiencia
- ✅ Disponibilidad (tiempo completo, medio tiempo, fines de semana, tardes/noches)
- ✅ **Tarifa por sesión**
- ✅ Biografía / Descripción
- ✅ Domicilio del consultorio

#### Modalidades Automáticas
- ✅ **Presencial** - Habilitado por defecto
- ✅ **Virtual** - Habilitado automáticamente para tiempo completo/medio tiempo

---

## 📊 Lista de Psicólogos

La tabla de psicólogos muestra información en tiempo real de la base de datos:

### Columnas Mostradas

| Columna | Descripción |
|---------|-------------|
| **Psicólogo** | Nombre completo, email y foto |
| **Teléfono** | Número de contacto |
| **Especialidades** | Principales especialidades (muestra 2, indica si hay más) |
| **Tarifa** | Precio por sesión |
| **Tipo** | Badges de modalidades (Presencial/Virtual) |
| **Estado** | Activo/Inactivo + badge de Verificado |
| **Acciones** | Ver como, Editar, Eliminar |

### Estadísticas en Tiempo Real

- 📈 **Total** - Total de psicólogos registrados
- ✅ **Activos** - Psicólogos activos
- 🔍 **Verificados** - Psicólogos verificados por admin

---

## 🔄 Flujo de Registro

### Paso 1: Crear Usuario
El sistema automáticamente crea:
1. Usuario en **Supabase Auth** (para login seguro)
2. Registro en tabla **usuarios** con rol "psicologo"

### Paso 2: Crear Perfil Profesional
Se crea el perfil en tabla **psicologos** con:
- Vínculo al usuario creado
- Cédula profesional
- Especialidades (enfoque + subespecialidades)
- Biografía
- Años de experiencia
- Modalidades (presencial/virtual)
- Tarifa por sesión
- Configuración inicial:
  - Tipo membresía: "red_afiliado"
  - Duración sesión: 60 minutos
  - Acepta nuevos pacientes: Sí
  - Verificado: No (requiere aprobación de admin)
  - Activo: Sí

### Paso 3: Confirmación
- ✅ Notificación de éxito
- ✅ Recarga automática de la lista
- ✅ El psicólogo aparece en la tabla inmediatamente

---

## 🔐 Acceso de Psicólogos

### Credenciales Generadas

Cuando creas un psicólogo, el sistema genera automáticamente:
- **Email:** El email que ingresaste
- **Contraseña:** Temporal aleatoria (deberás compartirla con el psicólogo)

### Próximos Pasos para el Psicólogo

1. El psicólogo puede **iniciar sesión** con su email
2. Será redirigido a su **panel de psicólogo**
3. Podrá ver:
   - Calendario de citas
   - Gestión de pacientes
   - Cortes de pago
   - Configuración de disponibilidad
   - Su perfil público

---

## 🎨 Estados y Badges

### Estado del Psicólogo
- 🟢 **Activo** - Verde (puede recibir citas)
- ⚫ **Inactivo** - Gris (no recibe citas)

### Verificación
- 🔵 **Verificado** - Badge azul (aprobado por admin)
- Sin badge - Pendiente de verificación

### Modalidades
- 🏢 **Presencial** - Badge secundario
- 💻 **Virtual** - Badge secundario

---

## 🛠️ Próximas Mejoras

### Funcionalidad Pendiente
- [ ] **Editar psicólogo** - Actualizar información
- [ ] **Eliminar/Desactivar** - Dar de baja psicólogo
- [ ] **Verificar psicólogo** - Marcar como verificado
- [ ] **Ver perfil completo** - Modal con todos los detalles
- [ ] **Asignar consultorios** - Vincular con ubicaciones físicas
- [ ] **Configurar horarios** - Disponibilidad semanal
- [ ] **Ver estadísticas** - Citas, ingresos, calificaciones

---

## 📋 Validaciones Implementadas

### Campos Requeridos
- ✅ Nombre completo
- ✅ Fecha de nacimiento
- ✅ Email (único)
- ✅ Teléfono
- ✅ Enfoque terapéutico
- ✅ Al menos 1 subespecialidad
- ✅ **Cédula profesional** (único)

### Validaciones Automáticas
- Email válido
- Email no duplicado
- Cédula profesional no duplicada
- Al menos una subespecialidad seleccionada

---

## 🔍 Consultas a la Base de Datos

### Endpoints Utilizados

#### GET - Listar Psicólogos
```
GET /make-server-0e77298f/psicologos
```
Retorna todos los psicólogos desde la vista `vista_psicologos_completa` que incluye:
- Datos del usuario (nombre, email, teléfono, foto)
- Datos del perfil profesional (especialidades, tarifa, modalidades)

#### POST - Crear Usuario
```
POST /make-server-0e77298f/auth/signup
```
Crea el usuario en Supabase Auth y tabla usuarios.

#### POST - Crear Psicólogo
```
POST /make-server-0e77298f/psicologos
```
Crea el perfil profesional del psicólogo.

---

## 🎯 Ejemplo de Registro

### Datos de Entrada
```
Nombre: Dr. Carlos Ruiz González
Fecha Nacimiento: 1985-05-15
Email: carlos.ruiz@ejemplo.com
Teléfono: +52 33 1234 5678
Cédula: 12345678
Enfoque: Cognitivo-Conductual
Subespecialidades: 
  - Ansiedad y Estrés
  - Depresión
  - Trastornos del Estado de Ánimo
Experiencia: 8 años
Disponibilidad: Tiempo Completo
Tarifa: 800
```

### Resultado en Base de Datos

**Tabla `usuarios`:**
- email: carlos.ruiz@ejemplo.com
- nombre: Dr.
- apellido: Carlos Ruiz González
- telefono: +52 33 1234 5678
- rol: psicologo
- activo: true

**Tabla `psicologos`:**
- cedula_profesional: 12345678
- especialidades: ["cognitive", "anxiety", "depression", "mood-disorders"]
- anos_experiencia: 8
- tarifa_sesion: 800
- modalidades: ["presencial", "virtual"]
- verificado: false
- activo: true

---

## 💡 Consejos de Uso

1. **Cédula Única** - Cada psicólogo debe tener una cédula profesional única
2. **Email Único** - No puedes registrar dos psicólogos con el mismo email
3. **Especialidades** - Selecciona las especialidades más relevantes (no todas)
4. **Tarifa** - Define una tarifa competitiva según experiencia y especialidad
5. **Verificación** - Los psicólogos nuevos aparecen como "No verificados" hasta que un admin los apruebe

---

## ✅ Estado Actual

- ✅ Formulario de registro completo y funcional
- ✅ Validaciones implementadas
- ✅ Conexión con Supabase Auth
- ✅ Creación en tabla usuarios
- ✅ Creación en tabla psicologos
- ✅ Lista dinámica desde base de datos
- ✅ Estadísticas en tiempo real
- ✅ Estados visuales (activo, verificado, modalidades)
- ✅ Recarga automática después de registro

---

## 🎊 ¡Listo para Usar!

La funcionalidad de **Red de Psicólogos** está completamente operativa. Puedes comenzar a registrar psicólogos y ellos podrán acceder a la plataforma inmediatamente.

**¡Bienvenido a MindCare!** 🧠💚
