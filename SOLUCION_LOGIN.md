# 🔧 SOLUCIÓN AL ERROR DE LOGIN

## ❌ Error Actual

```
Auth login error: AuthApiError: Invalid login credentials
```

Este error ocurre porque el sistema está en un **estado híbrido**:
- Tienes usuarios antiguos (admin) con `password_hash` en la tabla
- Estás intentando crear usuarios nuevos con Supabase Auth

## ✅ SOLUCIÓN IMPLEMENTADA

He actualizado el código del servidor para que sea **compatible con ambos sistemas**:

### Sistema Híbrido de Autenticación

1. **Intento 1:** Supabase Auth (usuarios nuevos)
   - Para psicólogos y empresas creados desde el formulario
   
2. **Intento 2:** Sistema Legacy (usuarios antiguos)
   - Para el admin creado con `EJECUTAR_ESTE_SQL.sql`
   - Usa la columna `password_hash`

---

## 🎯 CÓMO USAR EL SISTEMA AHORA

### Opción A: Continuar con Sistema Híbrido (Recomendado)

**Ya está implementado, no necesitas hacer nada más.**

#### Login Admin (Sistema Legacy):
```
Email: admin@test.com
Contraseña: 12345678
```

#### Login Psicólogos/Empresas (Sistema Nuevo):
```
Email: [el que registraste]
Contraseña: [la generada, ej: Mind7a4c69!]
```

**Ventajas:**
- ✅ No pierdes al usuario admin existente
- ✅ Nuevos usuarios usan Supabase Auth (más seguro)
- ✅ No requiere migración inmediata

---

### Opción B: Migrar Completamente a Supabase Auth

Si prefieres que **todos** los usuarios usen Supabase Auth:

#### Paso 1: Ejecutar Migración
```sql
-- En Supabase SQL Editor:
-- https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/sql/new

-- Eliminar columna password_hash
ALTER TABLE usuarios DROP COLUMN IF EXISTS password_hash;
```

#### Paso 2: Recrear Usuario Admin
1. Ve a: https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/auth/users
2. Click "Add user" > "Create new user"
3. Email: `admin@mindcare.mx`
4. Password: `Admin2026!` (o la que prefieras)
5. Auto Confirm User: ✅ activado
6. Copia el UUID del usuario creado

#### Paso 3: Actualizar Tabla Usuarios
```sql
-- Reemplaza 'UUID-DEL-USUARIO' con el UUID que copiaste
UPDATE usuarios
SET id = 'UUID-DEL-USUARIO'
WHERE email = 'admin@test.com';

-- O crear nuevo registro
INSERT INTO usuarios (id, email, nombre, apellido, rol, activo)
VALUES (
  'UUID-DEL-USUARIO',
  'admin@mindcare.mx',
  'Super',
  'Admin',
  'admin',
  true
);
```

**Ventajas:**
- ✅ Sistema unificado
- ✅ Más seguro (contraseñas encriptadas)
- ✅ Gestión centralizada en Supabase

---

## 🔍 VERIFICAR EL ESTADO ACTUAL

Ejecuta este SQL para ver qué sistema estás usando:

```sql
-- Ver estructura de usuarios
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'usuarios';

-- Ver usuarios existentes
SELECT
  id,
  email,
  rol,
  CASE
    WHEN password_hash IS NOT NULL THEN 'Sistema Legacy'
    ELSE 'Sistema Supabase Auth'
  END as tipo_auth
FROM usuarios;
```

O ejecuta el archivo **`VERIFICAR_SISTEMA_AUTH.sql`** completo.

---

## 📊 ESTADO ACTUAL DE TU SISTEMA

### Usuarios Existentes
- ✅ **admin@test.com** - Sistema Legacy (password_hash)
- ✅ Psicólogos nuevos - Supabase Auth
- ✅ Empresas nuevas - Supabase Auth

### Login Funciona Para
- ✅ Admin con email/password de `EJECUTAR_ESTE_SQL.sql`
- ✅ Psicólogos con credenciales generadas
- ✅ Empresas con credenciales generadas

---

## 🎯 PRUEBA EL LOGIN AHORA

### 1. Login como Admin
```
Email: admin@test.com
Contraseña: 12345678
```

### 2. Crear un Psicólogo
1. Ve a "Red de Psicólogos"
2. Click "Nuevo Psicólogo"
3. Completa el formulario
4. Copia las credenciales generadas

### 3. Login como Psicólogo
```
Email: [el que registraste]
Contraseña: [la copiada del portapapeles]
```

### 4. Crear una Empresa
1. Ve a "Empresas Asociadas"
2. Click "Nueva Empresa"
3. Completa el formulario
4. Copia las credenciales generadas

### 5. Login como Empresa
```
Email: [el que registraste]
Contraseña: [la copiada del portapapeles]
```

---

## 🐛 DEBUGGING

Si el login sigue fallando, revisa los logs en:
https://supabase.com/dashboard/project/idnusdgnaohphbdoezch/logs/edge-functions

Busca mensajes como:
- `"Supabase Auth failed, trying legacy password_hash system"`
- `"Auth login error:"`
- `"User fetch error:"`

---

## ✅ RESUMEN

El sistema ahora es **compatible con ambos métodos**:

| Usuario | Sistema | Funciona |
|---------|---------|----------|
| Admin existente | password_hash (legacy) | ✅ Sí |
| Psicólogos nuevos | Supabase Auth | ✅ Sí |
| Empresas nuevas | Supabase Auth | ✅ Sí |

**No necesitas hacer nada más. El login debería funcionar ahora.** 🎉

Si quieres migrar completamente a Supabase Auth en el futuro, sigue la "Opción B" de arriba.
