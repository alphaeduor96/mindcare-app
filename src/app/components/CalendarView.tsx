import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIconLucide, List, Smartphone } from "lucide-react";
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

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

interface CalendarViewProps {
  currentPsychologistId?: string;
  psychologists: Array<{ id: string; name: string }>;
  patients: Array<{ id: string; name: string }>;
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
    estado: string;
  }>;
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
  status: "confirmed" | "pending" | "cancelled";
  paid: boolean;
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

function patientName(row: AppointmentRow) {
  return `${row.pacientes?.nombre || ""} ${row.pacientes?.apellido || ""}`.trim() || "Paciente sin nombre";
}

function mapStatus(status: string): CalendarAppointment["status"] {
  if (status === "cancelada" || status === "no_asistio") return "cancelled";
  if (status === "solicitada") return "pending";
  return "confirmed";
}

function mapAppointment(row: AppointmentRow, psychologistName: string): CalendarAppointment {
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
    color: isNetwork ? "bg-[#81C784]" : "bg-[#4DB6AC]",
    source: isNetwork ? "network" : "private",
    amount: Math.round((row.costo_centavos || 0) / 100),
    officeId: row.consultorio_id,
    office: row.consultorios?.nombre || (row.modalidad === "virtual" ? "Virtual" : isNetwork ? "Red MindCare" : "Sin consultorio"),
    modality: row.modalidad,
    status: mapStatus(row.estado),
    paid: row.pagos_cita?.some((payment) => payment.estado === "pagado") || false,
  };
}

export function CalendarView({ currentPsychologistId, psychologists, patients }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("week");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [copyingFeed, setCopyingFeed] = useState(false);
  const [feedUrl, setFeedUrl] = useState("");

  const psychologistName = psychologists.find((psychologist) => psychologist.id === currentPsychologistId)?.name || "Psicólogo";

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
        const rows = await supabaseRest<AppointmentRow[]>(
          `/citas?psicologo_id=eq.${profileId}&estado=neq.cancelada&inicia_at=gte.${rangeStart.toISOString()}&inicia_at=lt.${rangeEnd.toISOString()}&select=id,paciente_id,psicologo_id,inicia_at,termina_at,estado,fuente,modalidad,consultorio_id,costo_centavos,pacientes(nombre,apellido),consultorios(nombre)&order=inicia_at.asc`
        );

        if (!active) return;
        setAppointments(rows.map((row) => mapAppointment(row, psychologistName)));
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
  }, [currentDate, currentPsychologistId, psychologistName, reloadKey]);

  const dayAppointments = useMemo(
    () => appointments.filter((appointment) => sameDay(appointment.date, currentDate)),
    [appointments, currentDate]
  );

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
    setSelectedHour(hour);
    setIsModalOpen(true);
  };

  const handleWeekTimeSlotClick = (date: Date, hour: number) => {
    setCurrentDate(date);
    setSelectedHour(hour);
    setIsModalOpen(true);
  };

  const handleMonthDayClick = (date: Date) => {
    setCurrentDate(date);
    setCalendarView("day");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Gestión de Citas</h1>
          <p className="text-muted-foreground">
            Visualiza y administra todas las citas programadas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleCopyCalendarFeed} disabled={copyingFeed}>
            <Smartphone className="w-4 h-4" />
            {copyingFeed ? "Generando..." : "Agregar calendario"}
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={() => {
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
      <Tabs defaultValue="calendar" className="space-y-6">
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
              appointments={appointments}
              onTimeSlotClick={handleWeekTimeSlotClick}
              onAppointmentClick={handleAppointmentClick}
            />
          )}

          {calendarView === "month" && (
            <CalendarMonthView
              currentDate={currentDate}
              appointments={appointments}
              onDayClick={handleMonthDayClick}
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
                        const isAfternoon = hour >= 12;
                        const displayHour = isAfternoon && hour > 12 ? hour - 12 : hour;
                        const period = isAfternoon ? "PM" : "AM";

                        return (
                          <div
                            key={hour}
                            className="flex border-b border-border hover:bg-accent/30 transition-colors cursor-pointer"
                            onClick={() => handleTimeSlotClick(hour)}
                            style={{ height: "80px" }}
                          >
                            {/* Time label */}
                            <div className="w-24 p-4 border-r border-border flex-shrink-0">
                              <span className="text-sm text-muted-foreground">
                                {displayHour}:00 {period}
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
                      <div className="absolute top-0 left-24 right-0 bottom-0 pointer-events-none">
                        {dayAppointments.map((appointment) => {
                          const startMinutes = appointment.hour * 60 + appointment.minute;
                          const baseStartMinutes = hours[0] * 60;
                          const topPosition = ((startMinutes - baseStartMinutes) / 60) * 80;
                          const height = (appointment.duration / 60) * 80;

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
                              className={`absolute ${appointment.color} text-white rounded-lg p-2 shadow-md hover:shadow-xl hover:z-50 transition-all pointer-events-auto cursor-pointer border-2 border-white/20`}
                              style={{
                                top: `${topPosition}px`,
                                height: `${Math.max(height, 35)}px`,
                                left: leftOffset,
                                width: width,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAppointmentClick({
                                  ...appointment,
                                  date: currentDate,
                                  time: `${appointment.hour}:${appointment.minute.toString().padStart(2, "0")}`,
                                });
                              }}
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
          />
        </TabsContent>
      </Tabs>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedHour(null);
        }}
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
    </div>
  );
}
