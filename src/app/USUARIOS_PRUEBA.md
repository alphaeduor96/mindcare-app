# Usuarios de Prueba - MindCare

## 🔑 Acceso Rápido

### Cómo probar cada tipo de usuario:

1. **Psicólogos Control (con planes)**: Click en "💼 Landing Control" → "Ingresar" → Usa los emails de abajo
2. **Psicólogos Afiliados (gratis)**: Click en "👨‍💼 Admin" → "Psicólogos" → "Ver Perfil" → "Iniciar sesión como..."
3. **Empresa**: Click directo en "🏢 Empresa"
4. **Empleado**: Click directo en "👤 Empleado"

---

## Psicólogos MindCare Control

Estos usuarios inician sesión desde **MindCare Control** (Botón "💼 Landing Control" → Click "Ingresar")

### ✅ Plan Básico (Gratis 0-10 citas/mes)
- **Email:** basico@mindcare.com
- **Password:** 12345678 (o cualquier contraseña)
- **Nombre:** Dr. Control Básico
- **Plan:** Básico - Gratis hasta 10 citas/mes
- **Gestión:** Puede ver facturación, pero no puede agregar tarjetas (plan gratis)

### 💳 Plan Intermedio ($150/mes)
- **Email:** intermedio@mindcare.com
- **Password:** 12345678 (o cualquier contraseña)
- **Nombre:** Dr. Control Intermedio
- **Plan:** Intermedio - 11-20 citas/mes por $150/mes
- **Gestión:** Puede cambiar plan, agregar tarjetas, ver facturas

### 🌟 Plan Pro ($250/mes)
- **Email:** pro@mindcare.com
- **Password:** 12345678 (o cualquier contraseña)
- **Nombre:** Dr. Control Pro
- **Plan:** Pro - 21-50 citas/mes por $250/mes
- **Gestión:** Acceso completo a gestión de facturación y suscripción

### 🆕 Nuevo Registro
- **Crear cuenta:** Click en "Regístrate gratis" y completa el formulario
- **Plan:** Automáticamente inicia con Plan Básico (gratis)
- **Upgrade:** Puede mejorar su plan desde el sidebar → "Facturación"

---

## 🏆 Psicólogos Afiliados (Sistema 100% Gratis)

Estos usuarios se registran desde **"Únete a la Red"** en el Landing Empresarial y el Administrador los da de alta.

### Cómo probar como psicólogo afiliado:
1. Click en botón **"👨‍💼 Admin"** (abajo a la derecha)
2. Click en **"Psicólogos"** en el sidebar
3. Click en **"Ver Perfil"** de cualquier psicólogo
4. Click en **"Iniciar sesión como este psicólogo"**

### Psicólogos Afiliados Disponibles:
- ✅ Dr. Carlos Ruiz
- ✅ Dra. María López
- ✅ Dr. Juan Torres
- ✅ Dra. Laura Martínez

### Características del Plan Afiliado:
- **Plan:** Afiliado - Sistema 100% gratis
- **Citas:** Ilimitadas
- **Referidos:** Constantes de 500+ empresas
- **Facturación:** No necesita métodos de pago (sistema gratis)
- **Badge:** Muestra "Afiliado" en color teal en el header
- **Cortes MindCare:** Acceso a módulo especial de pagos semanales

### 💰 Sistema de Pagos para Afiliados:
Los psicólogos afiliados tienen **dos tipos de pacientes**:

1. **Pacientes Privados** (badge gris) - El psicólogo cobra directamente
2. **Pacientes de la Red** (badge teal "Red MindCare") - MindCare paga $350/sesión

**Proceso de Pago:**
1. Semana termina → Corte automático se genera
2. Psicólogo ve sesiones atendidas en "Cortes MindCare"
3. Sube factura (PDF + XML) a nombre de MindCare
4. Recibe pago en 3-5 días hábiles

---

## Otros Roles (No tienen planes)

### Administrador de Red
- **Botón:** 👨‍💼 Admin
- **Función:** Coordina la red sin acceso a datos sensibles

### Empresa
- **Botón:** 🏢 Empresa
- **Función:** Gestiona empleados y ve reportes

### Empleado
- **Botón:** 👤 Empleado
- **Función:** Busca psicólogos y agenda citas

---

## 📊 Funcionalidad de Facturación

Todos los psicólogos Control tienen acceso a la sección **"Facturación"** en el sidebar:

### Funciones Disponibles:
- ✅ Ver plan actual y uso de citas
- ✅ Cambiar entre planes (Básico ↔ Intermedio ↔ Pro)
- ✅ Agregar/eliminar tarjetas de crédito (solo planes de pago)
- ✅ Ver historial de facturas
- ✅ Descargar facturas en PDF
- ✅ Cancelar suscripción (regresa a plan Básico)
- ✅ Ver próxima fecha de cobro

### Restricciones por Plan:
- **Plan Básico:** No puede agregar tarjetas (plan gratis)
- **Plan Afiliado:** No muestra opciones de pago (sistema gratis ilimitado)
- **Planes de Pago:** Acceso completo a gestión de facturación

---

## 🔧 Sistema de Autenticación

### Login Real (Producción)
En producción, el sistema validará:
- Email y contraseña contra la base de datos
- Recuperará el plan actual del usuario
- Mostrará el historial de facturación real
- Validará métodos de pago con Stripe/PayPal

### Demo (Desarrollo Actual)
Para facilitar las pruebas:
- ✅ Cualquier email/password funciona para login
- ✅ El plan se asigna basado en el email:
  - `basico@mindcare.com` → Plan Básico
  - `intermedio@mindcare.com` → Plan Intermedio  
  - `pro@mindcare.com` → Plan Pro
  - Cualquier otro email → Plan Intermedio (por defecto)
- ✅ Los nuevos registros inician con Plan Básico
- ✅ Puedes cambiar de plan libremente para probar la funcionalidad

---

## 🎯 Guía Rápida de Pruebas

### Para probar Gestión de Planes:
1. Login con `intermedio@mindcare.com`
2. Click en "Facturación" en sidebar
3. Prueba cambiar a Plan Pro
4. Agrega una tarjeta de crédito
5. Ve el historial de facturas
6. Prueba cancelar la suscripción

### Para probar Plan Básico:
1. Login con `basico@mindcare.com`
2. Ve que no hay opciones de pago (plan gratis)
3. Observa la barra de progreso de citas (7/10 usadas)
4. Prueba mejorar al Plan Intermedio

### Para probar Plan Afiliado:
1. Click en "👨‍💼 Admin"
2. Inicia sesión como cualquier psicólogo de la red
3. Ve que muestra badge "Afiliado" en el header
4. Click en "Mis Pacientes" - verás pacientes con badge "Red MindCare" (pagados por MindCare) y privados
5. Click en "Cortes MindCare" - módulo exclusivo de afiliados con:
   - Corte semanal actual con sesiones y monto ($350/sesión)
   - Opción para subir factura (PDF + XML)
   - Historial de pagos recibidos
   - Estadísticas de ingresos
6. Los psicólogos Control NO ven "Cortes MindCare", solo ven "Facturación"
