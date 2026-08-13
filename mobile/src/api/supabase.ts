import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appointment, ClinicalNote, Patient, Payment, User } from "../types";

const extra = Constants.expoConfig?.extra || {};

function requiredPublicConfig(name: string, value: unknown) {
  if (!value) {
    throw new Error(`Falta configurar ${name} para la app movil.`);
  }
  return String(value);
}

export const supabaseUrl = requiredPublicConfig(
  "EXPO_PUBLIC_SUPABASE_URL",
  process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl,
);

export const supabaseAnonKey = requiredPublicConfig(
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey,
);

const REST_BASE = `${supabaseUrl}/rest/v1`;

export async function getStoredToken() {
  return (await AsyncStorage.getItem("mindcare_token")) || supabaseAnonKey;
}

async function clearSession() {
  await AsyncStorage.multiRemove(["mindcare_user", "mindcare_token", "mindcare_refresh_token"]);
}

async function refreshSession() {
  const refreshToken = await AsyncStorage.getItem("mindcare_refresh_token");

  if (!refreshToken) {
    await clearSession();
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    await clearSession();
    throw new Error(data?.message || data?.msg || "Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  await AsyncStorage.setItem("mindcare_token", data.access_token);
  if (data.refresh_token) {
    await AsyncStorage.setItem("mindcare_refresh_token", data.refresh_token);
  }

  return data.access_token as string;
}

function isExpiredJwtError(text: string) {
  return text.toLowerCase().includes("jwt expired");
}

export async function supabaseRest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const request = async (token: string) =>
    fetch(`${REST_BASE}${path}`, {
      ...options,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "count=exact",
        ...options.headers,
      },
    });

  let response = await request(await getStoredToken());

  if (!response.ok) {
    const error = await response.clone().text();
    if (response.status === 401 && isExpiredJwtError(error)) {
      response = await request(await refreshSession());
    }
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${response.status}: ${error || path}`);
  }

  return response.json();
}

function getAuthErrorMessage(data: any) {
  return data?.msg || data?.message || data?.error_description || data?.error;
}

export async function loginWithSupabase(email: string, password: string) {
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const authData = await authResponse.json();

  if (!authResponse.ok) {
    throw new Error(getAuthErrorMessage(authData) || "Credenciales incorrectas");
  }

  const profiles = await supabaseRest<User[]>(
    `/usuarios?id=eq.${authData.user.id}&select=*`,
    {
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
    }
  );

  const metadata = authData.user.user_metadata || {};
  const emailName = authData.user.email?.split("@")[0] || "Usuario";
  const user = profiles[0] || {
    id: authData.user.id,
    email: authData.user.email,
    nombre: metadata.nombre || emailName,
    apellido: metadata.apellido || "",
    telefono: metadata.telefono || "",
    rol: metadata.rol || "empleado",
    activo: true,
  };

  if (user.rol !== "psicologo") {
    throw new Error("Esta app inicial es solo para usuarios psicólogos.");
  }

  await AsyncStorage.multiSet([
    ["mindcare_user", JSON.stringify(user)],
    ["mindcare_token", authData.access_token],
    ["mindcare_refresh_token", authData.refresh_token || ""],
  ]);

  return user;
}

export async function getStoredUser() {
  const rawUser = await AsyncStorage.getItem("mindcare_user");
  return rawUser ? (JSON.parse(rawUser) as User) : null;
}

export async function logout() {
  await clearSession();
}

export async function resolvePsychologistProfileId(userId?: string) {
  if (!userId) return null;

  const profiles = await supabaseRest<Array<{ id: string; usuario_id: string }>>(
    `/psicologos?or=(id.eq.${userId},usuario_id.eq.${userId})&select=id,usuario_id&limit=1`
  );

  return profiles[0]?.id || null;
}

export async function getPsychologistAppointments(profileId: string) {
  return supabaseRest<Appointment[]>(
    `/citas?psicologo_id=eq.${profileId}&select=id,paciente_id,psicologo_id,inicia_at,termina_at,estado,modalidad,costo_centavos,pacientes(nombre,apellido,telefono,email)&order=inicia_at.asc`
  );
}

export async function getPsychologistPatients(profileId: string) {
  const appointments = await supabaseRest<Array<{ paciente_id: string }>>(
    `/citas?psicologo_id=eq.${profileId}&select=paciente_id`
  );
  const patientIds = Array.from(new Set(appointments.map((appointment) => appointment.paciente_id)));
  const filters = [`creado_por_psicologo_id.eq.${profileId}`];
  if (patientIds.length > 0) filters.push(`id.in.(${patientIds.join(",")})`);

  return supabaseRest<Patient[]>(
    `/pacientes?or=(${filters.join(",")})&select=id,nombre,apellido,email,telefono,estado,metadata,created_at&order=created_at.desc`
  );
}

export async function createPatient(profileId: string, data: {
  nombre: string;
  apellido: string;
  email?: string;
  telefono: string;
  tarifa?: string;
  notas?: string;
}) {
  return supabaseRest<Patient[]>("/pacientes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      creado_por_psicologo_id: profileId,
      fuente: "privado",
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      email: data.email?.trim() || null,
      telefono: data.telefono.trim(),
      estado: "activo",
      metadata: {
        tarifa_sesion_centavos: data.tarifa ? Math.round(Number(data.tarifa) * 100) : null,
        notas: data.notas?.trim() || null,
      },
    }),
  });
}

export async function saveAppointment(profileId: string, data: {
  id?: string;
  paciente_id: string;
  inicia_at: string;
  durationMinutes: number;
  modalidad: string;
  estado: string;
  costo?: string;
}) {
  const startsAt = new Date(data.inicia_at);
  const endsAt = new Date(startsAt.getTime() + data.durationMinutes * 60000);
  const payload = {
    psicologo_id: profileId,
    paciente_id: data.paciente_id,
    fuente: "privado",
    inicia_at: startsAt.toISOString(),
    termina_at: endsAt.toISOString(),
    modalidad: data.modalidad,
    consultorio_id: null,
    estado: data.estado,
    costo_centavos: data.costo ? Math.round(Number(data.costo) * 100) : null,
  };

  return supabaseRest<Appointment[]>(data.id ? `/citas?id=eq.${data.id}` : "/citas", {
    method: data.id ? "PATCH" : "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
}

export async function getClinicalNotes(profileId: string) {
  return supabaseRest<ClinicalNote[]>(
    `/notas_sesion?psicologo_id=eq.${profileId}&select=id,cita_id,paciente_id,psicologo_id,titulo,tipo,fecha_clinica,contenido,observaciones,created_at,pacientes(nombre,apellido)&order=fecha_clinica.desc,created_at.desc`
  );
}

export async function createClinicalNote(profileId: string, data: {
  paciente_id: string;
  cita_id?: string;
  titulo?: string;
  tipo: string;
  fecha_clinica: string;
  contenido: string;
  observaciones?: string;
}) {
  return supabaseRest<ClinicalNote[]>("/notas_sesion", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      psicologo_id: profileId,
      paciente_id: data.paciente_id,
      cita_id: data.cita_id || null,
      titulo: data.titulo?.trim() || null,
      tipo: data.tipo,
      fecha_clinica: data.fecha_clinica,
      contenido: data.contenido.trim(),
      observaciones: data.observaciones?.trim() || null,
    }),
  });
}

export async function getPayments(profileId: string) {
  return supabaseRest<Payment[]>(
    `/pagos_cita?select=id,cita_id,monto_centavos,estado,proveedor_pago,pagado_at,citas!inner(psicologo_id,inicia_at,pacientes(nombre,apellido))&citas.psicologo_id=eq.${profileId}&order=pagado_at.desc`
  );
}

export async function createAppointmentPayment(data: {
  cita_id: string;
  amount: string;
  reference?: string;
}) {
  return supabaseRest<Payment[]>("/pagos_cita", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      cita_id: data.cita_id,
      pagador_tipo: "paciente",
      monto_centavos: Math.round(Number(data.amount) * 100),
      moneda: "MXN",
      estado: "pagado",
      proveedor_pago: "transferencia",
      referencia_externa: data.reference?.trim() || null,
      pagado_at: new Date().toISOString(),
    }),
  });
}

export async function savePushToken(userId: string, token: string) {
  const users = await supabaseRest<Array<{ metadata?: Record<string, any> | null }>>(
    `/usuarios?id=eq.${userId}&select=metadata&limit=1`
  );

  return supabaseRest(`/usuarios?id=eq.${userId}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      metadata: {
        ...(users[0]?.metadata || {}),
        expo_push_token: token,
        push_token_updated_at: new Date().toISOString(),
      },
    }),
  }).catch(() => null);
}
