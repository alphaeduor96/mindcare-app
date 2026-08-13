import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "./ui/switch";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { resolvePsychologistProfileId, sendAppEmail, supabaseRest } from "../../services/api";
import {
  getAppointmentTimeSlots,
  getWorkingHours,
  isWithinWorkingHours,
  normalizeTimeValue,
  saveWorkingHours,
  timeToMinutes,
  workingHoursChangedEvent,
  type WorkingHours,
} from "../utils/appointmentPreferences";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date | null;
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
  email?: string | null;
  metadata?: Record<string, any> | null;
}

interface OfficeOption {
  id: string;
  nombre: string;
  direccion?: string | null;
  colonia?: string | null;
  municipio: string;
  estado_region: string;
  codigo_postal?: string | null;
  es_principal?: boolean;
}

interface SubscriptionLimitRow {
  planes_suscripcion_psicologo?: {
    codigo?: string | null;
    nombre?: string | null;
    limite_citas_mensuales?: number | null;
  } | null;
}

interface AppointmentConflictRow {
  id: string;
  inicia_at: string;
  termina_at: string;
  pacientes?: {
    nombre?: string | null;
    apellido?: string | null;
  } | null;
}

interface AppointmentEditRow {
  id: string;
  paciente_id: string;
  psicologo_id: string;
  inicia_at: string;
  termina_at: string;
  estado: string;
  modalidad: "presencial" | "virtual";
  consultorio_id?: string | null;
  costo_centavos?: number | null;
  pacientes?: {
    id?: string;
    nombre?: string | null;
    apellido?: string | null;
    email?: string | null;
    metadata?: Record<string, any> | null;
  } | null;
  consultorios?: (OfficeOption & { estado?: string | null }) | null;
}

type BasicAppointmentRow = Omit<AppointmentEditRow, "pacientes" | "consultorios">;

const durationOptions = Array.from({ length: ((180 - 30) / 5) + 1 }, (_, index) => 30 + index * 5);

function statusToDb(status: string) {
  if (status === "scheduled") return "agendada";
  if (status === "cancelled") return "cancelada";
  if (status === "no_show") return "no_asistio";
  return status || "agendada";
}

function statusFromAppointment(status?: string) {
  if (status === "cancelada" || status === "cancelled") return "cancelada";
  if (status === "no_asistio" || status === "no_show") return "no_asistio";
  return "agendada";
}

function combineDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes || 0, 0, 0);
  return next;
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(total / 60);
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function diffTimeMinutes(startTime: string, endTime: string) {
  if (!startTime || !endTime) return 0;
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}

function fullName(patient: PatientOption) {
  return `${patient.nombre || ""} ${patient.apellido || ""}`.trim() || "Paciente sin nombre";
}

function getPatientFee(patient?: PatientOption) {
  const cents = patient?.metadata?.tarifa_sesion_centavos;
  return cents ? String(Number(cents) / 100) : "";
}

function monthRange(date: Date) {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
  };
}

function addWeeks(date: Date, weeks: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + weeks * 7);
  return next;
}

function formatAppointmentDateTime(date: Date) {
  return format(date, "EEEE d 'de' MMMM, HH:mm", { locale: es });
}

