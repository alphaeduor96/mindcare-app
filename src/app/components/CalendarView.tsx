import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIconLucide, List, Smartphone, Maximize2, Minimize2, Ban, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { AppointmentModal } from "./AppointmentModal";
import { AppointmentsList } from "./AppointmentsList";
import { CalendarWeekView } from "./CalendarWeekView";
import { CalendarMonthView } from "./CalendarMonthView";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import { resolvePsychologistProfileId, supabaseFunctionsBaseUrl, supabaseRest } from "../../services/api";
import { toast } from "sonner";
import {
  calendarColorsChangedEvent,
  getCalendarModalityColors,
  type CalendarModalityColors,
} from "../utils/calendarColors";
import {
  getCalendarHours,
  getWorkingHours,
  isWithinWorkingHours,
  normalizeTimeValue,
  saveWorkingHours,
  timeToMinutes,
  workingHoursChangedEvent,
  type WorkingHours,
} from "../utils/appointmentPreferences";

const HOUR_HEIGHT = 80;
const MIN_APPOINTMENT_DURATION = 30;
const MAX_APPOINTMENT_DURATION = 180;
const RESIZE_STEP_MINUTES = 5;

interface CalendarViewProps {
  currentPsychologistId?: string;
  psychologists: Array<{ id: string; name: string }>;
  patients: Array<{ id: string; name: string }>;
  defaultTab?: "calendar" | "list";
  openRequest?: {
    key: number;
    date: string;
    view: "day" | "week" | "month";
  } | null;
}

interface AppointmentRow {
  id: string;
  paciente_id: string;
  psicologo_id: string;
  inicia_at: string;
  termina_at: string;
  estado: string;
  fuente: "privado" | "red_mindcare";
  modalidad: "presencial" | "virtual";
  consultorio_id?: string | null;
  costo_centavos?: number | null;
  pacientes?: {
    nombre?: string | null;
    apellido?: string | null;
  } | null;
  consultorios?: {
    nombre?: string | null;
  } | null;
  pagos_cita?: Array<{
    id: string;
    monto_centavos: number;
    estado: string;
    pagado_at?: string | null;
    proveedor_pago?: string | null;
    referencia_externa?: string | null;
    ingreso_paciente_id?: string | null;
    ingresos_paciente?: {
      id: string;
      monto_centavos: number;
      fecha_pago: string;
      referencia?: string | null;
      estado?: string | null;
    } | null;
  }>;
}

interface BlockRow {
  id: string;
  titulo: string;
  motivo?: string | null;
  inicia_at: string;
  termina_at: string;
  color?: string | null;
}

export interface CalendarAppointment {
  id: string;
  patientId: string;
  psychologistId: string;
  patient: string;
  psychologist: string;
  date: Date;
  hour: number;
  minute: number;
  duration: number;
  color: string;
  source: "private" | "network";
  amount: number;
  company?: string;
  officeId?: string | null;
  office?: string;
  modality: "presencial" | "virtual";
  status: "scheduled" | "cancelled" | "no_show";
  paid: boolean;
  payments?: Array<{
    id: string;
    amountCents: number;
    paidAt?: string | null;
    provider?: string | null;
    reference?: string | null;
    incomeId?: string | null;
    incomeAmountCents?: number | null;
    incomeDate?: string | null;
    incomeReference?: string | null;
    incomeStatus?: string | null;
  }>;
}

interface CalendarBlock {
  id: string;
  title: string;
  reason?: string | null;
  date: Date;
  hour: number;
  minute: number;
  duration: number;
  color: string;
}

function sameDay(first: Date, second: Date) {
  return first.toDateString() === second.toDateString();
}

