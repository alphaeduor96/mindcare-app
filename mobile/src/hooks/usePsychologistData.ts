import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPsychologistAppointments,
  getPsychologistPatients,
  resolvePsychologistProfileId,
} from "../api/supabase";
import { Appointment, Patient } from "../types";
import { useAuth } from "../state/AuthContext";

export function usePsychologistData() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    try {
      const resolvedProfileId = await resolvePsychologistProfileId(user.id);
      setProfileId(resolvedProfileId);

      if (!resolvedProfileId) {
        setAppointments([]);
        setPatients([]);
        setError("Tu usuario aún no tiene perfil vinculado en psicólogos.");
        return;
      }

      const [appointmentRows, patientRows] = await Promise.all([
        getPsychologistAppointments(resolvedProfileId),
        getPsychologistPatients(resolvedProfileId),
      ]);

      setAppointments(appointmentRows);
      setPatients(patientRows);
    } catch (loadError: any) {
      setError(loadError?.message || "No se pudo cargar información de Supabase.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const todayAppointments = useMemo(() => {
    const today = new Date();
    return appointments.filter((appointment) => {
      const startsAt = new Date(appointment.inicia_at);
      return (
        startsAt.getFullYear() === today.getFullYear() &&
        startsAt.getMonth() === today.getMonth() &&
        startsAt.getDate() === today.getDate() &&
        appointment.estado !== "cancelada"
      );
    });
  }, [appointments]);

  const monthlyIncomeCents = useMemo(() => {
    const now = new Date();
    return appointments.reduce((total, appointment) => {
      const startsAt = new Date(appointment.inicia_at);
      if (
        startsAt.getFullYear() !== now.getFullYear() ||
        startsAt.getMonth() !== now.getMonth() ||
        appointment.estado === "cancelada"
      ) {
        return total;
      }
      return total + (appointment.costo_centavos || 0);
    }, 0);
  }, [appointments]);

  return {
    profileId,
    appointments,
    patients,
    todayAppointments,
    monthlyIncomeCents,
    loading,
    error,
    reload: load,
  };
}
