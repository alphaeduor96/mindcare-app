export type UserRole = "admin" | "psicologo" | "empresa" | "empleado";

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string | null;
  rol: UserRole;
  foto_perfil?: string | null;
  activo: boolean;
}

export interface Patient {
  id: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  estado: string;
  created_at?: string;
  metadata?: Record<string, any> | null;
}

export interface Appointment {
  id: string;
  paciente_id: string;
  psicologo_id: string;
  inicia_at: string;
  termina_at?: string | null;
  estado: string;
  modalidad?: string | null;
  costo_centavos?: number | null;
  pacientes?: {
    nombre?: string | null;
    apellido?: string | null;
    telefono?: string | null;
    email?: string | null;
  } | null;
}

export interface ClinicalNote {
  id: string;
  cita_id?: string | null;
  paciente_id: string;
  psicologo_id: string;
  titulo?: string | null;
  tipo: string;
  fecha_clinica: string;
  contenido: string;
  observaciones?: string | null;
  created_at?: string;
  pacientes?: {
    nombre?: string | null;
    apellido?: string | null;
  } | null;
}

export interface Payment {
  id: string;
  cita_id: string;
  monto_centavos: number;
  estado: string;
  proveedor_pago?: string | null;
  pagado_at?: string | null;
  citas?: {
    inicia_at?: string | null;
    pacientes?: {
      nombre?: string | null;
      apellido?: string | null;
    } | null;
  } | null;
}