function startOfMonthRange(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonthRange(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function clampDuration(duration: number) {
  return Math.min(MAX_APPOINTMENT_DURATION, Math.max(MIN_APPOINTMENT_DURATION, duration));
}

function snapDuration(duration: number) {
  return clampDuration(Math.round(duration / RESIZE_STEP_MINUTES) * RESIZE_STEP_MINUTES);
}

function patientName(row: AppointmentRow) {
  return `${row.pacientes?.nombre || ""} ${row.pacientes?.apellido || ""}`.trim() || "Paciente sin nombre";
}

function mapStatus(status: string): CalendarAppointment["status"] {
  if (status === "cancelada") return "cancelled";
  if (status === "no_asistio") return "no_show";
  return "scheduled";
}

function mapAppointment(
  row: AppointmentRow,
  psychologistName: string,
  modalityColors: CalendarModalityColors
): CalendarAppointment {
  const startsAt = new Date(row.inicia_at);
  const endsAt = new Date(row.termina_at);
  const duration = Math.max(15, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));
  const isNetwork = row.fuente === "red_mindcare";

  return {
    id: row.id,
    patientId: row.paciente_id,
    psychologistId: row.psicologo_id,
    patient: patientName(row),
    psychologist: psychologistName,
    date: startsAt,
    hour: startsAt.getHours(),
    minute: startsAt.getMinutes(),
    duration,
    color: row.modalidad === "virtual" ? modalityColors.virtual : modalityColors.presencial,
    source: isNetwork ? "network" : "private",
    amount: Math.round((row.costo_centavos || 0) / 100),
    officeId: row.consultorio_id,
    office: row.consultorios?.nombre || (row.modalidad === "virtual" ? "Virtual" : isNetwork ? "Red MindCare" : "Sin consultorio"),
    modality: row.modalidad,
    status: mapStatus(row.estado),
    paid: row.pagos_cita?.some((payment) => payment.estado === "pagado") || false,
    payments: row.pagos_cita
      ?.filter((payment) => payment.estado === "pagado")
      .map((payment) => ({
        id: payment.id,
        amountCents: payment.monto_centavos,
        paidAt: payment.pagado_at,
        provider: payment.proveedor_pago,
        reference: payment.referencia_externa,
        incomeId: payment.ingreso_paciente_id,
        incomeAmountCents: payment.ingresos_paciente?.monto_centavos,
        incomeDate: payment.ingresos_paciente?.fecha_pago,
        incomeReference: payment.ingresos_paciente?.referencia,
        incomeStatus: payment.ingresos_paciente?.estado,
      })),
  };
}

function mapBlock(row: BlockRow): CalendarBlock {
  const startsAt = new Date(row.inicia_at);
  const endsAt = new Date(row.termina_at);

  return {
    id: row.id,
    title: row.titulo || "Horario bloqueado",
    reason: row.motivo,
    date: startsAt,
    hour: startsAt.getHours(),
    minute: startsAt.getMinutes(),
    duration: Math.max(15, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000)),
    color: row.color || "#94A3B8",
  };
}

function toTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function describeWorkingHours(workingHours: WorkingHours) {
  return `${workingHours.start} a ${workingHours.end}`;
}

