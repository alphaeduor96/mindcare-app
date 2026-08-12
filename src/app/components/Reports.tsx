import { Fragment, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  UserRound,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

interface ReportsProps {
  userRole: "admin" | "psychologist";
  currentPsychologistId?: string;
}

interface PatientRow {
  id: string;
  nombre: string;
  apellido?: string | null;
  email?: string | null;
  telefono?: string | null;
}

interface PaymentRow {
  id: string;
  monto_centavos?: number | null;
  estado?: string | null;
  pagado_at?: string | null;
  created_at?: string | null;
}

interface AppointmentRow {
  id: string;
  paciente_id: string;
  inicia_at: string;
  termina_at?: string | null;
  estado?: string | null;
  modalidad?: string | null;
  costo_centavos?: number | null;
  motivo_consulta?: string | null;
  pagos_cita?: PaymentRow[];
  pacientes?: PatientRow | null;
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const ACTIVE_APPOINTMENT_STATUSES = ["solicitada", "agendada", "confirmada"];
const BILLABLE_STATUSES = ["solicitada", "agendada", "confirmada", "completada"];

function patientName(patient?: PatientRow | null) {
  if (!patient) return "Selecciona un paciente";
  return [patient.nombre, patient.apellido].filter(Boolean).join(" ");
}

function formatCurrency(cents = 0) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatTimeRange(appointment: AppointmentRow) {
  const start = new Date(appointment.inicia_at);
  const end = appointment.termina_at ? new Date(appointment.termina_at) : null;
  const timeFormatter = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!end) return timeFormatter.format(start);
  return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
}

function getPaidCents(appointment: AppointmentRow) {
  return (appointment.pagos_cita || [])
    .filter((payment) => payment.estado === "pagado")
    .reduce((total, payment) => total + (payment.monto_centavos || 0), 0);
}

function statusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    solicitada: "Solicitada",
    agendada: "Agendada",
    confirmada: "Confirmada",
    completada: "Completada",
    cancelada: "Cancelada",
  };

  return labels[status || ""] || "Sin estado";
}

function statusClass(status?: string | null) {
  if (status === "completada") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "confirmada") return "bg-primary/10 text-primary border-primary/20";
  if (status === "agendada") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "solicitada") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "cancelada") return "bg-red-50 text-red-700 border-red-200";
  return "bg-muted text-muted-foreground border-border";
}

function buildMonthRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

