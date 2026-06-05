import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHour?: number | null;
  editMode?: boolean;
  appointmentData?: any;
  currentPsychologistId?: string;
  onSaved?: () => void;
}

interface PatientOption {
  id: string;
  nombre: string;
  apellido: string;
}

interface OfficeOption {
  id: string;
  nombre: string;
  municipio: string;
  estado_region: string;
}

interface SubscriptionLimitRow {
  planes_suscripcion_psicologo?: {
    codigo?: string | null;
    nombre?: string | null;
    limite_citas_mensuales?: number | null;
  } | null;
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00",
];

function statusToDb(status: string) {
  if (status === "confirmed") return "confirmada";
  if (status === "pending") return "solicitada";
  if (status === "cancelled") return "cancelada";
  return status || "agendada";
}

function statusFromAppointment(status?: string) {
  if (status === "confirmed") return "confirmada";
  if (status === "pending") return "solicitada";
  if (status === "cancelled") return "cancelada";
  return status || "confirmada";
}

function combineDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes || 0, 0, 0);
  return next;
}

function fullName(patient: PatientOption) {
  return `${patient.nombre || ""} ${patient.apellido || ""}`.trim() || "Paciente sin nombre";
}

function monthRange(date: Date) {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
  };
}

async function validateSubscriptionLimit(psychologistProfileId: string, startsAt: Date) {
  const subscriptions = await supabaseRest<SubscriptionLimitRow[]>(
    `/suscripciones_psicologo?psicologo_id=eq.${psychologistProfileId}&estado=eq.activa&select=planes_suscripcion_psicologo(codigo,nombre,limite_citas_mensuales)&limit=1`
  );

  const activePlan = subscriptions[0]?.planes_suscripcion_psicologo;

  let limit = activePlan?.limite_citas_mensuales ?? null;
  let planName = activePlan?.nombre || "Plan Básico";

  if (!activePlan) {
    const basePlans = await supabaseRest<Array<{ nombre: string; limite_citas_mensuales: number | null }>>(
      "/planes_suscripcion_psicologo?codigo=eq.basico&select=nombre,limite_citas_mensuales&limit=1"
    );
    limit = basePlans[0]?.limite_citas_mensuales ?? 10;
    planName = basePlans[0]?.nombre || "Plan Básico";
  }

  if (!limit) return { allowed: true, used: 0, limit: null, planName };

  const { start, end } = monthRange(startsAt);
  const appointments = await supabaseRest<Array<{ id: string }>>(
    `/citas?psicologo_id=eq.${psychologistProfileId}&inicia_at=gte.${start.toISOString()}&inicia_at=lt.${end.toISOString()}&estado=in.(solicitada,agendada,confirmada,completada)&select=id`
  );

  return {
    allowed: appointments.length < limit,
    used: appointments.length,
    limit,
    planName,
  };
}

