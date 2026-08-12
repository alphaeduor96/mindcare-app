import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Mail, Phone, Edit, Eye, FileText, Building2, CalendarDays, Wallet, Activity, MessageCircle, AlertCircle, Receipt, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { AddPatientModal } from "./AddPatientModal";
import { SearchablePatientPicker } from "./SearchablePatientPicker";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

interface PatientsListProps {
  currentPsychologistId?: string;
  psychologists: Array<{ id: string; name: string }>;
}

 interface PatientRow {
  id: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  creado_por_psicologo_id?: string | null;
  fuente: "privado" | "red_mindcare";
  estado: "activo" | "inactivo" | "pendiente" | "suspendido";
  created_at: string;
  metadata?: Record<string, any> | null;
  empleados?: {
    numero_empleado?: string | null;
  } | null;
}

interface PatientItem {
  id: string;
  name: string;
  age: string;
  email: string;
  phone: string;
  psychologist: string;
  lastVisit?: string;
  totalSessions: number;
  yearAppointments: number;
  weeklySessions: number;
  incomeCents: number;
  overdueDebtCents: number;
  creditBalanceCents: number;
  netBalanceCents: number;
  balanceDetails: Array<{
    id: string;
    date: string;
    status: string;
    costCents: number;
    paidCents: number;
    pendingCents: number;
  }>;
  recordEntries: number;
  status: "active" | "inactive";
  avatar: string;
  source: "private" | "network";
  company?: string;
  employeeId?: string;
  createdAt: string;
  sessionFeeCents?: number | null;
  notes?: string | null;
  whatsappReminders: {
    confirmation: boolean;
    appointment: boolean;
    payment: boolean;
  };
  original: PatientRow;
}

interface PatientAppointmentRow {
  id: string;
  paciente_id: string;
  inicia_at: string;
  estado: string;
  costo_centavos?: number | null;
  pagos_cita?: Array<{
    monto_centavos?: number | null;
    estado?: string | null;
  }> | null;
}

interface PatientRecordRow {
  id: string;
  paciente_id: string;
  fecha_clinica?: string | null;
}

interface PatientBalanceRow {
  paciente_id: string;
  saldo_centavos: number;
}

function calculateAge(date?: string | null) {
  if (!date) return "Sin edad";
  const birthDate = new Date(date);
  if (Number.isNaN(birthDate.getTime())) return "Sin edad";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return `${age} años`;
}

function fullName(patient: PatientRow) {
  return `${patient.nombre || ""} ${patient.apellido || ""}`.trim() || "Paciente sin nombre";
}

function formatCurrency(cents?: number | null) {
  if (!cents) return "$0";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function appointmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    solicitada: "Solicitada",
    agendada: "Agendada",
    confirmada: "Confirmada",
    completada: "Completada",
    cancelada: "Cancelada",
  };

  return labels[status] || status;
}

function getPatientFiscalPrototype(patient: PatientItem) {
  const metadata = patient.original.metadata || {};
  const fiscal = metadata.fiscal || {};

  return {
    requiresInvoice: fiscal.requiere_factura === true,
    billingMode: fiscal.modo_facturacion || "corte_mensual",
    rfc: fiscal.rfc || "XAXX010101000",
    legalName: fiscal.razon_social || patient.name.toUpperCase(),
    taxRegime: fiscal.regimen_fiscal || "616 - Sin obligaciones fiscales",
    zipCode: fiscal.codigo_postal || "44100",
    cfdiUse: fiscal.uso_cfdi || "D01 - Honorarios médicos, dentales y gastos hospitalarios",
    email: fiscal.email_facturacion || patient.email,
  };
}

function patientBalanceTooltip(patient: PatientItem) {
  if (patient.netBalanceCents > 0) return `Te debe ${formatCurrency(patient.netBalanceCents)}`;
  if (patient.netBalanceCents < 0) return `Tiene a favor ${formatCurrency(Math.abs(patient.netBalanceCents))}`;
  return "Sin saldo pendiente";
}

