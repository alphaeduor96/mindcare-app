import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageSquare,
  RefreshCw,
  Send,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

interface ReminderCenterProps {
  currentPsychologistId?: string;
}

interface PaymentRow {
  id: string;
  estado: string;
  monto_centavos: number;
  pagado_at?: string | null;
}

interface PatientRow {
  id: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  metadata?: Record<string, any> | null;
}

interface AppointmentRow {
  id: string;
  paciente_id: string;
  inicia_at: string;
  termina_at: string;
  estado: "solicitada" | "agendada" | "confirmada" | "completada" | "cancelada" | "no_asistio";
  costo_centavos?: number | null;
  motivo_consulta?: string | null;
  pacientes?: PatientRow | null;
  pagos_cita?: PaymentRow[];
}

interface ReminderItem {
  id: string;
  audience: "patient" | "psychologist";
  type: "appointment_24h" | "payment_due" | "monthly_payment" | "psych_payment" | "status_update";
  priority: "alta" | "media" | "baja";
  title: string;
  message: string;
  dueAt: Date;
  patient?: PatientRow | null;
  appointment?: AppointmentRow;
  amountCents?: number | null;
}

function patientName(patient?: PatientRow | null) {
  if (!patient) return "Paciente sin nombre";
  return `${patient.nombre || ""} ${patient.apellido || ""}`.trim() || "Paciente sin nombre";
}

function currencyFromCents(cents?: number | null) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

