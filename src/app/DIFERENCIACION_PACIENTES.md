# Diferenciación de Pacientes - MindCare

## 📋 Sistema de Doble Fuente de Pacientes

Los **psicólogos afiliados** pueden tener dos tipos de pacientes:

---

## 👤 1. Pacientes Privados

### Origen:
- Registrados directamente por el psicólogo
- Clientes propios del profesional
- No vienen de empresas afiliadas

### Identificación Visual:
- **Sin badge especial** (apariencia normal)
- En la lista de pacientes aparecen sin etiquetas adicionales

### Flujo de Pago:
- ✅ El psicólogo **cobra directamente** al paciente
- ✅ No hay intermediarios
- ✅ El psicólogo define su tarifa
- ✅ Aparecen en "Mis Pagos" como pagos recibidos

### Ejemplo:
```
Ana María González
28 años
ana.gonzalez@email.com
(Sin badges especiales)
```

---

## 🏢 2. Pacientes de la Red MindCare

### Origen:
- Empleados de empresas afiliadas
- Eligen al psicólogo desde el panel de empleado
- Parte del beneficio empresarial

### Identificación Visual:
- **Badge teal:** "Red MindCare" 🏢
- **Badge adicional:** "$350/sesión"
- Muestra nombre de empresa y ID de empleado

### Flujo de Pago:
- ⚠️ **MindCare cobra a la empresa**
- ✅ **MindCare paga $350 MXN** al psicólogo por sesión atendida
- ✅ Pago semanal mediante factura electrónica
- ✅ Aparecen en "Cortes MindCare" (módulo exclusivo)

### Ejemplo:
```
Luis Hernández  [Badge: 🏢 Red MindCare] [Badge: $350/sesión]
35 años • TechCorp Solutions
luis.hernandez@email.com
💼 TechCorp Solutions • ID: EMP-001
```

---

## 💰 Módulo: Cortes MindCare (Solo Afiliados)

### Ubicación:
Sidebar → "Cortes MindCare" 💰

### Funcionalidades:

#### Pestaña 1: Corte Actual
- **Vista semanal** (ej: 9-15 Oct 2024)
- **Resumen:**
  - Total de sesiones atendidas
  - Total a pagar (sesiones × $350)
  - Estado del corte
- **Detalle de sesiones:**
  - Lista de cada paciente de la red
  - Empresa de origen
  - Fecha y hora
  - Estado: "Asistió" (✅ $350) o "No asistió" (⚠️ $0)
- **Acción:** Botón "Subir Factura"

#### Pestaña 2: Historial
- **Lista de pagos anteriores:**
  - Semana del corte
  - Número de sesiones
  - Monto pagado
  - Factura asociada
  - Fecha de pago
- **Estadísticas:**
  - Total pagado histórico
  - Sesiones totales
  - Promedio semanal

---

## 🧾 Proceso de Facturación para Red MindCare

### Paso 1: Corte Semanal
- Cada lunes se genera un corte automático
- Incluye todas las sesiones atendidas la semana anterior
- Solo pacientes que **asistieron** cuentan para el pago

### Paso 2: Subir Factura
El psicólogo debe subir:
- ✅ **Factura PDF** (factura electrónica a nombre de MindCare)
- ✅ **Archivo XML** (timbrado SAT)
- ✅ **Número de factura**

### Paso 3: Validación
- MindCare valida la factura
- Verifica que coincida con el corte
- Cambia estado a "En Proceso"

### Paso 4: Pago
- **Plazo:** 3-5 días hábiles
- **Método:** Transferencia bancaria
- **Confirmación:** Email + actualización en el sistema

---

## 🎯 Diferencias Clave por Plan

### Psicólogos Afiliados (Plan Afiliado)
- ✅ Ven "Cortes MindCare" en sidebar
- ✅ NO ven "Facturación" (no pagan por el sistema)
- ✅ Tienen pacientes privados Y de la red
- ✅ Badges diferenciados en lista de pacientes
- ✅ Reciben $350/sesión de pacientes de red

### Psicólogos Control (Básico/Intermedio/Pro)
- ❌ NO ven "Cortes MindCare"
- ✅ Ven "Facturación" (pagan según plan)
- ✅ Solo tienen pacientes privados
- ✅ Sin badges de red
- ✅ Cobran directamente a todos sus pacientes

---

## 📊 Ejemplo de Corte Semanal

```
Corte: 9-15 Octubre 2024
Estado: ⏳ Pendiente Factura

Sesiones Atendidas: 12
Total a Pagar: $4,200 MXN

Detalle:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Luis Hernández
   TechCorp Solutions
   Lunes 9 Oct, 14:00 → $350

✅ Sofia Ramírez  
   InnovateTech MX
   Martes 10 Oct, 10:00 → $350

✅ Carmen Díaz
   Global Finance Corp
   Miércoles 11 Oct, 11:00 → $350

❌ Luis Hernández
   TechCorp Solutions
   Jueves 12 Oct, 14:00 → $0 (No asistió)

[... 8 sesiones más ...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Botón: 📤 Subir Factura]
```

---

## 🔔 Notificaciones y Recordatorios

### Para el Psicólogo:
- 📧 Email cada lunes con corte generado
- 🔔 Notificación in-app cuando hay corte pendiente
- ⏰ Recordatorio si no sube factura en 3 días

### Para MindCare:
- 📧 Email cuando se sube nueva factura
- 🔔 Alerta para validar y procesar pago
- ✅ Confirmación cuando se realiza el pago

---

## ✅ Beneficios del Sistema

### Para Psicólogos Afiliados:
- 💰 Ingreso adicional constante ($350/sesión)
- 🎯 Referidos automáticos de 500+ empresas
- 📊 Transparencia total en pagos
- 🧾 Facturación simple y clara
- 💼 Mantienen libertad para pacientes privados

### Para Empresas:
- 📈 Control de beneficio a empleados
- 💳 Un solo pago a MindCare
- 📊 Reportes de uso y impacto
- 🏆 Red de psicólogos verificados

### Para Empleados:
- 🔍 Amplio directorio de psicólogos
- ⭐ Reviews y calificaciones
- 📅 Agendamiento fácil
- 🎁 Sin costo (beneficio empresarial)
