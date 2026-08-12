import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";
import { ensurePsychologistProfileId, resolvePsychologistProfileId, supabaseRest } from "../../services/api";
import {
  getWorkingHours,
  normalizeTimeValue,
  saveWorkingHours,
  timeToMinutes,
} from "../utils/appointmentPreferences";

interface SettingsProps {
  userRole?: "admin" | "psicologo" | "empresa" | "empleado";
  userId?: string;
  appointmentDefaultView?: "calendar" | "list";
  onAppointmentDefaultViewChange?: (view: "calendar" | "list") => void;
}

export function Settings({
  userRole,
  userId,
  appointmentDefaultView = "calendar",
  onAppointmentDefaultViewChange,
}: SettingsProps) {
  const isPsychologist = userRole === "psicologo";
  const initialWorkingHours = getWorkingHours(userId);
  const [settings, setSettings] = useState({
    workingHoursStart: initialWorkingHours.start,
    workingHoursEnd: initialWorkingHours.end,
    appointmentDefaultView,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    let active = true;
    const workingHours = getWorkingHours(userId);
    setSettings((current) => ({
      ...current,
      appointmentDefaultView,
      workingHoursStart: workingHours.start,
      workingHoursEnd: workingHours.end,
    }));

    async function loadSavedWorkingHours() {
      if (!userId || !isPsychologist) return;

      try {
        const profileId = await resolvePsychologistProfileId(userId);
        if (!profileId) return;

        const rows = await supabaseRest<Array<{ horario_inicio: string; horario_cierre: string }>>(
          `/psicologo_configuracion?psicologo_id=eq.${profileId}&select=horario_inicio,horario_cierre&limit=1`
        );
        const row = rows[0];
        if (!active || !row) return;

        const nextWorkingHours = {
          start: normalizeTimeValue(row.horario_inicio) || workingHours.start,
          end: normalizeTimeValue(row.horario_cierre) || workingHours.end,
        };
        saveWorkingHours(userId, nextWorkingHours);
        setSettings((current) => ({
          ...current,
          workingHoursStart: nextWorkingHours.start,
          workingHoursEnd: nextWorkingHours.end,
        }));
      } catch (error) {
        console.warn("No se pudo cargar el horario desde Supabase:", error);
      }
    }

    loadSavedWorkingHours();

    return () => {
      active = false;
    };
  }, [appointmentDefaultView, isPsychologist, userId]);

  const handleGeneralSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (timeToMinutes(settings.workingHoursEnd) <= timeToMinutes(settings.workingHoursStart)) {
      toast.error("El horario de cierre debe ser posterior al horario de inicio.");
      return;
    }

    setSavingSettings(true);
    saveWorkingHours(userId, {
      start: settings.workingHoursStart,
      end: settings.workingHoursEnd,
    });

    try {
      if (userId && isPsychologist) {
        const profileId = await ensurePsychologistProfileId(userId);
        if (profileId) {
          await supabaseRest("/psicologo_configuracion?on_conflict=psicologo_id&select=psicologo_id", {
            method: "POST",
            headers: { Prefer: "return=representation,resolution=merge-duplicates" },
            body: JSON.stringify({
              psicologo_id: profileId,
              horario_inicio: settings.workingHoursStart,
              horario_cierre: settings.workingHoursEnd,
              duracion_sesion_minutos: 60,
            }),
          });
        }
      }

      toast.success("Configuración actualizada exitosamente");
    } catch (error) {
      console.warn("No se pudo guardar el horario en Supabase:", error);
      toast.info("Guardé el horario en este navegador. Ejecuta la migración 0019 para guardarlo también en Supabase.");
      toast.success("Configuración actualizada en este navegador");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1">Configuración</h1>
        <p className="text-muted-foreground">
          Ajustes de agenda activos para tu panel
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Agenda y citas
          </CardTitle>
          <CardDescription>
            Define cómo se muestra tu agenda y en qué horario se pueden crear citas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="appointmentDefaultView">Vista inicial de citas</Label>
              <Select
                value={settings.appointmentDefaultView}
                onValueChange={(value: "calendar" | "list") => {
                  setSettings({ ...settings, appointmentDefaultView: value });
                  onAppointmentDefaultViewChange?.(value);
                }}
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendar">Calendario</SelectItem>
                  <SelectItem value="list">Lista</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define qué vista se abre por defecto al entrar a Citas.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workStart">Horario de inicio</Label>
              <Input
                id="workStart"
                type="time"
                value={settings.workingHoursStart}
                onChange={(e) =>
                  setSettings({ ...settings, workingHoursStart: e.target.value })
                }
                className="bg-input-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workEnd">Horario de cierre</Label>
              <Input
                id="workEnd"
                type="time"
                value={settings.workingHoursEnd}
                onChange={(e) =>
                  setSettings({ ...settings, workingHoursEnd: e.target.value })
                }
                className="bg-input-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end border-t border-border pt-4">
        <Button
          type="button"
          onClick={handleGeneralSubmit}
          disabled={savingSettings}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {savingSettings ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </div>
  );
}