function appointmentDateLabel(date: string) {
  return new Date(date).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hoursBetween(from: Date, to: Date) {
  return (to.getTime() - from.getTime()) / 36e5;
}

function hasPaidPayment(appointment: AppointmentRow) {
  return appointment.pagos_cita?.some((payment) => payment.estado === "pagado") || false;
}

function isMonthlyAdvancePatient(patient?: PatientRow | null) {
  const metadata = patient?.metadata || {};
  return Boolean(
    metadata.pago_mensual_anticipado
    || metadata.paga_mes_anticipado
    || metadata.pago_mensual
    || metadata.billing_mode === "mensual_anticipado"
  );
}

function priorityClass(priority: ReminderItem["priority"]) {
  if (priority === "alta") return "bg-destructive/10 text-destructive border-destructive/20";
  if (priority === "media") return "bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/20";
  return "bg-muted text-muted-foreground border-border";
}

function audienceClass(audience: ReminderItem["audience"]) {
  return audience === "patient"
    ? "bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/20"
    : "bg-[#7E57C2]/10 text-[#7E57C2] border-[#7E57C2]/20";
}

function typeIcon(type: ReminderItem["type"]) {
  if (type === "appointment_24h") return CalendarClock;
  if (type === "status_update") return Clock;
  if (type === "monthly_payment") return WalletCards;
  return CreditCard;
}

export function ReminderCenter({ currentPsychologistId }: ReminderCenterProps) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadReminders() {
      setLoading(true);
      setError("");

      try {
        const resolvedProfileId = await resolvePsychologistProfileId(currentPsychologistId);
        if (!resolvedProfileId) {
          setProfileId(null);
          setAppointments([]);
          return;
        }

        setProfileId(resolvedProfileId);

        const since = new Date();
        since.setDate(since.getDate() - 90);
        const until = new Date();
        until.setDate(until.getDate() + 30);

        const rows = await supabaseRest<AppointmentRow[]>(
          `/citas?psicologo_id=eq.${resolvedProfileId}&inicia_at=gte.${since.toISOString()}&inicia_at=lt.${until.toISOString()}&select=id,paciente_id,inicia_at,termina_at,estado,costo_centavos,motivo_consulta,pacientes(id,nombre,apellido,email,telefono,metadata),pagos_cita(id,estado,monto_centavos,pagado_at)&order=inicia_at.asc&limit=500`
        );

        if (!active) return;
        setAppointments(rows);
      } catch (loadError) {
        if (!active) return;
        console.error("Reminder center load error:", loadError);
        setError("No se pudieron calcular los recordatorios desde la base de datos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReminders();

    return () => {
      active = false;
    };
  }, [currentPsychologistId, reloadKey]);

  const reminders = useMemo<ReminderItem[]>(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const generated: ReminderItem[] = [];

    appointments.forEach((appointment) => {
      const patient = appointment.pacientes;
      const startsAt = new Date(appointment.inicia_at);
      const endsAt = new Date(appointment.termina_at);
      const hoursUntilStart = hoursBetween(now, startsAt);
      const hoursSinceEnd = hoursBetween(endsAt, now);
      const isPaid = hasPaidPayment(appointment);
      const amount = appointment.costo_centavos || appointment.pagos_cita?.[0]?.monto_centavos || null;

      if (
        hoursUntilStart > 0
        && hoursUntilStart <= 24
        && ["agendada", "confirmada"].includes(appointment.estado)
      ) {
        generated.push({
          id: `patient-appointment-24h-${appointment.id}`,
          audience: "patient",
          type: "appointment_24h",
          priority: hoursUntilStart <= 4 ? "alta" : "media",
          title: "Recordatorio de cita 24h",
          message: `Hola ${patientName(patient)}, te recordamos tu cita de terapia el ${appointmentDateLabel(appointment.inicia_at)}.`,
          dueAt: new Date(startsAt.getTime() - 24 * 60 * 60 * 1000),
          patient,
          appointment,
        });
      }

      if (appointment.estado === "completada" && !isPaid) {
        generated.push({
          id: `patient-payment-due-${appointment.id}`,
          audience: "patient",
          type: "payment_due",
          priority: "alta",
          title: "Pago pendiente de sesión",
          message: `Hola ${patientName(patient)}, tienes pendiente el pago de tu sesión del ${appointmentDateLabel(appointment.inicia_at)}${amount ? ` por ${currencyFromCents(amount)}` : ""}.`,
          dueAt: now,
          patient,
          appointment,
          amountCents: amount,
        });

        generated.push({
          id: `psych-payment-due-${appointment.id}`,
          audience: "psychologist",
          type: "psych_payment",
          priority: "alta",
          title: "Sesión completada sin pago",
          message: `${patientName(patient)} tiene una sesión completada sin pago registrado (${appointmentDateLabel(appointment.inicia_at)}).`,
          dueAt: now,
          patient,
          appointment,
          amountCents: amount,
        });
      }

      if (
        hoursSinceEnd >= 24
        && ["solicitada", "agendada", "confirmada"].includes(appointment.estado)
      ) {
        generated.push({
          id: `psych-status-update-${appointment.id}`,
          audience: "psychologist",
          type: "status_update",
          priority: "media",
          title: "Actualizar estatus de cita",
          message: `La cita de ${patientName(patient)} fue hace más de un día y sigue como "${appointment.estado}".`,
          dueAt: now,
          patient,
          appointment,
        });
      }
    });

    const patientsById = new Map<string, PatientRow>();
    appointments.forEach((appointment) => {
      if (appointment.pacientes) patientsById.set(appointment.pacientes.id, appointment.pacientes);
    });

    patientsById.forEach((patient) => {
      const patientAppointmentsThisMonth = appointments.filter((appointment) => {
        const startsAt = new Date(appointment.inicia_at);
        return appointment.paciente_id === patient.id && startsAt >= monthStart && startsAt < monthEnd;
      });
      const hasCurrentMonthPayment = patientAppointmentsThisMonth.some(hasPaidPayment);

      if (isMonthlyAdvancePatient(patient) && !hasCurrentMonthPayment && now.getDate() <= 7) {
        generated.push({
          id: `patient-monthly-payment-${patient.id}-${monthStart.toISOString()}`,
          audience: "patient",
          type: "monthly_payment",
          priority: "media",
          title: "Pago mensual anticipado",
          message: `Hola ${patientName(patient)}, inicia un nuevo mes y está pendiente tu pago mensual anticipado.`,
          dueAt: monthStart,
          patient,
        });
      }
    });

    return generated.sort((a, b) => {
      const priorityOrder = { alta: 0, media: 1, baja: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || a.dueAt.getTime() - b.dueAt.getTime();
    });
  }, [appointments]);

  const patientReminders = reminders.filter((reminder) => reminder.audience === "patient");
  const psychologistReminders = reminders.filter((reminder) => reminder.audience === "psychologist");
  const highPriority = reminders.filter((reminder) => reminder.priority === "alta").length;

  const ruleCards = [
    {
      title: "Cita 24h antes",
      audience: "Paciente",
      count: reminders.filter((reminder) => reminder.type === "appointment_24h").length,
      icon: CalendarClock,
      description: "Detecta citas confirmadas o agendadas dentro de las próximas 24 horas.",
    },
    {
      title: "Pago de cita pendiente",
      audience: "Paciente",
      count: reminders.filter((reminder) => reminder.type === "payment_due").length,
      icon: CreditCard,
      description: "Detecta sesiones completadas sin pago registrado.",
    },
    {
      title: "Pago mensual anticipado",
      audience: "Paciente",
      count: reminders.filter((reminder) => reminder.type === "monthly_payment").length,
      icon: WalletCards,
      description: "Usa la configuración mensual del paciente para recordar el pago al iniciar el mes.",
    },
    {
      title: "Sesiones sin cobrar",
      audience: "Psicóloga",
      count: reminders.filter((reminder) => reminder.type === "psych_payment").length,
      icon: AlertTriangle,
      description: "Lista sesiones completadas que aún no tienen pago.",
    },
    {
      title: "Estatus sin actualizar",
      audience: "Psicóloga",
      count: reminders.filter((reminder) => reminder.type === "status_update").length,
      icon: Clock,
      description: "Detecta citas pasadas hace más de un día que no se marcaron como completadas.",
    },
  ];

  const handleSendPreview = (reminder: ReminderItem) => {
    toast.info(`Twilio aún no está conectado. Mensaje listo: ${reminder.title}`);
  };

  const renderReminder = (reminder: ReminderItem) => {
    const Icon = typeIcon(reminder.type);

    return (
      <Card key={reminder.id} className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={audienceClass(reminder.audience)}>
                  {reminder.audience === "patient" ? "Paciente" : "Psicóloga"}
                </Badge>
                <Badge variant="outline" className={priorityClass(reminder.priority)}>
                  {reminder.priority}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon className="w-3.5 h-3.5" />
                  {reminder.appointment ? appointmentDateLabel(reminder.appointment.inicia_at) : "Mensual"}
                </span>
              </div>

              <div>
                <h3 className="text-foreground">{reminder.title}</h3>
                <p className="text-sm text-muted-foreground">{reminder.message}</p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {reminder.patient && (
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="w-3.5 h-3.5" />
                    {patientName(reminder.patient)}
                  </span>
                )}
                {reminder.patient?.telefono && (
                  <span>{reminder.patient.telefono}</span>
                )}
                {reminder.amountCents ? <span>{currencyFromCents(reminder.amountCents)}</span> : null}
              </div>
            </div>

            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleSendPreview(reminder)}>
              <Send className="w-4 h-4" />
              Preparar envío
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-foreground mb-2">Recordatorios</h1>
          <p className="text-muted-foreground">
            Centro inteligente para detectar avisos a pacientes y tareas pendientes de la psicóloga.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setReloadKey((key) => key + 1)} disabled={loading}>
          <RefreshCw className="w-4 h-4" />
          Recalcular
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Total detectados</p>
            <p className="text-3xl text-foreground">{loading ? "..." : reminders.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Para pacientes</p>
            <p className="text-3xl text-[#4DB6AC]">{loading ? "..." : patientReminders.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Para psicóloga</p>
            <p className="text-3xl text-[#7E57C2]">{loading ? "..." : psychologistReminders.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Prioridad alta</p>
            <p className="text-3xl text-destructive">{loading ? "..." : highPriority}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-primary" />
                Reglas activas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ruleCards.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div key={rule.title} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <p className="text-sm text-foreground">{rule.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      </div>
                      <Badge variant="outline">{rule.count}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{rule.audience}</span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#66BB6A]" />
                        Lista para Twilio
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-foreground">Canal de envío</p>
                  <p className="text-xs text-muted-foreground">
                    Esta interfaz ya prepara mensajes. El siguiente paso será guardar plantillas y conectar Twilio para WhatsApp/SMS.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Para pacientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Calculando recordatorios...</div>
              ) : patientReminders.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No hay recordatorios de pacientes pendientes.
                </div>
              ) : (
                patientReminders.map(renderReminder)
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Para psicóloga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Calculando tareas...</div>
              ) : psychologistReminders.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No hay tareas clínicas o de cobro pendientes.
                </div>
              ) : (
                psychologistReminders.map(renderReminder)
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
