import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  XCircle,
  Edit,
  Eye,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { AddPaymentModal } from "./AddPaymentModal";
import { AppointmentModal } from "./AppointmentModal";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import { SearchablePatientPicker } from "./SearchablePatientPicker";
import { toast } from "sonner";
import { resolvePsychologistProfileId, sendAppEmail, supabaseRest } from "../../services/api";

interface AppointmentsListProps {
  currentPsychologistId?: string;
  psychologists: Array<{ id: string; name: string }>;
  patients: Array<{ id: string; name: string }>;
  externalReloadKey?: number;
}

const statusConfig = {
  scheduled: {
    label: "Agendada",
    color: "bg-blue-600 text-white",
    icon: CalendarIcon,
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-destructive text-destructive-foreground",
    icon: XCircle,
  },
  no_show: {
    label: "No asistió",
    color: "bg-muted text-muted-foreground",
    icon: XCircle,
  },
};

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
    id?: string | null;
    nombre?: string | null;
    apellido?: string | null;
    email?: string | null;
    metadata?: Record<string, any> | null;
  } | null;
  consultorios?: {
    id?: string | null;
    nombre?: string | null;
    direccion?: string | null;
    colonia?: string | null;
    municipio?: string | null;
    estado_region?: string | null;
    codigo_postal?: string | null;
    estado?: string | null;
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

interface AppointmentItem {
  id: string;
  patient: string;
  patientId: string;
  psychologist: string;
  psychologistId: string;
  date: string;
  time: string;
  office: string;
  officeId?: string | null;
  modality: "presencial" | "virtual";
  duration: number;
  status: "scheduled" | "cancelled" | "no_show";
  amount: number;
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
  avatar: string;
  source: "private" | "network";
  company?: string;
}

function appointmentItemToEditData(appointment: AppointmentItem) {
  const startsAt = new Date(appointment.date);
  const endsAt = new Date(startsAt.getTime() + appointment.duration * 60000);

  return {
    ...appointment,
    paciente_id: appointment.patientId,
    psicologo_id: appointment.psychologistId,
    consultorio_id: appointment.officeId,
    inicia_at: startsAt.toISOString(),
    termina_at: endsAt.toISOString(),
    modalidad: appointment.modality,
    estado:
      appointment.status === "cancelled"
        ? "cancelada"
        : appointment.status === "no_show"
          ? "no_asistio"
          : "agendada",
    costo_centavos: Math.round(Number(appointment.amount || 0) * 100),
    pacientes: {
      id: appointment.patientId,
      nombre: appointment.patient.split(" ")[0] || appointment.patient,
      apellido: appointment.patient.split(" ").slice(1).join(" "),
    },
    consultorios: appointment.officeId
      ? {
          id: appointment.officeId,
          nombre: appointment.office,
        }
      : null,
  };
}

function fullName(person?: { nombre?: string | null; apellido?: string | null } | null) {
  return `${person?.nombre || ""} ${person?.apellido || ""}`.trim();
}

function officeAddress(office?: AppointmentRow["consultorios"] | null) {
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

function mapStatus(status: string): AppointmentItem["status"] {
  if (status === "cancelada") return "cancelled";
  if (status === "no_asistio") return "no_show";
  return "scheduled";
}

function mapAppointment(row: AppointmentRow, psychologistName: string): AppointmentItem {
  const startsAt = new Date(row.inicia_at);
  const endsAt = new Date(row.termina_at);
  const paidAmount = row.pagos_cita
    ?.filter((payment) => payment.estado === "pagado")
    .reduce((total, payment) => total + payment.monto_centavos, 0);

  return {
    id: row.id,
    patient: fullName(row.pacientes) || "Paciente sin nombre",
    patientId: row.paciente_id,
    psychologist: psychologistName,
    psychologistId: row.psicologo_id,
    date: startsAt.toISOString(),
    time: startsAt.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    office: row.consultorios?.nombre || (row.modalidad === "virtual" ? "Virtual" : row.fuente === "red_mindcare" ? "Red MindCare" : "Sin consultorio"),
    officeId: row.consultorio_id,
    modality: row.modalidad,
    duration: Math.max(15, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000)),
    status: mapStatus(row.estado),
    amount: Math.round(((paidAmount || row.costo_centavos) || 0) / 100),
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
    avatar: "",
    source: row.fuente === "red_mindcare" ? "network" : "private",
  };
}

function monthKey(date: string) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
}