function mapPatient(
  patient: PatientRow,
  psychologistName: string,
  appointments: PatientAppointmentRow[],
  records: PatientRecordRow[],
  balances: PatientBalanceRow[]
): PatientItem {
  const patientAppointments = appointments.filter((appointment) => appointment.paciente_id === patient.id);
  const activeAppointments = patientAppointments.filter((appointment) => appointment.estado !== "cancelada");
  const sortedAppointments = [...patientAppointments].sort(
    (a, b) => new Date(b.inicia_at).getTime() - new Date(a.inicia_at).getTime()
  );
  const lastVisit = sortedAppointments.find((appointment) => new Date(appointment.inicia_at) <= new Date())?.inicia_at;
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weeksElapsed = Math.max(1, Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const yearAppointments = activeAppointments.filter((appointment) => {
    const startsAt = new Date(appointment.inicia_at);
    return startsAt.getFullYear() === now.getFullYear();
  }).length;
  const paidIncome = patientAppointments.reduce((total, appointment) => {
    const paidPayments = appointment.pagos_cita?.filter((payment) => payment.estado === "pagado") || [];
    return total + paidPayments.reduce((sum, payment) => sum + (payment.monto_centavos || 0), 0);
  }, 0);
  const billableAppointments = patientAppointments.filter((appointment) =>
    ["solicitada", "agendada", "confirmada", "completada"].includes(appointment.estado)
  );
  const balanceDetails = billableAppointments
    .map((appointment) => {
      const paidPayments = appointment.pagos_cita?.filter((payment) => payment.estado === "pagado") || [];
      const paidCents = paidPayments.reduce((sum, payment) => sum + (payment.monto_centavos || 0), 0);
      const costCents = appointment.costo_centavos || 0;

      return {
        id: appointment.id,
        date: appointment.inicia_at,
        status: appointment.estado,
        costCents,
        paidCents,
        pendingCents: Math.max(0, costCents - paidCents),
      };
    })
    .filter((detail) => detail.pendingCents > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const overdueDebtCents = balanceDetails.reduce((total, detail) => total + detail.pendingCents, 0);
  const creditBalanceCents = balances.find((balance) => balance.paciente_id === patient.id)?.saldo_centavos
    || patient.metadata?.saldo_a_favor_centavos
    || 0;
  const netBalanceCents = overdueDebtCents - creditBalanceCents;

  return {
    id: patient.id,
    name: fullName(patient),
    age: calculateAge(patient.fecha_nacimiento),
    email: patient.email || "Sin email",
    phone: patient.telefono || "Sin teléfono",
    psychologist: psychologistName,
    lastVisit,
    totalSessions: patientAppointments.filter((appointment) => appointment.estado === "completada").length,
    yearAppointments,
    weeklySessions: Number((yearAppointments / weeksElapsed).toFixed(1)),
    incomeCents: paidIncome,
    overdueDebtCents,
    creditBalanceCents,
    netBalanceCents,
    balanceDetails,
    recordEntries: records.filter((record) => record.paciente_id === patient.id).length,
    status: patient.estado === "activo" ? "active" : "inactive",
    avatar: "",
    source: patient.fuente === "red_mindcare" ? "network" : "private",
    employeeId: patient.empleados?.numero_empleado || undefined,
    createdAt: patient.created_at,
    sessionFeeCents: patient.metadata?.tarifa_sesion_centavos || null,
    notes: patient.metadata?.notas || null,
    whatsappReminders: {
      confirmation: patient.metadata?.whatsapp_reminders?.confirmacion_cita ?? true,
      appointment: patient.metadata?.whatsapp_reminders?.recordatorio_cita ?? true,
      payment: patient.metadata?.whatsapp_reminders?.recordatorio_pago_pendiente ?? true,
    },
    original: patient,
  };
}

export function PatientsList({ currentPsychologistId, psychologists }: PatientsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);
  const [editingPatient, setEditingPatient] = useState<PatientItem | null>(null);

  const psychologistName =
    psychologists.find((psychologist) => psychologist.id === currentPsychologistId)?.name || "Psicólogo";

  useEffect(() => {
    let active = true;

    async function loadPatients() {
      setLoading(true);
      setError("");

      try {
        const profileId = await resolvePsychologistProfileId(currentPsychologistId);

        if (!profileId) {
          setPatients([]);
          return;
        }

        const [appointments, records, balances] = await Promise.all([
          supabaseRest<PatientAppointmentRow[]>(
            `/citas?psicologo_id=eq.${profileId}&select=id,paciente_id,inicia_at,estado,costo_centavos,pagos_cita(monto_centavos,estado)&order=inicia_at.desc`
          ),
          supabaseRest<PatientRecordRow[]>(
            `/notas_sesion?psicologo_id=eq.${profileId}&select=id,paciente_id,fecha_clinica&order=fecha_clinica.desc`
          ).catch(() => [] as PatientRecordRow[]),
          supabaseRest<PatientBalanceRow[]>(
            `/v_saldos_paciente?psicologo_id=eq.${profileId}&select=paciente_id,saldo_centavos`
          ).catch(() => [] as PatientBalanceRow[]),
        ]);
        const patientIds = Array.from(new Set(appointments.map((appointment) => appointment.paciente_id)));
        const orFilters = [`creado_por_psicologo_id.eq.${profileId}`];
        if (patientIds.length > 0) {
          orFilters.push(`id.in.(${patientIds.join(",")})`);
        }

        const rows = await supabaseRest<PatientRow[]>(
          `/pacientes?or=(${orFilters.join(",")})&select=id,nombre,apellido,email,telefono,fecha_nacimiento,creado_por_psicologo_id,fuente,estado,created_at,metadata,empleados(numero_empleado)&order=created_at.desc`
        );

        if (!active) return;
        setPatients(rows.map((patient) => mapPatient(patient, psychologistName, appointments, records, balances)));
      } catch (loadError) {
        if (!active) return;
        console.error("Patients load error:", loadError);
        setError("No se pudieron cargar los pacientes desde la base de datos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPatients();

    return () => {
      active = false;
    };
  }, [currentPsychologistId, psychologistName, reloadKey]);

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((patient) =>
      [patient.name, patient.email, patient.phone, patient.employeeId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [patients, searchTerm]);
  const monthlyNewPatients = useMemo(() => {
    const now = new Date();
    return filteredPatients.filter((patient) => {
      const createdAt = new Date(patient.createdAt);
      return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
    }).length;
  }, [filteredPatients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestión de pacientes registrados
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          onClick={() => {
            setEditingPatient(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Paciente
        </Button>
      </div>

      <div className="max-w-xl">
        <SearchablePatientPicker
          placeholder="Busca paciente por nombre, correo o teléfono"
          query={searchTerm}
          items={patients.map((patient) => ({
            id: patient.id,
            name: patient.name,
            description: [patient.email, patient.phone].filter(Boolean).join(" · "),
          }))}
          allOptionLabel="Todos los pacientes"
          onQueryChange={setSearchTerm}
          onSelect={(patient) => setSearchTerm(patient?.name || "")}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total</p>
            <p className="text-3xl text-foreground">{loading ? "..." : filteredPatients.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Activos</p>
            <p className="text-3xl text-[#81C784]">
              {loading ? "..." : filteredPatients.filter((patient) => patient.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Nuevos (mes)</p>
            <p className="text-3xl text-primary">{loading ? "..." : monthlyNewPatients}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Sesiones</p>
            <p className="text-3xl text-[#4DD0E1]">
              {loading
                ? "..."
                : filteredPatients.reduce((total, patient) => total + patient.totalSessions, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-center">Tarifa</TableHead>
                <TableHead className="text-center">Saldo</TableHead>
                <TableHead className="text-center">WhatsApp</TableHead>
                <TableHead>Psicólogo Asignado</TableHead>
                <TableHead className="text-center">Última Visita</TableHead>
                <TableHead className="text-center">Sesiones</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Cargando pacientes...
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No hay pacientes registrados para este psicólogo.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={patient.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-foreground">{patient.name}</p>
                          {patient.source === "network" && (
                            <Badge className="bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/20 text-xs">
                              <Building2 className="w-3 h-3 mr-1" />
                              Red
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {patient.age}
                          {patient.source === "network" && patient.company && (
                            <span className="ml-2">• {patient.company}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {patient.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {patient.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm text-foreground">
                    {patient.sessionFeeCents ? formatCurrency(patient.sessionFeeCents) : "Sin tarifa"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={`inline-flex cursor-help rounded-full px-3 py-1 text-sm font-medium ${
                            patient.netBalanceCents > 0
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : patient.netBalanceCents < 0
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {patient.netBalanceCents > 0
                            ? formatCurrency(patient.netBalanceCents)
                            : patient.netBalanceCents < 0
                              ? `+${formatCurrency(Math.abs(patient.netBalanceCents))}`
                              : "$0"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{patientBalanceTooltip(patient)}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                      <MessageCircle className="w-3 h-3 text-primary" />
                      {[
                        patient.whatsappReminders.confirmation,
                        patient.whatsappReminders.appointment,
                        patient.whatsappReminders.payment,
                      ].filter(Boolean).length}
                      /3
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.psychologist}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {patient.lastVisit
                      ? new Date(patient.lastVisit).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Sin visitas"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{patient.totalSessions}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        patient.status === "active"
                          ? "bg-[#81C784] text-white"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {patient.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Ver detalles" onClick={() => setSelectedPatient(patient)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar"
                        onClick={() => {
                          setEditingPatient(patient);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddPatientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPatient(null);
        }}
        psychologists={psychologists}
        defaultPsychologist={currentPsychologistId}
        editPatient={editingPatient?.original || null}
        onCreated={() => setReloadKey((key) => key + 1)}
      />

      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[840px]">
          <DialogHeader>
            <DialogTitle>{selectedPatient?.name}</DialogTitle>
            <DialogDescription>
              Resumen operativo del paciente con datos de citas, pagos y expediente.
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="border-border">
                  <CardContent className="p-4">
                    <CalendarDays className="w-4 h-4 text-primary mb-3" />
                    <p className="text-xs text-muted-foreground">Citas del año</p>
                    <p className="text-2xl text-foreground">{selectedPatient.yearAppointments}</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <Activity className="w-4 h-4 text-[#4DD0E1] mb-3" />
                    <p className="text-xs text-muted-foreground">Sesiones por semana</p>
                    <p className="text-2xl text-foreground">{selectedPatient.weeklySessions}</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <Wallet className="w-4 h-4 text-[#81C784] mb-3" />
                    <p className="text-xs text-muted-foreground">Ingreso del paciente</p>
                    <p className="text-2xl text-foreground">{formatCurrency(selectedPatient.incomeCents)}</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <FileText className="w-4 h-4 text-[#7E57C2] mb-3" />
                    <p className="text-xs text-muted-foreground">Expediente</p>
                    <p className="text-2xl text-foreground">{selectedPatient.recordEntries}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-muted-foreground mb-1">Contacto</p>
                  <p className="text-foreground">{selectedPatient.email}</p>
                  <p className="text-foreground">{selectedPatient.phone}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-muted-foreground mb-1">Tarifa base</p>
                  <p className="text-foreground">
                    {selectedPatient.sessionFeeCents ? formatCurrency(selectedPatient.sessionFeeCents) : "Sin tarifa registrada"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Esta tarifa se sugiere automáticamente en nuevas citas.
                  </p>
                </div>
              </div>

              {(() => {
                const fiscal = getPatientFiscalPrototype(selectedPatient);
                if (!fiscal.requiresInvoice) return null;

                return (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <Receipt className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm text-foreground">Facturación del paciente</p>
                          <p className="text-xs text-muted-foreground">
                            Información prototipada. Después se conectará a datos fiscales reales del paciente y timbrado CFDI.
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">Requiere factura</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      <div className="rounded-md bg-card border border-border p-3">
                        <p className="text-xs text-muted-foreground">RFC</p>
                        <p className="text-sm text-foreground">{fiscal.rfc}</p>
                      </div>
                      <div className="rounded-md bg-card border border-border p-3">
                        <p className="text-xs text-muted-foreground">Razón social</p>
                        <p className="text-sm text-foreground">{fiscal.legalName}</p>
                      </div>
                      <div className="rounded-md bg-card border border-border p-3">
                        <p className="text-xs text-muted-foreground">Código postal</p>
                        <p className="text-sm text-foreground">{fiscal.zipCode}</p>
                      </div>
                      <div className="rounded-md bg-card border border-border p-3">
                        <p className="text-xs text-muted-foreground">Régimen fiscal</p>
                        <p className="text-sm text-foreground">{fiscal.taxRegime}</p>
                      </div>
                      <div className="rounded-md bg-card border border-border p-3">
                        <p className="text-xs text-muted-foreground">Uso CFDI</p>
                        <p className="text-sm text-foreground">{fiscal.cfdiUse}</p>
                      </div>
                      <div className="rounded-md bg-card border border-border p-3">
                        <p className="text-xs text-muted-foreground">Modo</p>
                        <p className="text-sm text-foreground">
                          {fiscal.billingMode === "por_cita" ? "Factura por cita" : "Corte mensual"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md border border-border bg-card p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Automatización prototipo</p>
                          <p className="text-sm text-foreground">
                            Las citas completadas y pagadas entrarían a una prefactura. Si el paciente usa corte mensual,
                            se agrupan sus sesiones del mes antes de timbrar.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${
                    selectedPatient.netBalanceCents > 0
                      ? "text-red-600"
                      : selectedPatient.netBalanceCents < 0
                        ? "text-green-600"
                        : "text-muted-foreground"
                  }`} />
                  <div>
                    <p className="text-sm text-foreground">
                      {selectedPatient.netBalanceCents > 0
                        ? `El paciente te debe ${formatCurrency(selectedPatient.netBalanceCents)}.`
                        : selectedPatient.netBalanceCents < 0
                          ? `Tú le debes o tiene saldo a favor por ${formatCurrency(Math.abs(selectedPatient.netBalanceCents))}.`
                          : "No hay saldo pendiente entre ambos."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Calculado con citas no canceladas, pagos registrados y saldo a favor disponible.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="rounded-md bg-red-50 border border-red-100 p-3">
                    <p className="text-xs text-red-700">Debe por citas</p>
                    <p className="text-lg text-red-700">{formatCurrency(selectedPatient.overdueDebtCents)}</p>
                  </div>
                  <div className="rounded-md bg-green-50 border border-green-100 p-3">
                    <p className="text-xs text-green-700">Saldo a favor</p>
                    <p className="text-lg text-green-700">{formatCurrency(selectedPatient.creditBalanceCents)}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 border border-border p-3">
                    <p className="text-xs text-muted-foreground">Saldo neto</p>
                    <p className={`text-lg ${
                      selectedPatient.netBalanceCents > 0
                        ? "text-red-700"
                        : selectedPatient.netBalanceCents < 0
                          ? "text-green-700"
                          : "text-foreground"
                    }`}>
                      {selectedPatient.netBalanceCents > 0
                        ? formatCurrency(selectedPatient.netBalanceCents)
                        : selectedPatient.netBalanceCents < 0
                          ? `+${formatCurrency(Math.abs(selectedPatient.netBalanceCents))}`
                          : "$0"}
                    </p>
                  </div>
                </div>

                {selectedPatient.balanceDetails.length > 0 ? (
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cita</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Costo</TableHead>
                          <TableHead className="text-right">Pagado</TableHead>
                          <TableHead className="text-right">Pendiente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPatient.balanceDetails.map((detail) => (
                          <TableRow key={detail.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(detail.date).toLocaleDateString("es-MX", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{appointmentStatusLabel(detail.status)}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(detail.costCents)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(detail.paidCents)}</TableCell>
                            <TableCell className="text-right text-red-700">{formatCurrency(detail.pendingCents)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay citas con saldo pendiente. Si aparece saldo a favor, proviene de anticipos registrados.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <p className="text-sm text-foreground">WhatsApp por paciente</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    ["Confirmación de cita", selectedPatient.whatsappReminders.confirmation],
                    ["Recordatorio de cita", selectedPatient.whatsappReminders.appointment],
                    ["Pago pendiente", selectedPatient.whatsappReminders.payment],
                  ].map(([label, enabled]) => (
                    <div key={String(label)} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <Badge className={enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                        {enabled ? "Sí" : "No"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPatient.notes && (
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground mb-2">Notas generales</p>
                  <p className="text-sm text-foreground whitespace-pre-line">{selectedPatient.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