export function Reports({ userRole, currentPsychologistId }: ReportsProps) {
  const today = new Date();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [monthlyAppointments, setMonthlyAppointments] = useState<AppointmentRow[]>([]);
  const [expandedPatients, setExpandedPatients] = useState<string[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingMonthlySummary, setLoadingMonthlySummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId);

  const years = useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
  }, [today]);

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      if (userRole !== "psychologist") {
        setLoadingPatients(false);
        return;
      }

      setLoadingPatients(true);
      setError(null);

      try {
        const profileId = await resolvePsychologistProfileId(currentPsychologistId);

        if (!profileId) {
          throw new Error("Tu usuario aún no tiene un perfil de psicólogo vinculado.");
        }

        const rows = await supabaseRest<PatientRow[]>(
          `/pacientes?creado_por_psicologo_id=eq.${profileId}&select=id,nombre,apellido,email,telefono&order=nombre.asc`
        );

        if (cancelled) return;

        setPatients(rows);
        setSelectedPatientId((current) => current || rows[0]?.id || "");
      } catch (reportError: any) {
        if (!cancelled) {
          setError(reportError?.message || "No se pudieron cargar los pacientes.");
        }
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    }

    loadPatients();

    return () => {
      cancelled = true;
    };
  }, [currentPsychologistId, userRole]);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      if (userRole !== "psychologist" || !selectedPatientId) {
        setAppointments([]);
        return;
      }

      setLoadingReport(true);
      setError(null);

      try {
        const profileId = await resolvePsychologistProfileId(currentPsychologistId);

        if (!profileId) {
          throw new Error("Tu usuario aún no tiene un perfil de psicólogo vinculado.");
        }

        const { start, end } = buildMonthRange(selectedMonth, selectedYear);
        const rows = await supabaseRest<AppointmentRow[]>(
          `/citas?psicologo_id=eq.${profileId}&paciente_id=eq.${selectedPatientId}&inicia_at=gte.${start.toISOString()}&inicia_at=lt.${end.toISOString()}&select=id,paciente_id,inicia_at,termina_at,estado,modalidad,costo_centavos,motivo_consulta,pagos_cita(id,monto_centavos,estado,pagado_at,created_at)&order=inicia_at.desc`
        );

        if (!cancelled) setAppointments(rows);
      } catch (reportError: any) {
        if (!cancelled) {
          setError(reportError?.message || "No se pudo cargar el reporte del paciente.");
        }
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [currentPsychologistId, selectedMonth, selectedPatientId, selectedYear, userRole]);

  useEffect(() => {
    let cancelled = false;

    async function loadMonthlySummary() {
      if (userRole !== "psychologist") {
        setMonthlyAppointments([]);
        return;
      }

      setLoadingMonthlySummary(true);
      setError(null);

      try {
        const profileId = await resolvePsychologistProfileId(currentPsychologistId);

        if (!profileId) {
          throw new Error("Tu usuario aún no tiene un perfil de psicólogo vinculado.");
        }

        const { start, end } = buildMonthRange(selectedMonth, selectedYear);
        const rows = await supabaseRest<AppointmentRow[]>(
          `/citas?psicologo_id=eq.${profileId}&estado=in.(solicitada,agendada,confirmada,completada)&inicia_at=gte.${start.toISOString()}&inicia_at=lt.${end.toISOString()}&select=id,paciente_id,inicia_at,termina_at,estado,modalidad,costo_centavos,motivo_consulta,pacientes(id,nombre,apellido,email,telefono),pagos_cita(id,monto_centavos,estado,pagado_at,created_at)&order=inicia_at.asc`
        );

        if (!cancelled) setMonthlyAppointments(rows);
      } catch (reportError: any) {
        if (!cancelled) {
          setError(reportError?.message || "No se pudo cargar el resumen mensual.");
        }
      } finally {
        if (!cancelled) setLoadingMonthlySummary(false);
      }
    }

    loadMonthlySummary();

    return () => {
      cancelled = true;
    };
  }, [currentPsychologistId, selectedMonth, selectedYear, userRole]);

  const report = useMemo(() => {
    const billableAppointments = appointments.filter((appointment) =>
      BILLABLE_STATUSES.includes(appointment.estado || "")
    );
    const latestPayments = appointments
      .flatMap((appointment) =>
        (appointment.pagos_cita || [])
          .filter((payment) => payment.estado === "pagado")
          .map((payment) => ({ payment, appointment }))
      )
      .sort((first, second) => {
        const firstDate = first.payment.pagado_at || first.payment.created_at || first.appointment.inicia_at;
        const secondDate = second.payment.pagado_at || second.payment.created_at || second.appointment.inicia_at;
        return new Date(secondDate).getTime() - new Date(firstDate).getTime();
      })
      .slice(0, 5);
    const paidCents = appointments.reduce(
      (total, appointment) => total + getPaidCents(appointment),
      0
    );
    const billedCents = billableAppointments.reduce(
      (total, appointment) => total + (appointment.costo_centavos || 0),
      0
    );
    const scheduledAppointments = appointments.filter((appointment) =>
      ACTIVE_APPOINTMENT_STATUSES.includes(appointment.estado || "")
    );
    const completedAppointments = appointments.filter(
      (appointment) => appointment.estado === "completada"
    );

    return {
      billedCents,
      paidCents,
      owedCents: Math.max(0, billedCents - paidCents),
      scheduledAppointments,
      completedAppointments,
      latestPayments,
      appointmentsCount: appointments.length,
    };
  }, [appointments]);

  const monthlySummary = useMemo(() => {
    const grouped = new Map<string, {
      patient: PatientRow;
      appointments: AppointmentRow[];
      paidCents: number;
      totalCents: number;
      owedCents: number;
    }>();

    monthlyAppointments.forEach((appointment) => {
      const patient = appointment.pacientes || patients.find((item) => item.id === appointment.paciente_id);
      if (!patient) return;

      const current = grouped.get(patient.id) || {
        patient,
        appointments: [],
        paidCents: 0,
        totalCents: 0,
        owedCents: 0,
      };
      const appointmentTotal = appointment.costo_centavos || 0;
      const appointmentPaid = getPaidCents(appointment);

      current.appointments.push(appointment);
      current.paidCents += appointmentPaid;
      current.totalCents += appointmentTotal;
      current.owedCents += Math.max(0, appointmentTotal - appointmentPaid);

      grouped.set(patient.id, current);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      patientName(a.patient).localeCompare(patientName(b.patient), "es")
    );
  }, [monthlyAppointments, patients]);

  function toggleExpandedPatient(patientId: string) {
    setExpandedPatients((current) =>
      current.includes(patientId)
        ? current.filter((id) => id !== patientId)
        : [...current, patientId]
    );
  }

  if (userRole === "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground mb-1">Reportes</h1>
          <p className="text-muted-foreground">
            El reporte detallado por paciente está disponible en el panel del psicólogo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground mb-1">Reportes</h1>
        <p className="text-muted-foreground">
          Consulta deuda, pagos y actividad mensual por paciente.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm text-destructive">No se pudo cargar el reporte</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="paciente" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="paciente">Paciente</TabsTrigger>
          <TabsTrigger value="mensual">Resumen mensual</TabsTrigger>
        </TabsList>

      {loadingPatients ? (
        <Card className="border-border">
          <CardContent className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando pacientes...
          </CardContent>
        </Card>
      ) : patients.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <UserRound className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-foreground mb-1">Aún no tienes pacientes</h3>
            <p className="text-sm text-muted-foreground">
              Cuando registres pacientes y citas, aquí aparecerán sus reportes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <TabsContent value="paciente" className="space-y-6">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Paciente</p>
                  <Select
                    value={selectedPatientId}
                    onValueChange={setSelectedPatientId}
                    disabled={loadingPatients || patients.length === 0}
                  >
                    <SelectTrigger className="bg-input-background">
                      <SelectValue placeholder="Selecciona paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patientName(patient)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Mes</p>
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(value) => setSelectedMonth(Number(value))}
                  >
                    <SelectTrigger className="bg-input-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={month} value={String(index + 1)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Año</p>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(value) => setSelectedYear(Number(value))}
                  >
                    <SelectTrigger className="bg-input-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">Debe</p>
                  <DollarSign className="w-4 h-4 text-destructive" />
                </div>
                <p className="text-2xl text-foreground">{formatCurrency(report.owedCents)}</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">Ha pagado</p>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl text-foreground">{formatCurrency(report.paidCents)}</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">Citas agendadas</p>
                  <CalendarIcon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl text-foreground">{report.scheduledAppointments.length}</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">Consultas</p>
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl text-foreground">{report.completedAppointments.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="w-5 h-5 text-primary" />
                {patientName(selectedPatient)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Periodo</p>
                  <p className="text-foreground">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total generado</p>
                  <p className="text-foreground">{formatCurrency(report.billedCents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Citas del periodo</p>
                  <p className="text-foreground">{report.appointmentsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Últimos pagos</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingReport ? (
                  <div className="py-10 flex items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cargando reporte...
                  </div>
                ) : report.latestPayments.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No hay pagos registrados en este periodo.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pago</TableHead>
                        <TableHead>Cita</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.latestPayments.map(({ payment, appointment }) => (
                        <TableRow key={`${appointment.id}-${payment.id}`}>
                          <TableCell>
                            <div className="font-medium text-foreground">
                              {formatDateTime(payment.pagado_at || payment.created_at || appointment.inicia_at)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Pagado
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(appointment.inicia_at)} · {appointment.modalidad || "Presencial"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payment.monto_centavos || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Citas agendadas</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingReport ? (
                  <div className="py-10 flex items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cargando citas...
                  </div>
                ) : report.scheduledAppointments.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No hay citas pendientes o confirmadas en este periodo.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.scheduledAppointments.map((appointment) => {
                      const paidCents = getPaidCents(appointment);
                      const pendingCents = Math.max(0, (appointment.costo_centavos || 0) - paidCents);

                      return (
                        <div
                          key={appointment.id}
                          className="rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-primary" />
                              <p className="text-sm text-foreground">
                                {formatDateTime(appointment.inicia_at)}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {appointment.modalidad || "Presencial"} · {formatTimeRange(appointment)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={statusClass(appointment.estado)}>
                              {statusLabel(appointment.estado)}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm text-foreground">
                                {formatCurrency(appointment.costo_centavos || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Pendiente {formatCurrency(pendingCents)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          <TabsContent value="mensual" className="space-y-6">
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Mes</p>
                    <Select
                      value={String(selectedMonth)}
                      onValueChange={(value) => setSelectedMonth(Number(value))}
                    >
                      <SelectTrigger className="bg-input-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month, index) => (
                          <SelectItem key={month} value={String(index + 1)}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Año</p>
                    <Select
                      value={String(selectedYear)}
                      onValueChange={(value) => setSelectedYear(Number(value))}
                    >
                      <SelectTrigger className="bg-input-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Pacientes con citas del mes</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMonthlySummary ? (
                  <div className="py-10 flex items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cargando resumen mensual...
                  </div>
                ) : monthlySummary.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No hay pacientes con citas agendadas en {MONTHS[selectedMonth - 1]} {selectedYear}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Paciente</TableHead>
                          <TableHead className="text-right">Pagado</TableHead>
                          <TableHead className="text-right">Debe</TableHead>
                          <TableHead className="text-right">Total del mes</TableHead>
                          <TableHead className="text-right">Citas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlySummary.map((summary) => {
                          const isExpanded = expandedPatients.includes(summary.patient.id);

                          return (
                            <Fragment key={summary.patient.id}>
                              <TableRow
                                className="cursor-pointer hover:bg-accent/50"
                                onClick={() => toggleExpandedPatient(summary.patient.id)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    <div>
                                      <p className="font-medium text-foreground">
                                        {patientName(summary.patient)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {summary.patient.telefono || summary.patient.email || "Sin contacto"}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-primary">
                                  {formatCurrency(summary.paidCents)}
                                </TableCell>
                                <TableCell className="text-right text-destructive">
                                  {formatCurrency(summary.owedCents)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(summary.totalCents)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {summary.appointments.length}
                                </TableCell>
                              </TableRow>

                              {isExpanded && (
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                  <TableCell colSpan={5} className="p-0">
                                    <div className="p-4 space-y-3">
                                      {summary.appointments.map((appointment) => {
                                        const paidCents = getPaidCents(appointment);
                                        const totalCents = appointment.costo_centavos || 0;
                                        const owedCents = Math.max(0, totalCents - paidCents);

                                        return (
                                          <div
                                            key={appointment.id}
                                            className="rounded-lg border border-border bg-card p-4"
                                          >
                                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                                              <div>
                                                <p className="font-medium text-foreground capitalize">
                                                  {formatLongDate(appointment.inicia_at)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                  {formatTimeRange(appointment)} · {appointment.modalidad || "Presencial"}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                  {appointment.motivo_consulta || "Consulta"}
                                                </p>
                                              </div>

                                              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                                <Badge variant="outline" className={statusClass(appointment.estado)}>
                                                  {statusLabel(appointment.estado)}
                                                </Badge>
                                                <div className="grid grid-cols-3 gap-4 text-right text-sm">
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">Pagado</p>
                                                    <p className="text-primary">{formatCurrency(paidCents)}</p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">Debe</p>
                                                    <p className="text-destructive">{formatCurrency(owedCents)}</p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">Total</p>
                                                    <p className="text-foreground">{formatCurrency(totalCents)}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </>
      )}
      </Tabs>
    </div>
  );
}