export function AppointmentModal({
  isOpen,
  onClose,
  selectedHour,
  editMode = false,
  appointmentData,
  currentPsychologistId,
  onSaved,
}: AppointmentModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [offices, setOffices] = useState<OfficeOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    patient: "",
    time: "",
    office: "",
    amount: "",
    status: "confirmada",
    duration: "60",
    modality: "presencial",
  });

  useEffect(() => {
    if (!isOpen) return;

    const appointmentDate = appointmentData?.date ? new Date(appointmentData.date) : new Date();
    setDate(appointmentDate);
    setFormData({
      patient: appointmentData?.patientId || "",
      time:
        appointmentData?.time ||
        (selectedHour !== null && selectedHour !== undefined
          ? `${selectedHour.toString().padStart(2, "0")}:00`
          : ""),
      office: appointmentData?.officeId || "",
      amount: appointmentData?.amount?.toString() || "",
      status: statusFromAppointment(appointmentData?.status),
      duration: appointmentData?.duration?.toString() || "60",
      modality: appointmentData?.modality || (appointmentData?.officeId ? "presencial" : "presencial"),
    });
  }, [appointmentData, isOpen, selectedHour]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);

      try {
        const [patientRows, officeRows] = await Promise.all([
          supabaseRest<PatientOption[]>(
            "/pacientes?estado=eq.activo&select=id,nombre,apellido&order=created_at.desc"
          ),
          supabaseRest<OfficeOption[]>(
            "/consultorios?estado=eq.activo&select=id,nombre,municipio,estado_region&order=nombre.asc"
          ),
        ]);

        if (!active) return;
        setPatients(patientRows);
        setOffices(officeRows);
      } catch (error) {
        console.error("Appointment options load error:", error);
        toast.error("No se pudieron cargar pacientes o consultorios.");
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient || !formData.time) {
      toast.error("Selecciona paciente, fecha y hora");
      return;
    }

    if (formData.modality === "presencial" && !formData.office) {
      toast.error("Selecciona un consultorio para citas presenciales");
      return;
    }

    setSaving(true);

    try {
      const psychologistProfileId = await resolvePsychologistProfileId(
        appointmentData?.psychologistId || currentPsychologistId
      );

      if (!psychologistProfileId) {
        toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
        return;
      }

      const startsAt = combineDateTime(date, formData.time);
      const duration = Number(formData.duration || 60);
      const endsAt = new Date(startsAt.getTime() + duration * 60000);
      const amount = formData.amount ? Math.round(Number(formData.amount) * 100) : null;

      if (!editMode) {
        const usage = await validateSubscriptionLimit(psychologistProfileId, startsAt);

        if (!usage.allowed) {
          toast.error(
            `Llegaste al límite de ${usage.limit} citas mensuales de tu ${usage.planName}. Cambia de plan para agendar más citas.`
          );
          return;
        }
      }

      const payload = {
        psicologo_id: psychologistProfileId,
        paciente_id: formData.patient,
        fuente: "privado",
        inicia_at: startsAt.toISOString(),
        termina_at: endsAt.toISOString(),
        modalidad: formData.modality,
        consultorio_id: formData.modality === "presencial" ? formData.office : null,
        estado: statusToDb(formData.status),
        costo_centavos: amount,
      };

      await supabaseRest(editMode ? `/citas?id=eq.${appointmentData?.id}` : "/citas", {
        method: editMode ? "PATCH" : "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });

      toast.success(editMode ? "Cita actualizada" : "Cita creada exitosamente");
      onSaved?.();
      onClose();
    } catch (error: any) {
      console.error("Save appointment error:", error);
      const message = String(error?.message || "");
      toast.error(
        message.includes("Límite mensual de citas")
          ? "Llegaste al límite mensual de citas de tu suscripción. Cambia de plan para agendar más."
          : "No se pudo guardar la cita en la base de datos."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{editMode ? "Editar Cita" : "Nueva Cita"}</DialogTitle>
          <DialogDescription>
            {editMode ? "Modifica los datos de la cita" : "Agenda una cita con datos reales de Supabase"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente</Label>
            <Select
              value={formData.patient}
              onValueChange={(value) => setFormData({ ...formData, patient: value })}
              disabled={saving || loadingOptions}
            >
              <SelectTrigger className="bg-input-background">
                <SelectValue placeholder={loadingOptions ? "Cargando pacientes..." : "Seleccionar paciente"} />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {fullName(patient)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left bg-input-background"
                    disabled={saving}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PP", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
                disabled={saving}
              >
                <SelectTrigger className="bg-input-background">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
                disabled={saving}
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1 hora 30 minutos</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modality">Modalidad</Label>
              <Select
                value={formData.modality}
                onValueChange={(value) =>
                  setFormData({ ...formData, modality: value, office: value === "virtual" ? "" : formData.office })
                }
                disabled={saving}
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.modality === "presencial" && (
            <div className="space-y-2">
              <Label htmlFor="office">Consultorio</Label>
              <Select
                value={formData.office}
                onValueChange={(value) => setFormData({ ...formData, office: value })}
                disabled={saving || loadingOptions}
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue placeholder={loadingOptions ? "Cargando consultorios..." : "Seleccionar consultorio"} />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.nombre} - {office.municipio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1"
                placeholder="$0"
                className="bg-input-background"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={saving}
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solicitada">Solicitada</SelectItem>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="no_asistio">No asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={saving}
            >
              {saving ? "Guardando..." : editMode ? "Guardar Cambios" : "Guardar Cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
