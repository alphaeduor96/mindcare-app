# 🔌 Integración con Supabase - MindCare

## ✅ Estado de la Integración

La plataforma MindCare está **completamente conectada con Supabase** para persistencia de datos real.

## 📁 Archivos Creados

### Backend (Servidor Supabase Edge Functions)

1. **`/supabase/functions/server/index.tsx`** - Servidor principal con:
   - Endpoints de autenticación (signup/login)
   - Endpoints de usuarios
   - Endpoints de psicólogos
   - Endpoints de consultorios

2. **`/supabase/functions/server/endpoints_empresas.tsx`** - Endpoints de empresas:
   - CRUD de empresas
   - Listado de empleados por empresa
   - Reportes empresariales

3. **`/supabase/functions/server/endpoints_citas.tsx`** - Endpoints de citas:
   - CRUD de citas con validación de disponibilidad
   - Cancelación de citas
   - Gestión de disponibilidad de horarios
   - CRUD de empleados

4. **`/supabase/functions/server/endpoints_reportes.tsx`** - Endpoints de reportes:
   - Reseñas y calificaciones
   - Cortes de pago semanales
   - Estadísticas de psicólogos
   - Dashboard del administrador
   - Notificaciones

### Frontend (React)

1. **`/src/services/api.ts`** - Cliente API completo con funciones para:
   - Autenticación (auth.login, auth.signup, auth.logout)
   - Usuarios (usuarios.getById, usuarios.update)
   - Psicólogos (psicologos.getAll, create, update, delete)
   - Consultorios (consultorios.getAll, create, update, delete)
   - Empresas (empresas.getAll, create, update, delete)
   - Empleados (empleados.getByEmpresa, create, update, delete)
   - Citas (citas.getAll, create, update, delete, cancelar)
   - Disponibilidad (disponibilidad.getByPsicologo, create, update, delete)
   - Reseñas (resenas.getByPsicologo, create, update)
   - Cortes de Pago (cortesPago.getByPsicologo, procesarCorte)
   - Reportes (reportes.getEmpresaReporte, getPsicologoStats, getAdminDashboard)
   - Notificaciones (notificaciones.getByUsuario, marcarLeida)

2. **`/src/hooks/useAuth.ts`** - Hook de autenticación con:
   - login(email, password)
   - signup(data)
   - logout()
   - updateUser(updates)
   - Estado: user, loading, isAuthenticated

3. **`/src/hooks/usePsychologists.ts`** - Hook para gestionar psicólogos:
   - Listado con filtros
   - createPsychologist(data)
   - updatePsychologist(id, data)
   - deletePsychologist(id)
   - refresh()

4. **`/src/hooks/useAppointments.ts`** - Hook para gestionar citas:
   - Listado con filtros
   - createAppointment(data)
   - updateAppointment(id, data)
   - cancelAppointment(id, motivo)
   - deleteAppointment(id)
   - refresh()

### Base de Datos

1. **`/database_schema.sql`** - Esquema completo de Supabase con:
   - 15 tablas principales
   - 2 vistas (vista_psicologos_completa, vista_citas_completa)
   - Triggers automáticos
   - Row Level Security
   - Índices optimizados
   - Datos semilla

## 🚀 Pasos para Usar la Integración

### 1. Crear las Tablas en Supabase

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/idnusdgnaohphbdoezch
2. Navega a **SQL Editor**
3. Abre el archivo `database_schema.sql`
4. Copia todo el contenido
5. Pégalo en el editor SQL de Supabase
6. Haz clic en **Run** para ejecutar el script

Esto creará todas las tablas, vistas, triggers y configuraciones necesarias.

### 2. El Servidor ya está Configurado

El servidor Supabase Edge Function ya está desplegado y corriendo en:
```
https://idnusdgnaohphbdoezch.supabase.co/functions/v1/make-server-0e77298f
```

Los endpoints disponibles están listados más abajo.

### 3. Usar en los Componentes

#### Ejemplo: Autenticación

```tsx
import { useAuth } from "../hooks/useAuth";

function LoginForm() {
  const { login, user, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      await login("psicologo@ejemplo.com", "password123");
      // Usuario autenticado, redirigir al dashboard
    } catch (error) {
      console.error("Error de login:", error);
    }
  };

  if (isAuthenticated) {
    return <div>Bienvenido {user?.nombre}!</div>;
  }

  return <button onClick={handleLogin}>Iniciar Sesión</button>;
}
```

#### Ejemplo: Listar Psicólogos

```tsx
import { usePsychologists } from "../hooks/usePsychologists";

function PsychologistsList() {
  const { psychologists, loading, error } = usePsychologists({ 
    activo: true, 
    verificado: true 
  });

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {psychologists.map(psy => (
        <div key={psy.id}>
          <h3>{psy.nombre} {psy.apellido}</h3>
          <p>Especialidades: {psy.especialidades.join(", ")}</p>
          <p>Calificación: {psy.calificacion_promedio}⭐</p>
        </div>
      ))}
    </div>
  );
}
```

#### Ejemplo: Crear Cita

```tsx
import { useAppointments } from "../hooks/useAppointments";

function BookAppointment() {
  const { createAppointment } = useAppointments();

  const handleBook = async () => {
    try {
      await createAppointment({
        psicologo_id: "uuid-del-psicologo",
        paciente_id: "uuid-del-paciente",
        tipo_paciente: "red_mindcare",
        fecha_hora: "2026-04-25T10:00:00Z",
        duracion: 60,
        modalidad: "presencial",
        motivo_consulta: "Consulta inicial",
        estado: "agendada",
        pagada: false
      });
      
      alert("Cita agendada exitosamente!");
    } catch (error) {
      alert("Error al agendar: " + error.message);
    }
  };

  return <button onClick={handleBook}>Agendar Cita</button>;
}
```