function formatHour(hour: number) {
  const period = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00${period}`;
}

function formatHourRange(hour: number) {
  return `${formatHour(hour)}-${formatHour(hour + 1)}`;
}

export function CalendarView({ currentPsychologistId, psychologists, patients, defaultTab = "calendar", openRequest }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"calendar" | "list">(defaultTab);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("week");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [copyingFeed, setCopyingFeed] = useState(false);
  const [feedUrl, setFeedUrl] = useState("");
  const [modalityColors, setModalityColors] = useState(() => getCalendarModalityColors(currentPsychologistId));
  const [workingHours, setWorkingHours] = useState(() => getWorkingHours(currentPsychologistId));
  const [fullscreen, setFullscreen] = useState(false);
  const [draggedAppointment, setDraggedAppointment] = useState<CalendarAppointment | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockSelectionMode, setBlockSelectionMode] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockForm, setBlockForm] = useState({
    title: "Horario bloqueado",
    reason: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    duration: "60",
    color: "#94A3B8",
    repeatEvery: "none",
    repeatCount: "1",
  });
  const [resizeState, setResizeState] = useState<{
    appointment: CalendarAppointment;
    startY: number;
    initialDuration: number;
    previewDuration: number;
  } | null>(null);
  const resizeStateRef = useRef<typeof resizeState>(null);

  const psychologistName = psychologists.find((psychologist) => psychologist.id === currentPsychologistId)?.name || "Psicólogo";
  const hours = useMemo(() => getCalendarHours(workingHours), [workingHours]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!openRequest) return;
    setActiveTab("calendar");
    setCurrentDate(new Date(openRequest.date));
    setCalendarView(openRequest.view);
  }, [openRequest?.key]);

  useEffect(() => {
    resizeStateRef.current = resizeState;
  }, [resizeState]);

  useEffect(() => {
    if (!resizeState) return;

    const handleMouseMove = (event: MouseEvent) => {
      const current = resizeStateRef.current;
      if (!current) return;

      const deltaMinutes = ((event.clientY - current.startY) / HOUR_HEIGHT) * 60;
      const nextDuration = snapDuration(current.initialDuration + deltaMinutes);
      setResizeState({ ...current, previewDuration: nextDuration });
    };

    const handleMouseUp = async () => {
      const current = resizeStateRef.current;
      if (!current) return;

      setResizeState(null);

      if (current.previewDuration === current.appointment.duration) return;

      const endsAt = new Date(current.appointment.date.getTime() + current.previewDuration * 60000);

      if (!isWithinWorkingHours(toTimeValue(current.appointment.date), toTimeValue(endsAt), workingHours)) {
        toast.error(`La cita debe quedar dentro de tu horario: ${describeWorkingHours(workingHours)}.`);
        return;
      }

      try {
        await supabaseRest(`/citas?id=eq.${current.appointment.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ termina_at: endsAt.toISOString() }),
        });

        setAppointments((currentAppointments) =>
          currentAppointments.map((appointment) =>
            appointment.id === current.appointment.id
              ? { ...appointment, duration: current.previewDuration }
              : appointment
          )
        );
        toast.success(`Duración actualizada a ${current.previewDuration} minutos`);
      } catch (error) {
        console.error("Resize appointment error:", error);
        toast.error("No se pudo actualizar la duración de la cita.");
        setReloadKey((key) => key + 1);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizeState, workingHours]);

  useEffect(() => {
    setModalityColors(getCalendarModalityColors(currentPsychologistId));
    setWorkingHours(getWorkingHours(currentPsychologistId));
    let active = true;

    const handleColorsChanged = () => {
      setModalityColors(getCalendarModalityColors(currentPsychologistId));
    };

    const handleWorkingHoursChanged = () => {
      setWorkingHours(getWorkingHours(currentPsychologistId));
    };

    async function loadWorkingHoursFromDatabase() {
      try {
        const profileId = await resolvePsychologistProfileId(currentPsychologistId);
        if (!profileId) return;

        const rows = await supabaseRest<Array<{ horario_inicio: string; horario_cierre: string }>>(
          `/psicologo_configuracion?psicologo_id=eq.${profileId}&select=horario_inicio,horario_cierre&limit=1`
        );
        const row = rows[0];
        if (!active || !row) return;

        const nextWorkingHours = {
          start: normalizeTimeValue(row.horario_inicio) || getWorkingHours(currentPsychologistId).start,
          end: normalizeTimeValue(row.horario_cierre) || getWorkingHours(currentPsychologistId).end,
        };
        saveWorkingHours(currentPsychologistId, nextWorkingHours);
        setWorkingHours(nextWorkingHours);
      } catch (error) {
        console.warn("Calendar working hours unavailable:", error);
      }
    }

    window.addEventListener(calendarColorsChangedEvent, handleColorsChanged);
    window.addEventListener(workingHoursChangedEvent, handleWorkingHoursChanged);
    loadWorkingHoursFromDatabase();
    return () => {
      active = false;
      window.removeEventListener(calendarColorsChangedEvent, handleColorsChanged);
      window.removeEventListener(workingHoursChangedEvent, handleWorkingHoursChanged);
    };
  }, [currentPsychologistId]);

  useEffect(() => {
    let active = true;

    async function loadAppointments() {
      setLoading(true);
      setError("");

      try {
        const profileId = await resolvePsychologistProfileId(currentPsychologistId);

        if (!profileId) {
          setAppointments([]);
          return;
        }

        const rangeStart = startOfMonthRange(currentDate);
        const rangeEnd = endOfMonthRange(currentDate);
        const [rows, blockRows] = await Promise.all([
          supabaseRest<AppointmentRow[]>(
            `/citas?psicologo_id=eq.${profileId}&estado=neq.cancelada&inicia_at=gte.${rangeStart.toISOString()}&inicia_at=lt.${rangeEnd.toISOString()}&select=id,paciente_id,psicologo_id,inicia_at,termina_at,estado,fuente,modalidad,consultorio_id,costo_centavos,pacientes(nombre,apellido),consultorios(nombre),pagos_cita(id,monto_centavos,estado,pagado_at,proveedor_pago,referencia_externa,ingreso_paciente_id,ingresos_paciente(id,monto_centavos,fecha_pago,referencia,estado))&order=inicia_at.asc`
          ),
          supabaseRest<BlockRow[]>(
            `/bloqueos_horario?psicologo_id=eq.${profileId}&inicia_at=gte.${rangeStart.toISOString()}&inicia_at=lt.${rangeEnd.toISOString()}&select=id,titulo,motivo,inicia_at,termina_at,color&order=inicia_at.asc`
          ).catch((blockError) => {
            console.warn("Calendar blocks unavailable:", blockError);
            return [];
          }),
        ]);

        if (!active) return;
        setAppointments(rows.map((row) => mapAppointment(row, psychologistName, modalityColors)));
        setBlocks(blockRows.map(mapBlock));
      } catch (loadError: any) {
        if (!active) return;
        console.error("Calendar load error:", loadError);
        setError(`No se pudieron cargar las citas desde la base de datos. ${loadError?.message || ""}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAppointments();

    return () => {
      active = false;
    };
  }, [currentDate, currentPsychologistId, psychologistName, reloadKey, modalityColors]);

  const displayedAppointments = useMemo(
    () =>
      appointments.map((appointment) =>
        resizeState?.appointment.id === appointment.id
          ? { ...appointment, duration: resizeState.previewDuration }
          : appointment
      ),
    [appointments, resizeState]
  );

  const visibleTimedAppointments = useMemo(
    () =>
      displayedAppointments.filter((appointment) => {
        const endsAt = new Date(appointment.date.getTime() + appointment.duration * 60000);
        return isWithinWorkingHours(toTimeValue(appointment.date), toTimeValue(endsAt), workingHours);
      }),
    [displayedAppointments, workingHours]
  );

  const visibleTimedBlocks = useMemo(
    () =>
      blocks.filter((block) => {
        const startsAt = new Date(block.date);
        startsAt.setHours(block.hour, block.minute, 0, 0);
        const endsAt = new Date(startsAt.getTime() + block.duration * 60000);
        return isWithinWorkingHours(toTimeValue(startsAt), toTimeValue(endsAt), workingHours);
      }),
    [blocks, workingHours]
  );

  const dayAppointments = useMemo(
    () => visibleTimedAppointments.filter((appointment) => sameDay(appointment.date, currentDate)),
    [visibleTimedAppointments, currentDate]
  );

  const dayBlocks = useMemo(
    () => visibleTimedBlocks.filter((block) => sameDay(block.date, currentDate)),
    [visibleTimedBlocks, currentDate]
  );

  const handleAppointmentResizeStart = (appointment: CalendarAppointment, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setResizeState({
      appointment,
      startY: event.clientY,
      initialDuration: appointment.duration,
      previewDuration: appointment.duration,
    });
  };

  const moveAppointment = async (appointment: CalendarAppointment, targetDate: Date, targetHour: number) => {
    const startsAt = new Date(targetDate);
    startsAt.setHours(targetHour, appointment.minute, 0, 0);
    const endsAt = new Date(startsAt.getTime() + appointment.duration * 60000);

    if (!isWithinWorkingHours(toTimeValue(startsAt), toTimeValue(endsAt), workingHours)) {
      toast.error(`No puedes agendar fuera de tu horario: ${describeWorkingHours(workingHours)}.`);
      setDraggedAppointment(null);
      return;
    }

    try {
      await supabaseRest(`/citas?id=eq.${appointment.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          inicia_at: startsAt.toISOString(),
          termina_at: endsAt.toISOString(),
        }),
      });

      setAppointments((currentAppointments) =>
        currentAppointments.map((currentAppointment) =>
          currentAppointment.id === appointment.id
            ? {
                ...currentAppointment,
                date: startsAt,
                hour: startsAt.getHours(),
                minute: startsAt.getMinutes(),
              }
            : currentAppointment
        )
      );
      toast.success("Cita movida");
    } catch (error) {
      console.error("Move appointment error:", error);
      toast.error("No se pudo mover la cita.");
      setReloadKey((key) => key + 1);
    } finally {
      setDraggedAppointment(null);
    }
  };

  const handleAppointmentDrop = (targetDate: Date, targetHour: number) => {
    if (!draggedAppointment) return;
    moveAppointment(draggedAppointment, targetDate, targetHour);
  };

  const formatDate = (date: Date) => {
    if (calendarView === "month") {
      return format(date, "MMMM yyyy", { locale: es });
    } else if (calendarView === "week") {
      return format(date, "MMMM yyyy", { locale: es });
    }
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePrev = () => {
    if (calendarView === "day") {
      setCurrentDate(subDays(currentDate, 1));
    } else if (calendarView === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (calendarView === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (calendarView === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleTimeSlotClick = (hour: number) => {
    if (timeToMinutes(`${hour.toString().padStart(2, "0")}:00`) >= timeToMinutes(workingHours.end)) {
      toast.error(`No puedes iniciar una cita en el horario de cierre (${workingHours.end}).`);
      return;
    }

    if (blockSelectionMode) {
      openBlockModal(currentDate, hour);
      setBlockSelectionMode(false);
      return;
    }

    setSelectedDate(currentDate);
    setSelectedHour(hour);
    setIsModalOpen(true);
  };

  const handleWeekTimeSlotClick = (date: Date, hour: number) => {
    if (timeToMinutes(`${hour.toString().padStart(2, "0")}:00`) >= timeToMinutes(workingHours.end)) {
      toast.error(`No puedes iniciar una cita en el horario de cierre (${workingHours.end}).`);
      return;
    }

    if (blockSelectionMode) {
      openBlockModal(date, hour);
      setCurrentDate(date);
      setBlockSelectionMode(false);
      return;
    }

    setSelectedDate(date);
    setCurrentDate(date);
    setSelectedHour(hour);
    setIsModalOpen(true);
  };

  const handleMonthDayClick = (date: Date) => {
    if (blockSelectionMode) {
      const startHour = Math.floor(timeToMinutes(workingHours.start) / 60);
      openBlockModal(date, startHour);
      setCurrentDate(date);
      setBlockSelectionMode(false);
      return;
    }

    setCurrentDate(date);
    setCalendarView("day");
  };

  const closeBlockModal = () => {
    setBlockModalOpen(false);
    setEditingBlockId(null);
  };

  const openBlockModal = (date = currentDate, hour = 9) => {
    const startsAt = new Date(date);
    startsAt.setHours(hour, 0, 0, 0);
    setEditingBlockId(null);
    setBlockForm({
      title: "Horario bloqueado",
      reason: "",
      date: format(startsAt, "yyyy-MM-dd"),
      startTime: `${String(startsAt.getHours()).padStart(2, "0")}:00`,
      duration: "60",
      color: "#94A3B8",
      repeatEvery: "none",
      repeatCount: "1",
    });
    setBlockModalOpen(true);
  };

  const openBlockEditor = (block: CalendarBlock) => {
    const startsAt = new Date(block.date);
    startsAt.setHours(block.hour, block.minute, 0, 0);
    setCurrentDate(startsAt);
    setEditingBlockId(block.id);
    setBlockForm({
      title: block.title || "Horario bloqueado",
      reason: block.reason || "",
      date: format(startsAt, "yyyy-MM-dd"),
      startTime: `${String(startsAt.getHours()).padStart(2, "0")}:${String(startsAt.getMinutes()).padStart(2, "0")}`,
      duration: String(block.duration || 60),
      color: block.color || "#94A3B8",
      repeatEvery: "none",
      repeatCount: "1",
    });
    setBlockModalOpen(true);
  };

  const buildBlockOccurrences = (startsAt: Date, endsAt: Date) => {
    const step = blockForm.repeatEvery;
    const count = step === "none" ? 1 : Math.max(1, Math.min(Number(blockForm.repeatCount || 1), 365));

    return Array.from({ length: count }, (_, index) => {
      const nextStartsAt =
        step === "daily"
          ? addDays(startsAt, index)
          : step === "weekly"
            ? addWeeks(startsAt, index)
            : startsAt;
      const duration = endsAt.getTime() - startsAt.getTime();
      return {
        startsAt: nextStartsAt,
        endsAt: new Date(nextStartsAt.getTime() + duration),
      };
    });
  };

  const handleSaveBlock = async () => {
    setBlockSaving(true);

    try {
      const profileId = await resolvePsychologistProfileId(currentPsychologistId);

      if (!profileId) {
        toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
        return;
      }

      const [year, month, day] = blockForm.date.split("-").map(Number);
      const [hour, minute] = blockForm.startTime.split(":").map(Number);
      const startsAt = new Date(year, month - 1, day, hour, minute || 0, 0, 0);
      const endsAt = new Date(startsAt.getTime() + Number(blockForm.duration || 60) * 60000);

      const blockPayload = {
        titulo: blockForm.title || "Horario bloqueado",
        motivo: blockForm.reason || null,
        inicia_at: startsAt.toISOString(),
        termina_at: endsAt.toISOString(),
        color: blockForm.color,
      };

      if (editingBlockId) {
        await supabaseRest(`/bloqueos_horario?id=eq.${editingBlockId}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(blockPayload),
        });

        toast.success("Bloqueo actualizado");
        closeBlockModal();
        setReloadKey((key) => key + 1);
        return;
      }

      const occurrences = buildBlockOccurrences(startsAt, endsAt);

      await supabaseRest("/bloqueos_horario", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(occurrences.map((occurrence) => ({
          psicologo_id: profileId,
          titulo: blockPayload.titulo,
          motivo: blockPayload.motivo,
          inicia_at: occurrence.startsAt.toISOString(),
          termina_at: occurrence.endsAt.toISOString(),
          color: blockPayload.color,
        }))),
      });

      toast.success(occurrences.length > 1 ? `${occurrences.length} bloqueos creados` : "Horario bloqueado");
      closeBlockModal();
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Save block error:", error);
      toast.error("No se pudo bloquear el horario. Ejecuta primero CALENDAR_BLOCKS_SETUP.sql en Supabase.");
    } finally {
      setBlockSaving(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!editingBlockId) return;
    setBlockSaving(true);

    try {
      await supabaseRest(`/bloqueos_horario?id=eq.${editingBlockId}`, {
        method: "DELETE",
      });
      toast.success("Bloqueo eliminado");
      closeBlockModal();
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Delete block error:", error);
      toast.error("No se pudo eliminar el bloqueo.");
    } finally {
      setBlockSaving(false);
    }
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment({
      ...appointment,
      time:
        appointment.time ||
        `${appointment.hour}:${appointment.minute.toString().padStart(2, "0")}`,
    });
    setDetailModalOpen(true);
  };

  const handleCopyCalendarFeed = async () => {
    setCopyingFeed(true);

    try {
      const profileId = await resolvePsychologistProfileId(currentPsychologistId);

      if (!profileId) {
        toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
        return;
      }

      let feeds = await supabaseRest<Array<{ token: string }>>(
        `/calendar_feeds?psicologo_id=eq.${profileId}&select=token&limit=1`
      );

      if (feeds.length === 0) {
        feeds = await supabaseRest<Array<{ token: string }>>("/calendar_feeds", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ psicologo_id: profileId }),
        });
      }

      const token = feeds[0]?.token;
      if (!token) throw new Error("No se pudo generar el token del calendario.");

      const nextFeedUrl = `${supabaseFunctionsBaseUrl}/calendar-feed?token=${token}`;
      setFeedUrl(nextFeedUrl);

      try {
        await navigator.clipboard.writeText(nextFeedUrl);
        toast.success("Enlace del feed iCal copiado");
      } catch (clipboardError) {
        console.warn("Clipboard blocked:", clipboardError);
        toast.info("No se pudo copiar automáticamente. Copia el enlace de la ventana.");
      }
    } catch (error: any) {
      console.error("Calendar feed error:", error);
      toast.error(`No se pudo generar el feed iCal. ${error?.message || ""}`);
    } finally {
      setCopyingFeed(false);
    }
  };

  return (
    <div className={fullscreen ? "fixed inset-0 z-[70] overflow-auto bg-background p-6" : "space-y-6"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Gestión de Citas</h1>
          <p className="text-muted-foreground">
            Visualiza y administra todas las citas programadas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={blockSelectionMode ? "secondary" : "outline"}
            className="gap-2"
            onClick={() => {
              setBlockSelectionMode((active) => {
                const nextActive = !active;
                toast.info(nextActive ? "Selecciona una celda del calendario para bloquearla." : "Modo bloqueo desactivado.");
                return nextActive;
              });
            }}
          >
            <Ban className="w-4 h-4" />
            {blockSelectionMode ? "Selecciona horario" : "Bloquear horario"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleCopyCalendarFeed} disabled={copyingFeed}>
            <Smartphone className="w-4 h-4" />
            {copyingFeed ? "Generando..." : "Agregar calendario"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setFullscreen((value) => !value)}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={() => {
              setSelectedDate(currentDate);
              setSelectedHour(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "calendar" | "list")} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIconLucide className="w-4 h-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="w-4 h-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          {/* Calendar Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground capitalize">{formatDate(currentDate)}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* View selector */}
              <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                <Button
                  variant={calendarView === "day" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarView("day")}
                >
                  Día
                </Button>
                <Button
                  variant={calendarView === "week" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarView("week")}
                >
                  Semana
                </Button>
                <Button
                  variant={calendarView === "month" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarView("month")}
                >
                  Mes
                </Button>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleToday}>
                Hoy
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Views */}
          {calendarView === "week" && (
            <CalendarWeekView
              currentDate={currentDate}
              appointments={visibleTimedAppointments}
              blocks={visibleTimedBlocks}
              hours={hours}
              onTimeSlotClick={handleWeekTimeSlotClick}
              onAppointmentClick={handleAppointmentClick}
              onBlockClick={openBlockEditor}
              onAppointmentResizeStart={handleAppointmentResizeStart}
              onAppointmentDragStart={setDraggedAppointment}
              onAppointmentDrop={handleAppointmentDrop}
            />
          )}

          {calendarView === "month" && (
            <CalendarMonthView
              currentDate={currentDate}
              appointments={displayedAppointments}
              onDayClick={handleMonthDayClick}
              modalityColors={modalityColors}
            />
          )}

          {/* Calendar Grid - Day View */}
          {calendarView === "day" && (
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* Time slots with minutes */}
                    <div className="relative">
                      {hours.map((hour) => {
                        return (
                          <div
                            key={hour}
                            className="flex border-b border-border hover:bg-accent/30 transition-colors cursor-pointer"
                            onClick={() => handleTimeSlotClick(hour)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              handleAppointmentDrop(currentDate, hour);
                            }}
                            style={{ height: "80px" }}
                          >
                            {/* Time label */}
                            <div className="w-36 p-4 border-r border-border flex-shrink-0">
                              <span className="text-sm text-muted-foreground">
                                {formatHourRange(hour)}
                              </span>
                            </div>

                            {/* Appointment area */}
                            <div className="flex-1 relative">
                              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                Click para agregar cita
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Appointments overlay */}
                      <div className="absolute top-0 left-36 right-0 bottom-0 pointer-events-none">
                        {dayBlocks.map((block) => {
                          const startMinutes = block.hour * 60 + block.minute;
                          const baseStartMinutes = hours[0] * 60;
                          const topPosition = ((startMinutes - baseStartMinutes) / 60) * HOUR_HEIGHT;
                          const height = (block.duration / 60) * HOUR_HEIGHT;

                          return (
                            <div
                              key={block.id}
                              className="absolute left-2 right-2 rounded-lg p-2 text-white shadow-sm opacity-80 pointer-events-auto cursor-pointer hover:opacity-95 hover:shadow-lg transition"
                              style={{
                                top: `${topPosition}px`,
                                height: `${Math.max(height, 35)}px`,
                                backgroundColor: block.color,
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                openBlockEditor(block);
                              }}
                            >
                              <p className="text-xs font-medium truncate">{block.title}</p>
                              {height > 45 ? <p className="text-[10px] opacity-90 truncate">{block.reason || "Bloqueado"}</p> : null}
                            </div>
                          );
                        })}
                        {dayAppointments.map((appointment) => {
                          const startMinutes = appointment.hour * 60 + appointment.minute;
                          const baseStartMinutes = hours[0] * 60;
                          const topPosition = ((startMinutes - baseStartMinutes) / 60) * 80;
                          const height = (appointment.duration / 60) * HOUR_HEIGHT;

                          // Check for overlapping appointments
                          const overlappingAppts = dayAppointments.filter((apt) => {
                            const aptStart = apt.hour * 60 + apt.minute;
                            const aptEnd = aptStart + apt.duration;
                            const currentStart = startMinutes;
                            const currentEnd = currentStart + appointment.duration;
                            return apt.id !== appointment.id && (
                              (aptStart >= currentStart && aptStart < currentEnd) ||
                              (aptEnd > currentStart && aptEnd <= currentEnd) ||
                              (aptStart <= currentStart && aptEnd >= currentEnd)
                            );
                          });

                          const overlapIndex = overlappingAppts.findIndex(apt => apt.id < appointment.id);
                          const totalOverlaps = overlappingAppts.length + 1;
                          const width = totalOverlaps > 1 ? `${95 / totalOverlaps}%` : "calc(100% - 16px)";
                          const leftOffset = overlapIndex >= 0 ? `${(overlapIndex + 1) * (95 / totalOverlaps)}%` : "8px";

                          return (
                            <div
                              key={appointment.id}
                              draggable
                              className="absolute text-white rounded-lg p-2 shadow-md hover:shadow-xl hover:z-50 transition-all pointer-events-auto cursor-pointer border-2 border-white/20 group"
                              style={{
                                top: `${topPosition}px`,
                                height: `${Math.max(height, 35)}px`,
                                left: leftOffset,
                                width: width,
                                backgroundColor: appointment.color,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAppointmentClick({
                                  ...appointment,
                                  date: currentDate,
                                  time: `${appointment.hour}:${appointment.minute.toString().padStart(2, "0")}`,
                                });
                              }}
                              onDragStart={(event) => {
                                event.stopPropagation();
                                setDraggedAppointment(appointment);
                              }}
                              onDragEnd={() => setDraggedAppointment(null)}
                            >
                              <p className="text-xs font-medium truncate">{appointment.patient}</p>
                              {height > 45 && (
                                <p className="text-[10px] opacity-90 truncate">{appointment.psychologist}</p>
                              )}
                              {height > 60 && (
                                <p className="text-[10px] opacity-75 mt-1">
                                  {appointment.hour}:{appointment.minute.toString().padStart(2, "0")} • {appointment.duration}min
                                </p>
                              )}
                              <div
                                className="absolute left-2 right-2 bottom-1 h-2 cursor-ns-resize rounded-full bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Jala para ajustar duración"
                                onMouseDown={(event) => handleAppointmentResizeStart(appointment, event)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                {!loading && !error && dayAppointments.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground">
                    No hay citas registradas para este día.
                  </div>
                )}
                {loading && (
                  <div className="p-6 text-center text-muted-foreground">Cargando citas...</div>
                )}
                {error && (
                  <div className="p-6 text-center text-destructive">{error}</div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list">
          <AppointmentsList
            currentPsychologistId={currentPsychologistId}
            psychologists={psychologists}
            patients={patients}
            externalReloadKey={reloadKey}
          />
        </TabsContent>
      </Tabs>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDate(null);
          setSelectedHour(null);
        }}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        currentPsychologistId={currentPsychologistId}
        onSaved={() => setReloadKey((key) => key + 1)}
      />

      <AppointmentDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        currentPsychologistId={currentPsychologistId}
        onSaved={() => setReloadKey((key) => key + 1)}
      />

      <Dialog open={Boolean(feedUrl)} onOpenChange={(open) => !open && setFeedUrl("")}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar calendario a iOS / Android</DialogTitle>
            <DialogDescription>
              Copia este enlace y agrégalo como calendario por suscripción. No uses usuario ni contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={feedUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
              <Button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    .writeText(feedUrl)
                    .then(() => toast.success("Enlace copiado"))
                    .catch(() => toast.info("Selecciona el enlace y cópialo manualmente"));
                }}
              >
                Copiar enlace
              </Button>
            </div>

            <Tabs defaultValue="ios" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ios">iPhone</TabsTrigger>
                <TabsTrigger value="android">Android</TabsTrigger>
                <TabsTrigger value="mac">Mac</TabsTrigger>
              </TabsList>

              <TabsContent value="ios" className="space-y-3 text-sm text-muted-foreground">
                <p className="text-foreground">En iPhone o iPad:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Abre Configuración.</li>
                  <li>Entra a Apps, luego Calendario.</li>
                  <li>Toca Cuentas.</li>
                  <li>Toca Agregar cuenta.</li>
                  <li>Selecciona Otra.</li>
                  <li>Toca Agregar calendario suscrito.</li>
                  <li>Pega el enlace en Servidor.</li>
                  <li>Deja Usuario y Contraseña vacíos.</li>
                  <li>Toca Siguiente y luego Guardar.</li>
                </ol>
              </TabsContent>

              <TabsContent value="android" className="space-y-3 text-sm text-muted-foreground">
                <p className="text-foreground">En Android con Google Calendar:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Abre Google Calendar desde una computadora.</li>
                  <li>En el menú izquierdo, busca Otros calendarios.</li>
                  <li>Presiona el botón +.</li>
                  <li>Elige Desde URL.</li>
                  <li>Pega el enlace del calendario.</li>
                  <li>Presiona Agregar calendario.</li>
                  <li>Abre Google Calendar en Android y revisa que esa cuenta esté sincronizada.</li>
                </ol>
              </TabsContent>

              <TabsContent value="mac" className="space-y-3 text-sm text-muted-foreground">
                <p className="text-foreground">En Mac:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Abre la app Calendario.</li>
                  <li>Ve a Archivo.</li>
                  <li>Selecciona Nueva suscripción a calendario.</li>
                  <li>Pega el enlace.</li>
                  <li>Elige iCloud si quieres verlo también en iPhone.</li>
                  <li>Guarda la suscripción.</li>
                </ol>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={blockModalOpen}
        onOpenChange={(open) => {
          if (open) setBlockModalOpen(true);
          else closeBlockModal();
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingBlockId ? "Editar bloqueo" : "Bloquear horario"}</DialogTitle>
            <DialogDescription>
              {editingBlockId
                ? "Ajusta este espacio no disponible o elimínalo del calendario."
                : "Marca espacios no disponibles por comida, supervisión, vacaciones u otros factores."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-foreground">Título</label>
              <Input
                value={blockForm.title}
                onChange={(event) => setBlockForm({ ...blockForm, title: event.target.value })}
                placeholder="Ej. Comida, supervisión, trámite"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-foreground">Fecha</label>
                <Input
                  type="date"
                  value={blockForm.date}
                  onChange={(event) => setBlockForm({ ...blockForm, date: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground">Inicio</label>
                <Input
                  type="time"
                  step={300}
                  value={blockForm.startTime}
                  onChange={(event) => setBlockForm({ ...blockForm, startTime: event.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-foreground">Duración</label>
                <Input
                  type="number"
                  min={15}
                  step={5}
                  value={blockForm.duration}
                  onChange={(event) => setBlockForm({ ...blockForm, duration: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground">Color</label>
                <Input
                  type="color"
                  value={blockForm.color}
                  onChange={(event) => setBlockForm({ ...blockForm, color: event.target.value })}
                  className="h-10 cursor-pointer p-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-foreground">Repetir</label>
                <select
                  value={blockForm.repeatEvery}
                  disabled={Boolean(editingBlockId)}
                  onChange={(event) =>
                    setBlockForm({
                      ...blockForm,
                      repeatEvery: event.target.value,
                      repeatCount: event.target.value === "none" ? "1" : blockForm.repeatCount,
                    })
                  }
                  className="h-10 w-full rounded-md border border-input bg-input-background px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="none">Sin repetir</option>
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanalmente</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground">Veces</label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={blockForm.repeatCount}
                  disabled={blockForm.repeatEvery === "none" || Boolean(editingBlockId)}
                  onChange={(event) => setBlockForm({ ...blockForm, repeatCount: event.target.value })}
                />
              </div>
            </div>
            {editingBlockId ? (
              <p className="text-xs text-muted-foreground">
                La repetición solo aplica al crear bloqueos nuevos. Para una serie existente, edita o elimina cada bloqueo visible.
              </p>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm text-foreground">Motivo opcional</label>
              <Input
                value={blockForm.reason}
                onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value })}
                placeholder="Detalle interno del bloqueo"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {editingBlockId ? (
                  <Button variant="outline" onClick={handleDeleteBlock} disabled={blockSaving} className="gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </Button>
                ) : null}
              </div>
              <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeBlockModal} disabled={blockSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSaveBlock} disabled={blockSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {blockSaving ? "Guardando..." : editingBlockId ? "Guardar cambios" : "Guardar bloqueo"}
              </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
