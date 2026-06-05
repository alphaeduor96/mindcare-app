# MindCare - Supabase desde cero

Esta es la ruta recomendada para convertir MindCare en una plataforma funcional con una base de datos limpia, ordenada y facil de analizar.

## 1. Principio

No vamos a cargar datos demo ni tablas temporales. Primero se crea una base limpia, luego conectamos pantalla por pantalla:

1. Autenticacion y perfiles.
2. Psicologos y consultorios.
3. Empresas y empleados.
4. Pacientes y citas.
5. Pagos, cortes, resenas y reportes.

El esquema nuevo esta en:

```txt
supabase/migrations/0001_mindcare_clean_schema.sql
```

## 2. Tablas principales

### Identidad

- `usuarios`: perfil de cada usuario de Supabase Auth. Define rol, nombre, email, telefono y estado.

### Psicologos

- `psicologos`: perfil profesional, cedula, especialidades, membresia y tarifas.
- `consultorios`: ubicaciones fisicas.
- `psicologo_consultorios`: relacion entre psicologos y consultorios.
- `disponibilidad_horarios`: horario semanal disponible por psicologo.

### Empresas

- `empresas`: datos fiscales/comerciales de cada empresa cliente.
- `contratos_empresa`: plan contratado, sesiones por empleado y vigencia.
- `empleados`: empleados con acceso al beneficio.

### Atencion

- `pacientes`: pacientes privados o empleados que usan la red MindCare.
- `citas`: agenda central. Distingue citas privadas y citas de la red.
- `notas_sesion`: notas clinicas separadas de la cita por privacidad.
- `resenas`: calificaciones visibles del psicologo.

### Dinero y operacion

- `pagos_cita`: pagos asociados a citas.
- `cortes_pago`: cortes semanales para psicologos afiliados.
- `cortes_pago_items`: citas incluidas en cada corte.
- `notificaciones`: notificaciones internas.
- `audit_logs`: bitacora administrativa.

## 3. Vistas para analisis

- `v_psicologos_directorio`: perfil publico/operativo del psicologo con promedio de resenas.
- `v_citas_detalle`: citas con nombres de psicologo, paciente y empresa.
- `v_uso_empresa`: uso resumido por empresa.

Estas vistas sirven para dashboards y reportes sin tener que repetir consultas complejas en el frontend.

## 4. Seguridad

El esquema activa Row Level Security en las tablas principales.

Reglas base:

- Un usuario ve su propio perfil.
- Admin ve la operacion completa, excepto que las notas clinicas quedan restringidas al psicologo tratante.
- Psicologos ven sus pacientes, citas, disponibilidad, notas y cortes.
- Empresas ven su informacion, empleados y citas asociadas.
- Empleados/pacientes ven sus propios datos y citas.

Para operaciones administrativas complejas seguiremos usando Supabase Edge Functions con `SERVICE_ROLE_KEY`.

## 5. Como aplicarlo en Supabase

Opcion recomendada:

1. Crear un proyecto nuevo en Supabase.
2. Ir a SQL Editor.
3. Copiar todo el contenido de `supabase/migrations/0001_mindcare_clean_schema.sql`.
4. Ejecutarlo una sola vez.
5. Configurar variables del frontend y backend con el nuevo `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
6. Crear el primer usuario admin desde una Edge Function o script controlado.

No ejecutes los SQL antiguos junto con este esquema. Los archivos viejos quedan como referencia hasta que terminemos la migracion de codigo.

Si Supabase muestra `cannot execute CREATE EXTENSION in a read-only transaction`, usa la version actualizada del SQL. La migracion ya no intenta crear extensiones. Si despues aparece que `gen_random_uuid()` no existe, activa `pgcrypto` desde Database > Extensions en Supabase y vuelve a correr el script.

## 6. Siguiente paso tecnico

Despues de crear la base limpia, toca actualizar la app para dejar de depender de:

- Datos fijos en componentes.
- URLs hardcodeadas de Supabase.
- Tokens pegados en el codigo.
- Vistas/tablas antiguas como `vista_psicologos_completa` y `vista_citas_completa`.

La siguiente pieza deberia ser:

1. Crear `.env.example`.
2. Centralizar el cliente Supabase/API.
3. Actualizar login para usar configuracion por ambiente.
4. Conectar el panel Admin a `usuarios`, `psicologos`, `empresas` y `v_citas_detalle`.