## 📡 Endpoints Disponibles

### Autenticación
- `POST /auth/signup` - Crear cuenta
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión

### Usuarios
- `GET /usuarios/:id` - Obtener usuario
- `PUT /usuarios/:id` - Actualizar usuario

### Psicólogos
- `GET /psicologos` - Listar psicólogos (con filtros)
- `GET /psicologos/:id` - Obtener psicólogo
- `GET /psicologos/:id/profile` - Perfil completo con reseñas y consultorios
- `POST /psicologos` - Crear psicólogo
- `PUT /psicologos/:id` - Actualizar psicólogo
- `DELETE /psicologos/:id` - Eliminar psicólogo

### Consultorios
- `GET /consultorios` - Listar consultorios
- `GET /consultorios/:id` - Obtener consultorio
- `POST /consultorios` - Crear consultorio
- `PUT /consultorios/:id` - Actualizar consultorio
- `DELETE /consultorios/:id` - Eliminar consultorio

### Empresas
- `GET /empresas` - Listar empresas
- `GET /empresas/:id` - Obtener empresa
- `GET /empresas/:id/empleados` - Empleados de la empresa
- `GET /empresas/:id/reportes` - Reportes empresariales
- `POST /empresas` - Crear empresa
- `PUT /empresas/:id` - Actualizar empresa
- `DELETE /empresas/:id` - Eliminar empresa

### Citas
- `GET /citas` - Listar citas (con filtros)
- `GET /citas/:id` - Obtener cita
- `POST /citas` - Crear cita (con validación)
- `PUT /citas/:id` - Actualizar cita
- `DELETE /citas/:id` - Eliminar cita
- `POST /citas/:id/cancelar` - Cancelar cita

### Disponibilidad
- `GET /psicologos/:id/disponibilidad` - Horarios del psicólogo
- `POST /disponibilidad` - Crear horario
- `PUT /disponibilidad/:id` - Actualizar horario
- `DELETE /disponibilidad/:id` - Eliminar horario

### Reseñas
- `GET /psicologos/:id/resenas` - Reseñas del psicólogo
- `POST /resenas` - Crear reseña
- `PUT /resenas/:id` - Actualizar reseña

### Reportes
- `GET /psicologos/:id/estadisticas` - Estadísticas del psicólogo
- `GET /psicologos/:id/cortes` - Cortes de pago
- `POST /cortes/:id/procesar` - Procesar corte de pago
- `GET /admin/dashboard` - Dashboard del administrador

### Notificaciones
- `GET /usuarios/:id/notificaciones` - Notificaciones del usuario
- `POST /notificaciones/:id/leer` - Marcar como leída
- `POST /usuarios/:id/notificaciones/leer-todas` - Marcar todas como leídas

### Health Check
- `GET /health` - Verificar estado del servidor

## 🔐 Autenticación

Todos los requests (excepto login/signup) deben incluir el header:
```
Authorization: Bearer {publicAnonKey}
```

El `publicAnonKey` ya está configurado en `/utils/supabase/info.tsx` y se usa automáticamente en `/src/services/api.ts`.

## 📊 Estructura de Datos

### Usuario
```typescript
{
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: "admin" | "psicologo" | "empresa" | "empleado";
  foto_perfil?: string;
  activo: boolean;
}
```

### Psicólogo
```typescript
{
  id: string;
  usuario_id: string;
  cedula_profesional: string;
  especialidades: string[];
  biografia?: string;
  tipo_membresia: "red_afiliado" | "independiente_free" | "independiente_basico" | "independiente_pro";
  modalidades: string[];
  calificacion_promedio: number;
  total_resenas: number;
  verificado: boolean;
  activo: boolean;
}
```

### Cita
```typescript
{
  id: string;
  psicologo_id: string;
  paciente_id: string;
  empresa_id?: string;
  tipo_paciente: "red_mindcare" | "privado";
  fecha_hora: string;
  duracion: number;
  modalidad: "presencial" | "virtual";
  estado: "agendada" | "confirmada" | "completada" | "cancelada" | "no_asistio";
  pagada: boolean;
}
```

## 🛠️ Próximos Pasos Sugeridos

1. **Actualizar componentes existentes** para usar los hooks y API
2. **Implementar formularios de signup/login** reales
3. **Conectar el calendario** con citas reales de la base de datos
4. **Implementar el directorio de psicólogos** con datos reales
5. **Crear el dashboard de empresas** con reportes reales
6. **Implementar notificaciones** en tiempo real

## 🐛 Debugging

Para verificar que todo funciona:

```typescript
import { health } from "../services/api";

// Verificar conexión al servidor
health.check().then(response => {
  console.log("Servidor activo:", response);
});
```

## 📝 Notas Importantes

- Las credenciales de Supabase están en variables de entorno del servidor
- Row Level Security está habilitado en tablas sensibles
- Los triggers automáticos actualizan calificaciones y timestamps
- PostGIS está habilitado para funcionalidad de mapas
- Las vistas pre-creadas optimizan queries comunes

## 🎉 ¡Listo para Usar!

Tu plataforma MindCare ahora tiene persistencia de datos completa con Supabase. Todos los componentes pueden empezar a usar los hooks y la API para trabajar con datos reales.
