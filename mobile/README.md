# MindCare Mobile

Primera app móvil para el panel de psicólogo, hecha con React Native + Expo SDK 54.

## Qué incluye

- Login contra Supabase Auth.
- Solo permite entrar a usuarios con rol `psicologo`.
- Sesión persistida en el dispositivo.
- Tabs móviles:
  - Inicio
  - Agenda
  - Pacientes
  - Más
- Lectura real de:
  - `usuarios`
  - `psicologos`
  - `citas`
  - `pacientes`
- Configuración iOS con `jsEngine: "jsc"` para evitar errores de Hermes en Expo Go durante esta etapa inicial.
- Alta real de pacientes.
- Crear y editar citas.
- Crear entradas de expediente.
- Registrar pagos de cita.
- Activar token de push notifications en el dispositivo.
- Toggle inicial de tema claro/oscuro.
- Menú inferior simplificado tipo app bancaria: las funciones menos frecuentes viven dentro de `Más`.

## Pendiente para push notifications

La app ya pide permiso y guarda el Expo Push Token en `usuarios.metadata`.
Para enviar recordatorios reales falta una Edge Function o job servidor que lea esos tokens y llame la API de Expo Push.

## Correr local

La app está en Expo SDK 54, compatible con la versión actual de Expo Go.

```bash
cd /Users/eduor96air/Documents/MindCare/mobile
npm install
npm run start -- --port 8082 --clear
```

Después:

- iPhone físico: abre Expo Go y escanea el QR.
- iOS Simulator: presiona `i` en la terminal.
- Android Emulator: presiona `a` en la terminal.
- Web de prueba: presiona `w`.

## Configuración

La app usa las mismas llaves públicas de Supabase que la web. Configúralas por ambiente antes de levantar Expo:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```
