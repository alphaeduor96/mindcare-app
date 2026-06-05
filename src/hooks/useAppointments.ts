import { useState, useEffect } from "react";
import * as api from "../services/api";

export function useAppointments(filters?: {
  psicologo_id?: string;
  paciente_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}) {
  const [appointments, setAppointments] = useState<api.Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.citas.getAll(filters);
      setAppointments(data);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err.message || "Error al cargar citas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [
    filters?.psicologo_id,
    filters?.paciente_id,
    filters?.fecha_desde,
    filters?.fecha_hasta,
  ]);

  const createAppointment = async (data: Partial<api.Appointment>) => {
    try {
      const newAppointment = await api.citas.create(data);
      setAppointments(prev => [...prev, newAppointment]);
      return newAppointment;
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      throw err;
    }
  };

  const updateAppointment = async (id: string, data: Partial<api.Appointment>) => {
    try {
      const updated = await api.citas.update(id, data);
      setAppointments(prev =>
        prev.map(a => (a.id === id ? { ...a, ...updated } : a))
      );
      return updated;
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      throw err;
    }
  };

  const cancelAppointment = async (id: string, motivo: string) => {
    try {
      const updated = await api.citas.cancelar(id, motivo);
      setAppointments(prev =>
        prev.map(a => (a.id === id ? { ...a, ...updated } : a))
      );
      return updated;
    } catch (err: any) {
      console.error("Error canceling appointment:", err);
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await api.citas.delete(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      console.error("Error deleting appointment:", err);
      throw err;
    }
  };

  return {
    appointments,
    loading,
    error,
    refresh: fetchAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment,
  };
}
