import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  UserRound,
  DollarSign,
  TrendingUp,
  Clock,
  XCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { OnboardingTour } from "./OnboardingTour";
import { supabaseRest } from "../../services/api";

const statusConfig = {
  confirmada: {
    label: "Agendada",
    color: "bg-blue-600 text-white",
    icon: Calendar,
  },
  agendada: {
    label: "Agendada",
    color: "bg-blue-600 text-white",
    icon: Calendar,
  },
  solicitada: {
    label: "Agendada",
    color: "bg-blue-600 text-white",
    icon: Calendar,
  },
  completada: {
    label: "Agendada",
    color: "bg-blue-600 text-white",
    icon: Calendar,
  },
  cancelada: {
    label: "Cancelada",
    color: "bg-destructive text-destructive-foreground",
    icon: XCircle,
  },
  no_asistio: {
    label: "No asistió",
    color: "bg-muted text-muted-foreground",
    icon: XCircle,
  },
};

const tourSteps = [
  {
    target: "[data-tour='stats']",
    title: "Panel de Métricas",
    content: "Aquí ves un resumen rápido de tus citas de hoy, pacientes activos e ingresos del mes con información conectada a la base de datos.",
    placement: "bottom" as const,
  },
  {
    target: "[data-tour='calendar']",
    title: "Agenda y Citas",
    content: "Desde Citas puedes trabajar en vista calendario o lista, crear/editar citas, cancelar sin borrar historial y sincronizar con iCal para iOS o Android.",
    placement: "bottom" as const,
  },
  {
    target: "[data-tour='patients']",
    title: "Gestión de Pacientes",
    content: "Crea pacientes, configura su tarifa base, datos fiscales, recordatorios por WhatsApp y consulta saldos, expediente, pagos e historial.",
    placement: "top" as const,
  },
  {
    target: "[data-tour='payments']",
    title: "Control de Pagos",
    content: "Registra ingresos, revisa pagos vinculados a citas y consulta saldos a favor o pendientes por paciente.",
    placement: "top" as const,
  },
  {
    target: "[data-tour='notifications']",
    title: "Accesos y pendientes",
    content: "Desde el panel puedes detectar actividad pendiente y moverte rápido a pacientes, agenda, pagos y reportes.",
    placement: "left" as const,
  },
  {
    target: "[data-tour='reports']",
    title: "Reportes y Análisis",
    content: "Consulta reportes por paciente o resumen mensual: cuánto ha pagado, cuánto debe y el desglose de citas del periodo.",
    placement: "top" as const,
  },
];

interface DashboardProps {
  currentUser: {
    id: string;
    nombre: string;
    apellido: string;
  };
  onOpenTodayCalendar?: () => void;
}

interface PsychologistProfile {
  id: string;
  usuario_id: string;
}

interface AppointmentRow {
  id: string;
  paciente_id: string;
  inicia_at: string;
  termina_at?: string | null;
  estado: keyof typeof statusConfig;
  modalidad?: "presencial" | "virtual";
  consultorios?: {
    nombre?: string | null;
  } | null;
  costo_centavos?: number | null;
}

const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const day = date.getDay() || 7;
  return startOfDay(addDays(date, 1 - day));
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function appointmentIncome(appointment: AppointmentRow) {
  return appointment.estado === "completada" ? appointment.costo_centavos || 0 : 0;
}

function patientName(appointment: AppointmentRow, patientNames: Record<string, string>) {
  return patientNames[appointment.paciente_id] || "Paciente sin nombre";
}