export function AppointmentsList({
  currentPsychologistId,
  psychologists,
  patients,
  externalReloadKey = 0,
}: AppointmentsListProps) {
  const [filter, setFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const psychologistName =
    psychologists.find((psychologist) => psychologist.id === currentPsychologistId)?.name || "Psicólogo";

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

        const rows = await supabaseRest<AppointmentRow[]>(
          `/citas?psicologo_id=eq.${profileId}&select=id,paciente_id,psicologo_id,inicia_at,termina_at,estado,fuente,modalidad,consultorio_id,costo_centavos,pacientes(nombre,apellido),consultorios(nombre),pagos_cita(id,monto_centavos,estado,pagado_at,proveedor_pago,referencia_externa,ingreso_paciente_id,ingresos_paciente(id,monto_centavos,fecha_pago,referencia,estado))&order=inicia_at.desc`
        );

        if (!active) return;
        setAppointments(rows.map((row) => mapAppointment(row, psychologistName)));
      } catch (loadError: any) {
        if (!active) return;
        console.error("Appointments list load error:", loadError);
        setError(`No se pudieron cargar las citas desde la base de datos. ${loadError?.message || ""}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAppointments();

    return () => {
      active = false;
    };
  }, [currentPsychologistId, psychologistName, reloadKey, externalReloadKey]);

  const monthOptions = useMemo(() => {
    const keys = Array.from(new Set(appointments.map((appointment) => monthKey(appointment.date))));
    return keys.sort((first, second) => second.localeCompare(first));
  }, [appointments]);

  const filteredAppointments = useMemo(
    () =>
      monthFilter === "all"
        ? appointments
        : appointments.filter((appointment) => monthKey(appointment.date) === monthFilter),
    [appointments, monthFilter]
  );

  const patientFilterItems = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; description?: string }>();
    appointments.forEach((appointment) => {
      if (!byId.has(appointment.patientId)) {
        byId.set(appointment.patientId, {
          id: appointment.patientId,
          name: appointment.patient,
          description: appointment.office,
        });
      }
    });
    return Array.from(byId.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [appointments]);

  // Apply status filter
  const displayedAppointments = useMemo(
    () => {
      const byStatus = filter === "all"
        ? filteredAppointments
        : filteredAppointments.filter((apt) => apt.status === filter);

      const byPayment = paymentFilter === "all"
        ? byStatus
        : byStatus.filter((appointment) =>
            paymentFilter === "paid"
              ? appointment.paid
              : !appointment.paid && appointment.status === "scheduled"
          );

      if (!patientFilter) return byPayment;
      return byPayment.filter((appointment) => appointment.patientId === patientFilter);
    },
    [filter, filteredAppointments, patientFilter, paymentFilter]
  );

  const handleCancelAppointment = () => {
    if (!selectedAppointment) return;

    supabaseRest(`/citas?id=eq.${selectedAppointment.id}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        estado: "cancelada",
        cancelada_at: new Date().toISOString(),
      }),
    })
      .then(async () => {
        setAppointments((current) =>
          current.map((appointment) =>
            appointment.id === selectedAppointment.id
              ? { ...appointment, status: "cancelled" }
              : appointment
          )
        );

        try {
          const rows = await supabaseRest<AppointmentRow[]>(
            `/citas?id=eq.${selectedAppointment.id}&select=id,paciente_id,psicologo_id,inicia_at,termina_at,estado,modalidad,consultorio_id,costo_centavos,pacientes(id,nombre,apellido,email,metadata),consultorios(id,nombre,direccion,colonia,municipio,estado_region,codigo_postal,estado)&limit=1`
          );
          const cancelledAppointment = rows[0];
          const patient = cancelledAppointment?.pacientes;

          if (!cancelledAppointment || !patient?.email) {
            toast.success("Cita cancelada. No se envió correo porque el paciente no tiene email registrado.");
            return;
          }

          await sendAppEmail({
            type: "appointment_cancelled",
            to: patient.email,
            data: {
              patientId: patient.id || cancelledAppointment.paciente_id,
              patientName: fullName(patient) || selectedAppointment.patient,
              psychologistName,
              startsAt: cancelledAppointment.inicia_at,
              endsAt: cancelledAppointment.termina_at,
              modality: cancelledAppointment.modalidad,
              officeName: cancelledAppointment.consultorios?.nombre || "",
              officeAddress: officeAddress(cancelledAppointment.consultorios),
              amount: cancelledAppointment.costo_centavos ? cancelledAppointment.costo_centavos / 100 : null,
            },
          });
          toast.success(`Cita cancelada. Correo enviado a ${patient.email}`);
        } catch (emailError) {
          console.warn("Cancel appointment email could not be sent:", emailError);
          const message = emailError instanceof Error ? emailError.message : "No se pudo enviar el correo.";
          toast.warning(`Cita cancelada, pero no se pudo enviar el correo: ${message}`);
        }
      })
      .catch((cancelError) => {
        console.error("Cancel appointment error:", cancelError);
        toast.error("No se pudo cancelar la cita");
      })
      .finally(() => {
        setCancelDialogOpen(false);
        setSelectedAppointment(null);
      });
  };

  const handleOpenPayment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setPaymentModalOpen(true);
  };

  const handleOpenDetail = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDetailModalOpen(true);
  };

  const handleOpenReschedule = async (appointment: AppointmentItem) => {
    const fallbackAppointment = appointmentItemToEditData(appointment);

    try {
      const rows = await supabaseRest<AppointmentRow[]>(
        `/citas?id=eq.${appointment.id}&select=id,paciente_id,psicologo_id,inicia_at,termina_at,estado,fuente,modalidad,consultorio_id,costo_centavos,pacientes(id,nombre,apellido,email,metadata),consultorios(id,nombre,direccion,colonia,municipio,estado_region,codigo_postal,estado)&limit=1`
      );

      setAppointmentToEdit(rows[0] || fallbackAppointment);
      setRescheduleModalOpen(true);
    } catch (error) {
      console.error("Load appointment for edit error:", error);
      setAppointmentToEdit(fallbackAppointment);
      setRescheduleModalOpen(true);
      toast.warning("Se abrió la cita con la información de la lista.");
    }
  };

  const handleOpenCancel = (appointment: any) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total</p>
                <p className="text-3xl text-foreground">
                  {filteredAppointments.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Agendadas</p>
                <p className="text-3xl text-blue-600">
                  {filteredAppointments.filter((a) => a.status === "scheduled").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Canceladas</p>
                <p className="text-3xl text-destructive">
                  {filteredAppointments.filter((a) => a.status === "cancelled").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Sin Pagar</p>
                <p className="text-3xl text-destructive">
                  {filteredAppointments.filter((a) => !a.paid && a.status === "scheduled").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="w-full md:max-w-sm">
              <SearchablePatientPicker
                label="Paciente"
                placeholder="Buscar paciente"
                query={patientSearch}
                selectedId={patientFilter}
                items={patientFilterItems}
                allOptionLabel="Todos los pacientes"
                onQueryChange={(query) => {
                  setPatientSearch(query);
                  if (!query.trim()) setPatientFilter("");
                }}
                onSelect={(patient) => {
                  setPatientFilter(patient?.id || "");
                  setPatientSearch(patient?.name || "");
                }}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm text-muted-foreground">Mes:</span>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-full sm:w-[220px] bg-input-background">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los meses</SelectItem>
                  {monthOptions.map((key) => (
                    <SelectItem key={key} value={key} className="capitalize">
                      {monthLabel(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm text-muted-foreground">Estado:</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[200px] bg-input-background">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="scheduled">Agendadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="no_show">No asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm text-muted-foreground">Pago:</span>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full sm:w-[200px] bg-input-background">
                  <SelectValue placeholder="Seleccionar pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagadas</SelectItem>
                  <SelectItem value="unpaid">Pendientes de pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Lista de Citas</CardTitle>
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
                <TableHead>Psicólogo</TableHead>
                <TableHead>Fecha & Hora</TableHead>
                <TableHead>Consultorio</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Cargando citas...
                  </TableCell>
                </TableRow>
              ) : displayedAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay citas registradas con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                displayedAppointments.map((appointment) => {
                  const status = statusConfig[appointment.status as keyof typeof statusConfig];
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={appointment.id} className="hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={appointment.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {appointment.patient
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-foreground">{appointment.patient}</span>
                              {appointment.source === "network" && (
                                <Badge className="bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/20 text-xs">
                                  <Building2 className="w-3 h-3 mr-1" />
                                  Red
                                </Badge>
                              )}
                            </div>
                            {appointment.source === "network" && appointment.company && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {appointment.company}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {appointment.psychologist}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <CalendarIcon className="w-3 h-3" />
                            {new Date(appointment.date).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {appointment.time}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {appointment.office}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${status.color} gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {appointment.status === "scheduled" && (
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              className={
                                appointment.paid
                                  ? "bg-[#81C784] text-white"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {appointment.paid ? "Pagado" : "Sin pagar"}
                            </Badge>
                            <span className="text-sm text-foreground">
                              ${appointment.amount}
                            </span>
                            {appointment.source === "network" && (
                              <span className="text-xs text-[#4DB6AC]">
                                por MindCare
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenDetail(appointment)}
                                aria-label="Ver detalle"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalle</TooltipContent>
                          </Tooltip>
                          {appointment.status === "scheduled" && !appointment.paid && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-[#66BB6A]"
                                  onClick={() => handleOpenPayment(appointment)}
                                  aria-label="Registrar pago"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Registrar pago</TooltipContent>
                            </Tooltip>
                          )}
                          {appointment.status === "scheduled" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenReschedule(appointment)}
                                  aria-label="Reagendar cita"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reagendar cita</TooltipContent>
                            </Tooltip>
                          )}
                          {appointment.status === "scheduled" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleOpenCancel(appointment)}
                                  aria-label="Cancelar cita"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cancelar cita</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la cita de{" "}
              <span className="font-medium">{selectedAppointment?.patient}</span> programada
              para el{" "}
              {selectedAppointment?.date &&
                new Date(selectedAppointment.date).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}{" "}
              a las {selectedAppointment?.time}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Modal */}
      {selectedAppointment && (
        <AddPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedAppointment(null);
          }}
          patients={patients}
          psychologists={psychologists}
          defaultPsychologist={selectedAppointment.psychologistId}
          prefilledData={{
            patient: selectedAppointment.patientId,
            appointment: selectedAppointment.id,
            amount: selectedAppointment.amount.toString(),
          }}
          onPaymentCreated={() => setReloadKey((key) => key + 1)}
        />
      )}

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

      {/* Reschedule Modal */}
      {appointmentToEdit && (
        <AppointmentModal
          key={appointmentToEdit.id}
          isOpen={rescheduleModalOpen}
          onClose={() => {
            setRescheduleModalOpen(false);
            setAppointmentToEdit(null);
          }}
          selectedHour={
            appointmentToEdit.inicia_at
              ? new Date(appointmentToEdit.inicia_at).getHours()
              : appointmentToEdit.time
                ? parseInt(String(appointmentToEdit.time).split(":")[0])
                : null
          }
          editMode={true}
          appointmentData={appointmentToEdit}
          currentPsychologistId={currentPsychologistId}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      )}
    </div>
  );
}
