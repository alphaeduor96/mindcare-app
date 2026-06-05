import { useState, useEffect } from "react";
import * as api from "../services/api";

export function usePsychologists(filters?: { activo?: boolean; verificado?: boolean }) {
  const [psychologists, setPsychologists] = useState<api.Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPsychologists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.psicologos.getAll(filters);
      setPsychologists(data);
    } catch (err: any) {
      console.error("Error fetching psychologists:", err);
      setError(err.message || "Error al cargar psicólogos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPsychologists();
  }, [filters?.activo, filters?.verificado]);

  const createPsychologist = async (data: Partial<api.Psychologist>) => {
    try {
      const newPsy = await api.psicologos.create(data);
      setPsychologists(prev => [...prev, newPsy]);
      return newPsy;
    } catch (err: any) {
      console.error("Error creating psychologist:", err);
      throw err;
    }
  };

  const updatePsychologist = async (id: string, data: Partial<api.Psychologist>) => {
    try {
      const updated = await api.psicologos.update(id, data);
      setPsychologists(prev =>
        prev.map(p => (p.id === id ? { ...p, ...updated } : p))
      );
      return updated;
    } catch (err: any) {
      console.error("Error updating psychologist:", err);
      throw err;
    }
  };

  const deletePsychologist = async (id: string) => {
    try {
      await api.psicologos.delete(id);
      setPsychologists(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      console.error("Error deleting psychologist:", err);
      throw err;
    }
  };

  return {
    psychologists,
    loading,
    error,
    refresh: fetchPsychologists,
    createPsychologist,
    updatePsychologist,
    deletePsychologist,
  };
}
