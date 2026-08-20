import { copomexToken, mapboxAccessToken, publicAnonKey, supabaseFunctionsBaseUrl, supabaseUrl } from "../../utils/supabase/info";

export { publicAnonKey, supabaseUrl };
export { supabaseFunctionsBaseUrl };
export { copomexToken, mapboxAccessToken };

export const API_BASE = `${supabaseFunctionsBaseUrl}/make-server-0e77298f`;
export const REST_BASE = `${supabaseUrl}/rest/v1`;

export function getAuthToken() {
  return localStorage.getItem("mindcare_token") || publicAnonKey;
}

async function requestSupabaseFunction(functionName: string, options: RequestInit, token: string) {
  return fetch(`${supabaseFunctionsBaseUrl}/${functionName}`, {
    ...options,
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function supabaseFunction<T>(
  functionName: string,
  options: RequestInit = {}
): Promise<T> {
  let response = await requestSupabaseFunction(functionName, options, getAuthToken());

  if (response.status === 401) {
    try {
      const freshToken = await refreshStoredSession();
      response = await requestSupabaseFunction(functionName, options, freshToken);
    } catch (_error) {
      // Keep the original 401 response so the caller receives the real function error.
    }
  }

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_error) {
    data = { message: text };
  }

  if (!response.ok) {
    const detail = data?.detail?.message || data?.detail?.error || data?.detail?.name;
    throw new Error(data?.error || data?.message || detail || `HTTP ${response.status}`);
  }

  return data;
}

export async function sendAppEmail(payload: {
  type: string;
  to: string;
  replyTo?: string;
  data?: Record<string, any>;
}) {
  try {
    return await supabaseFunction<{ ok: boolean; id?: string }>("app-email", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el correo.";
    throw new Error(`app-email: ${message}`);
  }
}

function clearStoredSession() {
  localStorage.removeItem("mindcare_user");
  localStorage.removeItem("mindcare_token");
  localStorage.removeItem("mindcare_refresh_token");
}

function isExpiredJwtError(errorText: string) {
  return errorText.toLowerCase().includes("jwt expired");
}

export async function refreshStoredSession() {
  const refreshToken = localStorage.getItem("mindcare_refresh_token");

  if (!refreshToken) {
    clearStoredSession();
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${publicAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    clearStoredSession();
    throw new Error(data?.msg || data?.message || "Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  localStorage.setItem("mindcare_token", data.access_token);
  if (data.refresh_token) {
    localStorage.setItem("mindcare_refresh_token", data.refresh_token);
  }

  return data.access_token;
}

export async function supabaseRest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const makeRequest = (token: string) => fetch(`${REST_BASE}${path}`, {
    ...options,
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "count=exact",
      ...options.headers,
    },
  });

  let response = await makeRequest(getAuthToken());

  if (!response.ok) {
    const error = await response.clone().text();
    if (response.status === 401 && isExpiredJwtError(error)) {
      const freshToken = await refreshStoredSession();
      response = await makeRequest(freshToken);
    }
  }

  if (!response.ok) {
    const error = await response.text();
    console.error(`Supabase REST Error (${path}):`, error);
    throw new Error(`${response.status} ${response.statusText}: ${error || path}`);
  }

  return response.json();
}

export async function updateSupabaseAuthPassword(password: string) {
  const makeRequest = (token: string) => fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  let response = await makeRequest(getAuthToken());

  if (!response.ok) {
    const error = await response.clone().text();
    if (response.status === 401 && isExpiredJwtError(error)) {
      const freshToken = await refreshStoredSession();
      response = await makeRequest(freshToken);
    }
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "No se pudo actualizar la contraseña.");
  }

  return response.json();
}

export async function resolvePsychologistProfileId(idOrUserId?: string) {
  if (!idOrUserId) return null;

  const profiles = await supabaseRest<Array<{ id: string; usuario_id: string }>>(
    `/psicologos?or=(id.eq.${idOrUserId},usuario_id.eq.${idOrUserId})&select=id,usuario_id&limit=1`
  );

  return profiles[0]?.id || null;
}

export async function ensurePsychologistProfileId(idOrUserId?: string) {
  const existingProfileId = await resolvePsychologistProfileId(idOrUserId);
  if (existingProfileId) return existingProfileId;

  const storedUser = localStorage.getItem("mindcare_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const targetUserId = idOrUserId || currentUser?.id;

  if (!targetUserId || currentUser?.rol !== "psicologo" || targetUserId !== currentUser.id) {
    return null;
  }

  let publicUsers = await supabaseRest<Array<{ id: string }>>(
    `/usuarios?id=eq.${targetUserId}&select=id&limit=1`
  );

  if (!publicUsers[0]?.id) {
    if (!currentUser?.email) {
      throw new Error("Tu cuenta existe en Auth, pero falta crearla en la tabla public.usuarios y no encontré el email en la sesión local.");
    }

    publicUsers = await supabaseRest<Array<{ id: string }>>(
      "/usuarios?on_conflict=id&select=id",
      {
        method: "POST",
        headers: { Prefer: "return=representation,resolution=merge-duplicates" },
        body: JSON.stringify({
          id: targetUserId,
          email: String(currentUser.email).toLowerCase(),
          nombre: currentUser.nombre || currentUser.name?.split(" ")[0] || "Usuario",
          apellido: currentUser.apellido || currentUser.name?.split(" ").slice(1).join(" ") || "",
          telefono: currentUser.telefono || currentUser.phone || null,
          rol: "psicologo",
          estado: "activo",
          metadata: {
            repaired_from_frontend: true,
            repaired_at: new Date().toISOString(),
          },
        }),
      }
    ).catch((error) => {
      throw new Error(`Tu cuenta existe en Auth, pero falta crearla en public.usuarios y Supabase bloqueó la reparación. Ejecuta el SQL 0026. ${error?.message || ""}`);
    });
  }

  if (!publicUsers[0]?.id) {
    throw new Error("Tu cuenta existe en Auth, pero no se pudo crear la fila en public.usuarios.");
  }

  const createdProfiles = await supabaseRest<Array<{ id: string; usuario_id: string }>>(
    "/psicologos?on_conflict=usuario_id&select=id,usuario_id",
    {
      method: "POST",
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({
        usuario_id: targetUserId,
        cedula_profesional: `PENDIENTE-${targetUserId}`,
        especialidades: [],
        membresia: "independiente_free",
        modalidades: ["presencial", "virtual"],
        acepta_nuevos_pacientes: true,
        estado: "activo",
      }),
    }
  );

  const createdProfileId = createdProfiles[0]?.id || null;
  if (!createdProfileId) return null;

  const basicPlans = await supabaseRest<Array<{ id: string }>>(
    "/planes_suscripcion_psicologo?codigo=eq.basico&select=id&limit=1"
  ).catch(() => []);
  const basicPlanId = basicPlans[0]?.id;

  if (basicPlanId) {
    await supabaseRest("/suscripciones_psicologo?on_conflict=psicologo_id&select=id", {
      method: "POST",
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({
        psicologo_id: createdProfileId,
        plan_id: basicPlanId,
        estado: "activa",
      }),
    }).catch((error) => {
      console.warn("No se pudo crear la suscripción básica del psicólogo:", error);
    });
  }

  return createdProfileId;
}

async function request(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`API Error (${endpoint}):`, error);
    throw new Error(error || `HTTP ${response.status}`);
  }

  return response.json();
}

// =====================================================
// USUARIOS Y AUTENTICACIÓN
// =====================================================

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: "admin" | "psicologo" | "empresa" | "empleado";
  foto_perfil?: string;
  activo: boolean;
  metadata?: any;
}

export const auth = {
  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    rol: User["rol"];
    telefono?: string;
  }) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => request("/auth/logout", { method: "POST" }),
};