function conflictPatientName(conflict: AppointmentConflictRow) {
  const patient = conflict.pacientes;
  return `${patient?.nombre || ""} ${patient?.apellido || ""}`.trim() || "otra cita";
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

async function findAppointmentConflict(psychologistProfileId: string, startsAt: Date, endsAt: Date) {
  const conflicts = await supabaseRest<AppointmentConflictRow[]>(
    `/citas?psicologo_id=eq.${psychologistProfileId}&estado=neq.cancelada&inicia_at=lt.${endsAt.toISOString()}&termina_at=gt.${startsAt.toISOString()}&select=id,inicia_at,termina_at,pacientes(nombre,apellido)&order=inicia_at.asc&limit=1`
  );

  return conflicts[0] || null;
}

function pickDefaultOffice(offices: OfficeOption[]) {
  return offices.find((office) => office.es_principal)?.id || offices[0]?.id || "";
}

function officeAddress(office?: OfficeOption) {
  if (!office) return "";

  return [
    office.direccion,
    office.colonia,
    office.municipio,
    office.estado_region,
    office.codigo_postal ? `CP ${office.codigo_postal}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

function storedUserName() {
  try {
    const user = JSON.parse(localStorage.getItem("mindcare_user") || "{}");
    return `${user.nombre || ""} ${user.apellido || ""}`.trim() || "tu psicólogo(a)";
  } catch (_error) {
    return "tu psicólogo(a)";
  }
}

function toTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function describeWorkingHours(workingHours: WorkingHours) {
  return `${workingHours.start} a ${workingHours.end}`;
}

function dateWithTime(dateValue: unknown, timeValue?: string) {
  if (!dateValue) return null;
  const next = new Date(dateValue as any);
  if (!Number.isFinite(next.getTime())) return null;

  if (timeValue && /^\d{1,2}:\d{2}/.test(timeValue)) {
    const [hours, minutes] = timeValue.split(":").map(Number);
    next.setHours(hours, minutes || 0, 0, 0);
  }

  return next;
}

function normalizeAppointmentData(appointment: any) {
  if (!appointment) return null;

  const startsAt = appointment.inicia_at
    ? new Date(appointment.inicia_at)
    : appointment.date
      ? dateWithTime(appointment.date, appointment.time)
      : null;
  const endsAt = appointment.termina_at
    ? new Date(appointment.termina_at)
    : startsAt
      ? new Date(startsAt.getTime() + Number(appointment.duration || 60) * 60000)
      : null;
  const duration = startsAt && endsAt
    ? Math.max(15, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000))
    : Number(appointment.duration || 60);

  return {
    id: appointment.id,
    patientId: appointment.paciente_id || appointment.patientId || "",
    psychologistId: appointment.psicologo_id || appointment.psychologistId || "",
    date: startsAt || new Date(),
    time: startsAt ? toTimeInput(startsAt) : appointment.time || "",
    endTime: endsAt ? toTimeInput(endsAt) : "",
    duration: String(duration),
    officeId: appointment.consultorio_id || appointment.officeId || "",
    amount: appointment.costo_centavos != null
      ? String(Number(appointment.costo_centavos) / 100)
      : appointment.amount != null
        ? String(appointment.amount)
        : "",
    status: statusFromAppointment(appointment.estado || appointment.status),
    modality: appointment.modalidad || appointment.modality || "presencial",
    patient: appointment.patient || fullName(appointment.pacientes || {}),
    office: appointment.office || appointment.consultorios?.nombre,
  };
}

export function AppointmentModal({
  isOpen,
  onClose,
  selectedDate,
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
  const [workingHours, setWorkingHours] = useState(() =>
    getWorkingHours(currentPsychologistId || appointmentData?.psychologistId)
  );
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState("4");
  const [formData, setFormData] = useState({
    patient: "",
    time: "",
    office: "",
    amount: "",
    status: "agendada",
    duration: "60",
    endTime: "",
    modality: "presencial",
  });
  const timeSlots = useMemo(() => getAppointmentTimeSlots(workingHours), [workingHours]);
  const startTimeSlots = useMemo(
    () => {
      const duration = Number(formData.duration || 60);
      return timeSlots.filter((time) => timeToMinutes(time) + duration <= timeToMinutes(workingHours.end));
    },
    [formData.duration, timeSlots, workingHours.end]
  );

  useEffect(() => {
    const storageUserId = currentPsychologistId || appointmentData?.psychologistId;
    setWorkingHours(getWorkingHours(storageUserId));
    let active = true;

    const handleWorkingHoursChanged = () => {
      setWorkingHours(getWorkingHours(storageUserId));
    };

    async function loadWorkingHoursFromDatabase() {
      try {
        const profileId = await resolvePsychologistProfileId(storageUserId);
        if (!profileId) return;

        const rows = await supabaseRest<Array<{ horario_inicio: string; horario_cierre: string }>>(
          `/psicologo_configuracion?psicologo_id=eq.${profileId}&select=horario_inicio,horario_cierre&limit=1`
        );
        const row = rows[0];
        if (!active || !row) return;

        const nextWorkingHours = {
          start: normalizeTimeValue(row.horario_inicio) || getWorkingHours(storageUserId).start,
          end: normalizeTimeValue(row.horario_cierre) || getWorkingHours(storageUserId).end,
        };
        saveWorkingHours(storageUserId, nextWorkingHours);
        setWorkingHours(nextWorkingHours);
      } catch (error) {
        console.warn("Appointment working hours unavailable:", error);
      }
    }

    window.addEventListener(workingHoursChangedEvent, handleWorkingHoursChanged);
    loadWorkingHoursFromDatabase();
    return () => {
      active = false;
      window.removeEventListener(workingHoursChangedEvent, handleWorkingHoursChanged);
    };
  }, [currentPsychologistId, appointmentData?.psychologistId]);

  useEffect(() => {
    if (!isOpen) return;

    const normalizedAppointment = normalizeAppointmentData(appointmentData);
    const appointmentDate = normalizedAppointment?.date || selectedDate || new Date();
    setDate(appointmentDate);
    const initialTime =
      normalizedAppointment?.time ||
      (selectedHour !== null && selectedHour !== undefined
        ? `${selectedHour.toString().padStart(2, "0")}:00`
        : "");
    const safeInitialTime = initialTime && startTimeSlots.includes(initialTime)
      ? initialTime
      : normalizedAppointment?.time || startTimeSlots[0] || workingHours.start;
    const initialDuration = normalizedAppointment?.duration || "60";
    const initialEndCandidate = safeInitialTime ? addMinutesToTime(safeInitialTime, Number(initialDuration)) : "";
    const availableDuration = safeInitialTime ? diffTimeMinutes(safeInitialTime, workingHours.end) : Number(initialDuration);
    const safeInitialDuration =
      normalizedAppointment?.time || !initialEndCandidate || isWithinWorkingHours(safeInitialTime, initialEndCandidate, workingHours)
        ? initialDuration
        : String(Math.max(30, Math.min(Number(initialDuration), availableDuration)));
    const initialEndTime = normalizedAppointment?.endTime || (safeInitialTime ? addMinutesToTime(safeInitialTime, Number(safeInitialDuration)) : "");

    setFormData({
      patient: normalizedAppointment?.patientId || "",
      time: safeInitialTime,
      office: normalizedAppointment?.officeId || "",
      amount: normalizedAppointment?.amount || "",
      status: normalizedAppointment?.status || "agendada",
      duration: safeInitialDuration,
      endTime: initialEndTime,
      modality: normalizedAppointment?.modality || "presencial",
    });
    setRepeatWeekly(false);
    setRepeatWeeks("4");
  }, [appointmentData, isOpen, selectedDate, selectedHour, startTimeSlots, workingHours.start]);

  const updateStartTime = (value: string) => {
    const duration = Number(formData.duration || 60);
    const nextEndTime = addMinutesToTime(value, duration);

    if (!isWithinWorkingHours(value, nextEndTime, workingHours)) {
      const availableDuration = diffTimeMinutes(value, workingHours.end);
      if (availableDuration < 30) {
        toast.error(`La cita debe iniciar dentro de tu horario: ${describeWorkingHours(workingHours)}.`);
        return;
      }

      toast.info(`Ajusté la hora fin para respetar tu cierre de ${workingHours.end}.`);
      setFormData({
        ...formData,
        time: value,
        endTime: workingHours.end,
        duration: String(availableDuration),
      });
      return;
    }

    setFormData({
      ...formData,
      time: value,
      endTime: nextEndTime,
    });
  };

  const updateDuration = (value: string) => {
    const nextDuration = Number(value);
    const nextEndTime = formData.time ? addMinutesToTime(formData.time, nextDuration) : formData.endTime;

    if (formData.time && !isWithinWorkingHours(formData.time, nextEndTime, workingHours)) {
      toast.error(`Esa duración rebasa tu horario de cierre (${workingHours.end}).`);
      return;
    }

    setFormData({
      ...formData,
      duration: value,
      endTime: nextEndTime,
    });
  };

  const updateEndTime = (value: string) => {
    const nextDuration = diffTimeMinutes(formData.time, value);

    if (formData.time && (nextDuration < 30 || nextDuration > 180)) {
      toast.error("La duración debe estar entre 30 minutos y 3 horas.");
      return;
    }

    if (formData.time && !isWithinWorkingHours(formData.time, value, workingHours)) {
      toast.error(`La cita debe quedar dentro de tu horario: ${describeWorkingHours(workingHours)}.`);
      return;
    }

    setFormData({
      ...formData,
      endTime: value,
      duration: formData.time && nextDuration > 0 ? String(nextDuration) : formData.duration,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);

      try {
        const psychologistProfileId = await resolvePsychologistProfileId(
          appointmentData?.psychologistId || currentPsychologistId
        );
        const normalizedAppointment = normalizeAppointmentData(appointmentData);

        const [patientRows, officeRows, basicEditRows, editRows] = await Promise.all([
          supabaseRest<PatientOption[]>(
            "/pacientes?estado=eq.activo&select=id,nombre,apellido,email,metadata&order=created_at.desc"
          ),
          psychologistProfileId
            ? supabaseRest<
                Array<{
                  consultorio_id: string;
                  es_principal: boolean;
                  consultorios?: (OfficeOption & { estado?: string | null }) | null;
                }>
              >(
                `/psicologo_consultorios?psicologo_id=eq.${psychologistProfileId}&select=consultorio_id,es_principal,consultorios(id,nombre,direccion,colonia,municipio,estado_region,codigo_postal,estado)&order=es_principal.desc`
              ).then((rows) =>
                rows
                  .filter((row) => row.consultorios && row.consultorios.estado === "activo")
                  .map((row) => ({
                    id: row.consultorio_id,
                    nombre: row.consultorios?.nombre || "Consultorio",
                    direccion: row.consultorios?.direccion || "",
                    colonia: row.consultorios?.colonia || "",
                    municipio: row.consultorios?.municipio || "",
                    estado_region: row.consultorios?.estado_region || "",
                    codigo_postal: row.consultorios?.codigo_postal || "",
                    es_principal: row.es_principal,
                  }))
              )
            : Promise.resolve([]),
          editMode && appointmentData?.id
            ? supabaseRest<BasicAppointmentRow[]>(
                `/citas?id=eq.${appointmentData.id}&select=id,paciente_id,psicologo_id,inicia_at,termina_at,estado,modalidad,consultorio_id,costo_centavos&limit=1`
              ).catch((error: any) => {
                console.warn("Appointment basic edit preload unavailable:", error);
                return [];
              })
            : Promise.resolve([]),
          editMode && appointmentData?.id
            ? supabaseRest<AppointmentEditRow[]>(
                `/citas?id=eq.${appointmentData.id}&select=id,paciente_id,psicologo_id,inicia_at,termina_at,estado,modalidad,consultorio_id,costo_centavos,pacientes(id,nombre,apellido,email,metadata),consultorios(id,nombre,direccion,colonia,municipio,estado_region,codigo_postal,estado)&limit=1`
              ).catch((error: any) => {
                console.warn("Appointment edit preload unavailable:", error);
                return [];
              })
            : Promise.resolve([]),
        ]);

        if (!active) return;
        const basicEditRow = basicEditRows[0];
        const editRow = editRows[0];
        const fullAppointment = normalizeAppointmentData(editRow || basicEditRow || normalizedAppointment);
        const resolvedPatientRows = [...patientRows];
        const resolvedOfficeRows = [...officeRows];

        const appointmentPatientId = fullAppointment?.patientId || editRow?.paciente_id || basicEditRow?.paciente_id || "";
        const appointmentOfficeId = fullAppointment?.officeId || editRow?.consultorio_id || basicEditRow?.consultorio_id || "";

        if (editRow?.pacientes && !resolvedPatientRows.some((patient) => patient.id === editRow.paciente_id)) {
          resolvedPatientRows.unshift({
            id: editRow.paciente_id,
            nombre: editRow.pacientes.nombre || "",
            apellido: editRow.pacientes.apellido || "",
            email: editRow.pacientes.email || null,
            metadata: editRow.pacientes.metadata || null,
          });
        }

        if (
          appointmentPatientId &&
          !resolvedPatientRows.some((patient) => patient.id === appointmentPatientId)
        ) {
          const [firstName, ...lastParts] = String(fullAppointment?.patient || "Paciente seleccionado").split(" ");
          resolvedPatientRows.unshift({
            id: appointmentPatientId,
            nombre: firstName || "Paciente",
            apellido: lastParts.join(" "),
            email: null,
            metadata: null,
          });
        }

        if (editRow?.consultorios && editRow.consultorio_id && !resolvedOfficeRows.some((office) => office.id === editRow.consultorio_id)) {
          resolvedOfficeRows.unshift({
            id: editRow.consultorio_id,
            nombre: editRow.consultorios.nombre || "Consultorio",
            direccion: editRow.consultorios.direccion || "",
            colonia: editRow.consultorios.colonia || "",
            municipio: editRow.consultorios.municipio || "",
            estado_region: editRow.consultorios.estado_region || "",
            codigo_postal: editRow.consultorios.codigo_postal || "",
            es_principal: false,
          });
        }

        if (
          appointmentOfficeId &&
          !resolvedOfficeRows.some((office) => office.id === appointmentOfficeId)
        ) {
          resolvedOfficeRows.unshift({
            id: appointmentOfficeId,
            nombre: fullAppointment?.office || "Consultorio seleccionado",
            direccion: "",
            colonia: "",
            municipio: "",
            estado_region: "",
            codigo_postal: "",
            es_principal: false,
          });
        }

        const defaultOfficeId = pickDefaultOffice(resolvedOfficeRows);

        setPatients(resolvedPatientRows);
        setOffices(resolvedOfficeRows);
        if (editMode && fullAppointment) {
          setDate(fullAppointment.date);
          setFormData({
            patient: fullAppointment.patientId,
            time: fullAppointment.time,
            office: fullAppointment.officeId,
            amount: fullAppointment.amount,
            status: fullAppointment.status,
            duration: fullAppointment.duration,
            endTime: fullAppointment.endTime || addMinutesToTime(fullAppointment.time, Number(fullAppointment.duration || 60)),
            modality: fullAppointment.modality,
          });
          return;
        }

        setFormData((current) => {
          if (editMode || current.office || current.modality !== "presencial") return current;
          return {
            ...current,
            office: defaultOfficeId,
          };
        });
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
  }, [appointmentData, currentPsychologistId, editMode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient || !formData.time) {
      toast.error("Selecciona paciente, fecha y hora");
      return;
    }

    if (!formData.endTime) {
      toast.error("Selecciona hora de fin");
      return;
    }

    const calculatedDuration = diffTimeMinutes(formData.time, formData.endTime);
    if (calculatedDuration < 30 || calculatedDuration > 180) {
      toast.error("La duración debe estar entre 30 minutos y 3 horas.");
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
      const duration = calculatedDuration || Number(formData.duration || 60);
      const endsAt = new Date(startsAt.getTime() + duration * 60000);
      const amount = formData.amount ? Math.round(Number(formData.amount) * 100) : null;
      const totalOccurrences = repeatWeekly && !editMode ? Number(repeatWeeks || 4) : 1;
      const occurrences = Array.from({ length: totalOccurrences }, (_, index) => {
        const occurrenceStartsAt = addWeeks(startsAt, index);
        return {
          startsAt: occurrenceStartsAt,
          endsAt: new Date(occurrenceStartsAt.getTime() + duration * 60000),
        };
      });

      for (const occurrence of occurrences) {
        if (!isWithinWorkingHours(toTimeInput(occurrence.startsAt), toTimeInput(occurrence.endsAt), workingHours)) {
          toast.error(
            `No se puede guardar: ${formatAppointmentDateTime(occurrence.startsAt)} queda fuera de tu horario (${describeWorkingHours(workingHours)}).`
          );
          return;
        }
      }

      if (!editMode) {
        const plannedByMonth = new Map<string, number>();

        for (const occurrence of occurrences) {
          const conflict = await findAppointmentConflict(psychologistProfileId, occurrence.startsAt, occurrence.endsAt);

          if (conflict) {
            toast.error(
              `No se puede repetir: el ${formatAppointmentDateTime(occurrence.startsAt)} se cruza con ${conflictPatientName(conflict)}.`
            );
            return;
          }

          const usage = await validateSubscriptionLimit(psychologistProfileId, occurrence.startsAt);

          if (usage.limit) {
            const monthKey = `${occurrence.startsAt.getFullYear()}-${occurrence.startsAt.getMonth()}`;
            const plannedInMonth = plannedByMonth.get(monthKey) || 0;

            if (usage.used + plannedInMonth >= usage.limit) {
              toast.error(
                `No se puede repetir: llegarías al límite de ${usage.limit} citas mensuales de tu ${usage.planName}.`
              );
              return;
            }

            plannedByMonth.set(monthKey, plannedInMonth + 1);
          }
        }
      }

      const payload = occurrences.map((occurrence) => ({
        psicologo_id: psychologistProfileId,
        paciente_id: formData.patient,
        fuente: "privado",
        inicia_at: occurrence.startsAt.toISOString(),
        termina_at: occurrence.endsAt.toISOString(),
        modalidad: formData.modality,
        consultorio_id: formData.modality === "presencial" ? formData.office : null,
        estado: statusToDb(formData.status),
        costo_centavos: amount,
      }));

      await supabaseRest(editMode ? `/citas?id=eq.${appointmentData?.id}` : "/citas", {
        method: editMode ? "PATCH" : "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(editMode ? payload[0] : payload),
      });

      const selectedPatient = patients.find((patient) => patient.id === formData.patient);
      let emailNotice: string | null = null;
      if (selectedPatient?.email) {
        const selectedOffice = offices.find((office) => office.id === formData.office);
        const emailType = editMode
          ? formData.status === "cancelada"
            ? "appointment_cancelled"
            : "appointment_updated"
          : "appointment_created";

        try {
          await sendAppEmail({
            type: emailType,
            to: selectedPatient.email,
            data: {
              patientId: selectedPatient.id,
              patientName: fullName(selectedPatient),
              psychologistName: storedUserName(),
              startsAt: startsAt.toISOString(),
              endsAt: endsAt.toISOString(),
            modality: formData.modality,
            officeName: formData.modality === "presencial" ? selectedOffice?.nombre : "",
            officeAddress: formData.modality === "presencial" ? officeAddress(selectedOffice) : "",
            amount: formData.amount ? Number(formData.amount) : null,
          },
          });
          emailNotice = `Correo enviado a ${selectedPatient.email}`;
        } catch (error) {
          console.warn("Appointment email could not be sent:", error);
          const message = error instanceof Error ? error.message : "No se pudo enviar el correo.";
          emailNotice = `La cita se guardó, pero no se pudo enviar el correo: ${message}`;
        }
      } else {
        emailNotice = "La cita se guardó. No se envió correo porque el paciente no tiene email registrado.";
      }

      toast.success(
        editMode
          ? "Cita actualizada"
          : totalOccurrences > 1
            ? `${totalOccurrences} citas semanales creadas exitosamente`
            : "Cita creada exitosamente"
      );
      if (emailNotice) {
        toast.info(emailNotice);
      }
      onSaved?.();
      onClose();
    } catch (error: any) {
      console.error("Save appointment error:", error);
      const message = String(error?.message || JSON.stringify(error) || error || "");
      localStorage.setItem("mindcare_last_appointment_error", message);
      if (message.includes("Límite mensual de citas")) {
        toast.error("Llegaste al límite mensual de citas de tu suscripción. Cambia de plan para agendar más.");
      } else if (message.includes("fuera de tu horario") || message.includes("dentro del horario configurado")) {
        toast.error(`No se pudo guardar: la cita queda fuera de tu horario (${describeWorkingHours(workingHours)}).`);
      } else if (message.includes("psicologo_configuracion") || message.includes("schema cache")) {
        toast.error("No se pudo guardar: falta actualizar la base de datos de configuración del psicólogo.");
      } else {
        toast.error(`No se pudo guardar la cita en la base de datos. ${message || ""}`.trim());
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{editMode ? "Editar Cita" : "Nueva Cita"}</DialogTitle>
          <DialogDescription>
            {editMode ? "Modifica los datos actuales de la cita" : "Agenda una cita con datos reales de Supabase"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente</Label>
            <Select
              value={formData.patient}
              onValueChange={(value) => {
                const selectedPatient = patients.find((patient) => patient.id === value);
                setFormData({
                  ...formData,
                  patient: value,
                  amount: getPatientFee(selectedPatient) || formData.amount,
                });
              }}
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
                onValueChange={updateStartTime}
                disabled={saving}
              >
                <SelectTrigger className="bg-input-background">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {startTimeSlots.map((time) => (
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
                onValueChange={updateDuration}
                disabled={saving}
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes < 60
                        ? `${minutes} minutos`
                        : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ""}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Hora fin</Label>
              <Select
                value={formData.endTime}
                onValueChange={updateEndTime}
                disabled={saving || !formData.time}
              >
                <SelectTrigger className="bg-input-background">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Fin" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots
                    .filter((time) => !formData.time || diffTimeMinutes(formData.time, time) >= 30)
                    .filter((time) => !formData.time || diffTimeMinutes(formData.time, time) <= 180)
                    .filter((time) => !formData.time || isWithinWorkingHours(formData.time, time, workingHours))
                    .map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!editMode && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="repeatWeekly" className="text-sm font-medium">
                    Repetir cada semana
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Crea esta cita en el mismo día y hora. Si una semana se cruza con otra cita, no se guarda la serie.
                  </p>
                </div>
                <Switch
                  id="repeatWeekly"
                  checked={repeatWeekly}
                  onCheckedChange={setRepeatWeekly}
                  disabled={saving}
                />
              </div>

              {repeatWeekly && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="repeatWeeks">Duración de la repetición</Label>
                  <Select value={repeatWeeks} onValueChange={setRepeatWeeks} disabled={saving}>
                    <SelectTrigger className="bg-input-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 semanas</SelectItem>
                      <SelectItem value="8">8 semanas</SelectItem>
                      <SelectItem value="12">12 semanas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modality">Modalidad</Label>
              <Select
                value={formData.modality}
                onValueChange={(value) => {
                  const nextOffice = value === "virtual"
                    ? ""
                    : formData.office || pickDefaultOffice(offices);
                  setFormData({ ...formData, modality: value, office: nextOffice });
                }}
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
                      {office.nombre} - {office.municipio}{office.es_principal ? " · Principal" : ""}
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
                  <SelectItem value="agendada">Agendada</SelectItem>
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