function timeLabel(date: string) {
  return new Date(date).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function appointmentTimeRange(appointment: AppointmentRow) {
  if (!appointment.termina_at) return timeLabel(appointment.inicia_at);
  return `${timeLabel(appointment.inicia_at)} - ${timeLabel(appointment.termina_at)}`;
}

function modalityLabel(modality?: AppointmentRow["modalidad"]) {
  return modality === "virtual" ? "En línea" : "Presencial";
}

export function Dashboard({ currentUser, onOpenTodayCalendar }: DashboardProps) {
  const [showTour, setShowTour] = useState(false);
  const [todayDialogOpen, setTodayDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [psychologist, setPsychologist] = useState<PsychologistProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if this is the user's first visit
    const hasSeenTour = localStorage.getItem("hasSeenDashboardTour");
    if (!hasSeenTour) {
      // Show tour after a short delay to allow components to render
      setTimeout(() => {
        setShowTour(true);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const profiles = await supabaseRest<PsychologistProfile[]>(
          `/psicologos?usuario_id=eq.${currentUser.id}&select=id,usuario_id&limit=1`
        );
        const profile = profiles[0] || null;

        if (!active) return;
        setPsychologist(profile);

        if (!profile) {
          setAppointments([]);
          return;
        }

        const now = new Date();
        const monthStart = startOfMonth(now);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const rows = await supabaseRest<AppointmentRow[]>(
          `/citas?psicologo_id=eq.${profile.id}&inicia_at=gte.${monthStart.toISOString()}&inicia_at=lt.${nextMonthStart.toISOString()}&select=id,paciente_id,inicia_at,termina_at,estado,modalidad,costo_centavos,consultorios(nombre)&order=inicia_at.asc`
        );

        const patientIds = Array.from(new Set(rows.map((row) => row.paciente_id)));
        if (patientIds.length > 0) {
          const patients = await supabaseRest<Array<{ id: string; nombre: string; apellido: string }>>(
            `/pacientes?id=in.(${patientIds.join(",")})&select=id,nombre,apellido`
          );
          const names = Object.fromEntries(
            patients.map((patient) => [
              patient.id,
              `${patient.nombre || ""} ${patient.apellido || ""}`.trim() || "Paciente sin nombre",
            ])
          );
          if (active) setPatientNames(names);
        } else if (active) {
          setPatientNames({});
        }

        if (!active) return;
        setAppointments(rows);
      } catch (loadError: any) {
        if (!active) return;
        console.error("Dashboard load error:", loadError);
        setError(`No se pudo cargar la información del panel desde la base de datos. ${loadError?.message || ""}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [currentUser.id]);

  const handleTourClose = () => {
    setShowTour(false);
    localStorage.setItem("hasSeenDashboardTour", "true");
  };

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = startOfWeek(now);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const thisMonthPatients = new Set(appointments.map((appointment) => appointment.paciente_id));
  const todayAppointments = appointments.filter((appointment) => {
    const startsAt = new Date(appointment.inicia_at);
    return startsAt >= todayStart && startsAt < tomorrowStart;
  }).sort((first, second) => new Date(first.inicia_at).getTime() - new Date(second.inicia_at).getTime());
  const completedAppointments = appointments.filter((appointment) => appointment.estado === "completada");
  const monthlyIncome = appointments.reduce((total, appointment) => total + appointmentIncome(appointment), 0);
  const weeklyData = weekDays.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = addDays(dayStart, 1);
    const dayAppointments = appointments.filter((appointment) => {
      const startsAt = new Date(appointment.inicia_at);
      return startsAt >= dayStart && startsAt < dayEnd;
    });

    return {
      day: dayLabels[day.getDay()],
      citas: dayAppointments.length,
      ingresos: dayAppointments.reduce((total, appointment) => total + appointmentIncome(appointment), 0) / 100,
    };
  });
  const upcomingAppointments = appointments
    .filter((appointment) => new Date(appointment.inicia_at) >= now)
    .slice(0, 5);
  const statsData = [
    {
      title: "Citas Hoy",
      value: String(todayAppointments.length),
      change: "Desde base de datos",
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pacientes del Mes",
      value: String(thisMonthPatients.size),
      change: "Con citas registradas",
      icon: UserRound,
      color: "text-[#81C784]",
      bgColor: "bg-[#81C784]/10",
    },
    {
      title: "Citas Completadas",
      value: String(completedAppointments.length),
      change: "Este mes",
      icon: Users,
      color: "text-[#4DD0E1]",
      bgColor: "bg-[#4DD0E1]/10",
    },
    {
      title: "Ingresos Mes",
      value: formatCurrency(monthlyIncome),
      change: "Pagos confirmados",
      icon: DollarSign,
      color: "text-[#66BB6A]",
      bgColor: "bg-[#66BB6A]/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showTour}
        onClose={handleTourClose}
        steps={tourSteps}
      />

      {/* Welcome Section */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-foreground mb-1">Bienvenido de vuelta, {currentUser.nombre}</h1>
          <p className="text-muted-foreground">
            Aquí está el resumen de tu actividad desde la base de datos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTour(true)}
            className="gap-2 border-[#7E57C2] text-[#7E57C2] hover:bg-[#7E57C2]/5"
          >
            <BookOpen className="w-4 h-4" />
            Ver Tutorial
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && !psychologist && (
        <Card className="border-border">
          <CardContent className="p-6 text-muted-foreground">
            Aún no encontramos un perfil profesional vinculado a tu cuenta. Completa el registro de psicólogo
            para que el panel pueda mostrar tus métricas reales de citas, pacientes y pagos.
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="stats">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`border-border hover:shadow-lg transition-shadow ${
                stat.title === "Citas Hoy" ? "cursor-pointer focus-within:ring-2 focus-within:ring-primary/40" : ""
              }`}
              role={stat.title === "Citas Hoy" ? "button" : undefined}
              tabIndex={stat.title === "Citas Hoy" ? 0 : undefined}
              onClick={stat.title === "Citas Hoy" ? () => setTodayDialogOpen(true) : undefined}
              onKeyDown={(event) => {
                if (stat.title !== "Citas Hoy") return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setTodayDialogOpen(true);
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl text-foreground">{loading ? "..." : stat.value}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                      {stat.title === "Citas Hoy" && !loading && (
                        <span className="ml-1 text-primary">Ver detalle</span>
                      )}
                    </div>
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={todayDialogOpen} onOpenChange={setTodayDialogOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Citas de hoy</DialogTitle>
            <DialogDescription>
              Resumen de pacientes, horarios y modalidad para el día de hoy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                Cargando citas...
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                No tienes citas agendadas para hoy.
              </div>
            ) : (
              todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{patientName(appointment, patientNames)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{appointmentTimeRange(appointment)}</p>
                    {appointment.consultorios?.nombre && (
                      <p className="mt-1 text-xs text-muted-foreground">{appointment.consultorios.nombre}</p>
                    )}
                  </div>
                  <Badge className={appointment.modalidad === "virtual" ? "bg-[#4DD0E1] text-white" : "bg-primary text-primary-foreground"}>
                    {modalityLabel(appointment.modalidad)}
                  </Badge>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTodayDialogOpen(false)}>
              Cerrar
            </Button>
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setTodayDialogOpen(false);
                onOpenTodayCalendar?.();
              }}
            >
              Abrir en calendario
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Chart */}
        <Card className="border-border" data-tour="calendar">
          <CardHeader>
            <CardTitle>Citas esta semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0F2F1" />
                <XAxis dataKey="day" stroke="#607D8B" />
                <YAxis stroke="#607D8B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E0F2F1",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  key="line-citas"
                  type="monotone"
                  dataKey="citas"
                  stroke="#4DB6AC"
                  strokeWidth={3}
                  dot={{ fill: "#4DB6AC", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Income Chart */}
        <Card className="border-border" data-tour="payments">
          <CardHeader>
            <CardTitle>Ingresos semanales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0F2F1" />
                <XAxis dataKey="day" stroke="#607D8B" />
                <YAxis stroke="#607D8B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E0F2F1",
                    borderRadius: "8px",
                  }}
                />
                <Bar key="bar-ingresos" dataKey="ingresos" fill="#66BB6A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card className="border-border" data-tour="patients">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Próximas Citas</CardTitle>
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!loading && upcomingAppointments.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                No tienes próximas citas registradas.
              </div>
            )}

            {loading && (
              <div className="text-center py-10 text-muted-foreground">Cargando citas...</div>
            )}

            {!loading && upcomingAppointments.map((appointment) => {
              const status = statusConfig[appointment.estado] || statusConfig.agendada;
              const StatusIcon = status.icon;
              const startsAt = new Date(appointment.inicia_at);
              
              return (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {patientName(appointment, patientNames).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-foreground mb-1">{patientName(appointment, patientNames)}</p>
                      <p className="text-sm text-muted-foreground">
                        {startsAt.toLocaleDateString("es-MX", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-foreground mb-1">
                        {startsAt.toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <Badge className={`${status.color} gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