export const usuarios = {
  getById: (id: string) => request(`/usuarios/${id}`),
  update: (id: string, data: Partial<User>) =>
    request(`/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// =====================================================
// PSICÓLOGOS
// =====================================================

export interface Psychologist {
  id: string;
  usuario_id: string;
  cedula_profesional: string;
  especialidades: string[];
  biografia?: string;
  anos_experiencia?: number;
  tipo_membresia: "red_afiliado" | "independiente_free" | "independiente_basico" | "independiente_pro";
  plan_precio: number;
  limite_citas_mes?: number;
  citas_usadas_mes: number;
  modalidades: string[];
  tarifa_sesion?: number;
  duracion_sesion: number;
  acepta_nuevos_pacientes: boolean;
  calificacion_promedio: number;
  total_resenas: number;
  total_citas_completadas: number;
  verificado: boolean;
  activo: boolean;
}

export const psicologos = {
  getAll: (filters?: { activo?: boolean; verificado?: boolean }) =>
    request(`/psicologos?${new URLSearchParams(filters as any).toString()}`),

  getById: (id: string) => request(`/psicologos/${id}`),

  create: (data: Partial<Psychologist>) =>
    request("/psicologos", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Psychologist>) =>
    request(`/psicologos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/psicologos/${id}`, { method: "DELETE" }),

  getWithProfile: (id: string) => request(`/psicologos/${id}/profile`),
};

// =====================================================
// CONSULTORIOS
// =====================================================

export interface Consultorio {
  id: string;
  nombre: string;
  direccion: string;
  colonia?: string;
  municipio: string;
  codigo_postal?: string;
  telefono?: string;
  descripcion?: string;
  amenidades?: string[];
  fotos?: string[];
  activo: boolean;
}

export const consultorios = {
  getAll: () => request("/consultorios"),
  getById: (id: string) => request(`/consultorios/${id}`),
  create: (data: Partial<Consultorio>) =>
    request("/consultorios", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Consultorio>) =>
    request(`/consultorios/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/consultorios/${id}`, { method: "DELETE" }),
};

// =====================================================
// EMPRESAS
// =====================================================

export interface Company {
  id: string;
  usuario_id: string;
  razon_social: string;
  rfc: string;
  industria?: string;
  tamano_empresa?: "pequena" | "mediana" | "grande";
  numero_empleados?: number;
  sesiones_contratadas: number;
  sesiones_usadas: number;
  activo: boolean;
}

export const empresas = {
  getAll: () => request("/empresas"),
  getById: (id: string) => request(`/empresas/${id}`),
  create: (data: Partial<Company>) =>
    request("/empresas", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Company>) =>
    request(`/empresas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/empresas/${id}`, { method: "DELETE" }),
};

// =====================================================
// EMPLEADOS
// =====================================================

export interface Employee {
  id: string;
  usuario_id: string;
  empresa_id: string;
  numero_empleado?: string;
  departamento?: string;
  puesto?: string;
  sesiones_usadas: number;
  activo: boolean;
}

export const empleados = {
  getByEmpresa: (empresaId: string) => request(`/empresas/${empresaId}/empleados`),
  getById: (id: string) => request(`/empleados/${id}`),
  create: (data: Partial<Employee>) =>
    request("/empleados", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Employee>) =>
    request(`/empleados/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/empleados/${id}`, { method: "DELETE" }),
};

// =====================================================
// CITAS
// =====================================================

export interface Appointment {
  id: string;
  psicologo_id: string;
  paciente_id: string;
  empresa_id?: string;
  tipo_paciente: "red_mindcare" | "privado";
  fecha_hora: string;
  duracion: number;
  modalidad: "presencial" | "virtual";
  consultorio_id?: string;
  link_videollamada?: string;
  estado: "agendada" | "confirmada" | "completada" | "cancelada" | "no_asistio";
  motivo_consulta?: string;
  notas_psicologo?: string;
  costo?: number;
  pagada: boolean;
}

export const citas = {
  getAll: (filters?: { psicologo_id?: string; paciente_id?: string; fecha_desde?: string; fecha_hasta?: string }) =>
    request(`/citas?${new URLSearchParams(filters as any).toString()}`),

  getById: (id: string) => request(`/citas/${id}`),

  create: (data: Partial<Appointment>) =>
    request("/citas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Appointment>) =>
    request(`/citas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/citas/${id}`, { method: "DELETE" }),

  cancelar: (id: string, motivo: string) =>
    request(`/citas/${id}/cancelar`, {
      method: "POST",
      body: JSON.stringify({ motivo }),
    }),
};

// =====================================================
// DISPONIBILIDAD
// =====================================================

export interface Availability {
  id: string;
  psicologo_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  modalidad: "presencial" | "virtual" | "ambas";
  consultorio_id?: string;
  activo: boolean;
}

export const disponibilidad = {
  getByPsicologo: (psicologoId: string) => request(`/psicologos/${psicologoId}/disponibilidad`),

  create: (data: Partial<Availability>) =>
    request("/disponibilidad", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Availability>) =>
    request(`/disponibilidad/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/disponibilidad/${id}`, { method: "DELETE" }),
};

// =====================================================
// RESEÑAS
// =====================================================

export interface Review {
  id: string;
  psicologo_id: string;
  paciente_id: string;
  cita_id: string;
  calificacion: number;
  comentario?: string;
  anonimo: boolean;
  visible: boolean;
}

export const resenas = {
  getByPsicologo: (psicologoId: string) => request(`/psicologos/${psicologoId}/resenas`),

  create: (data: Partial<Review>) =>
    request("/resenas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Review>) =>
    request(`/resenas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// =====================================================
// CORTES DE PAGO
// =====================================================

export interface PaymentCut {
  id: string;
  psicologo_id: string;
  periodo_inicio: string;
  periodo_fin: string;
  total_citas: number;
  total_monto: number;
  comision_plataforma: number;
  monto_neto: number;
  estado: "pendiente" | "procesado" | "pagado";
}

export const cortesPago = {
  getByPsicologo: (psicologoId: string) => request(`/psicologos/${psicologoId}/cortes`),
  getById: (id: string) => request(`/cortes/${id}`),
  procesarCorte: (id: string) =>
    request(`/cortes/${id}/procesar`, { method: "POST" }),
};

// =====================================================
// REPORTES EMPRESARIALES
// =====================================================

export const reportes = {
  getEmpresaReporte: (empresaId: string, periodo_inicio: string, periodo_fin: string) =>
    request(`/empresas/${empresaId}/reportes?periodo_inicio=${periodo_inicio}&periodo_fin=${periodo_fin}`),

  getPsicologoStats: (psicologoId: string) =>
    request(`/psicologos/${psicologoId}/estadisticas`),

  getAdminDashboard: () => request("/reportes/admin/dashboard"),
};

// =====================================================
// NOTIFICACIONES
// =====================================================

export interface Notification {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  accion_url?: string;
}

export const notificaciones = {
  getByUsuario: (usuarioId: string) => request(`/usuarios/${usuarioId}/notificaciones`),

  marcarLeida: (id: string) =>
    request(`/notificaciones/${id}/leer`, { method: "POST" }),

  marcarTodasLeidas: (usuarioId: string) =>
    request(`/usuarios/${usuarioId}/notificaciones/leer-todas`, { method: "POST" }),
};

// =====================================================
// HEALTH CHECK
// =====================================================

export const health = {
  check: () => request("/health"),
};
