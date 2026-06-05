import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  XCircle,
  Edit,
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
import { toast } from "sonner";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

interface AppointmentsListProps {
  currentPsychologistId?: string;
  psychologists: Array<{ id: string; name: string }>;
  patients: Array<{ id: string; name: string }>;
}

const statusConfig = {
  confirmed: {
    label: "Confirmada",
    color: "bg-[#81C784] text-white",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pendiente",
    color: "bg-[#FFB74D] text-white",
    icon: Clock,
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-destructive text-destructive-foreground",
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
    nombre?: string | null;
    apellido?: string | null;
  } | null;
  consultorios?: {
    nombre?: string | null;
  } | null;
  pagos_cita?: Array<{
    monto_centavos: number;
    estado: string;
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
  status: "confirmed" | "pending" | "cancelled";
  amount: number;
  paid: boolean;
  avatar: string;
  source: "private" | "network";
  company?: string;
}

function fullName(person?: { nombre?: string | null; apellido?: string | null } | null) {
  return `${person?.nombre || ""} ${person?.apellido || ""}`.trim();
}

function mapStatus(status: string): AppointmentItem["status"] {
  if (status === "cancelada" || status === "no_asistio") return "cancelled";
  if (status === "solicitada") return "pending";
  return "confirmed";
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
    avatar: "",
    source: row.fuente === "red_mindcare" ? "network" : "private",
  };
}

export function AppointmentsList({
  currentPsychologistId,
  psychologists,
  patients,
}: AppointmentsListProps) {
  const [filter, setFilter] = useState("all");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
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
          `/citas?psicologo_id=eq.${profileId}&select=id,paciente_id,psicologo_id,inicia_at,termina_at,estado,fuente,modalidad,consultorio_id,costo_centavos,pacientes(nombre,apellido),consultorios(nombre)&order=inicia_at.desc`
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
  }, [currentPsychologistId, psychologistName, reloadKey]);

  const filteredAppointments = appointments;

  // Apply status filter
  const displayedAppointments = useMemo(
    () =>
      filter === "all"
        ? filteredAppointments
        : filteredAppointments.filter((apt) => apt.status === filter),
    [filter, filteredAppointments]
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
      .then(() => {
        setAppointments((current) =>
          current.map((appointment) =>
            appointment.id === selectedAppointment.id
              ? { ...appointment, status: "cancelled" }
              : appointment
          )
        );
        toast.success("Cita cancelada exitosamente");
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

  const handleOpenReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
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
                <p className="text-sm text-muted-foreground mb-2">Confirmadas</p>
                <p className="text-3xl text-[#81C784]">
                  {filteredAppointments.filter((a) => a.status === "confirmed").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#81C784]/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#81C784]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Pendientes</p>
                <p className="text-3xl text-[#FFB74D]">
                  {filteredAppointments.filter((a) => a.status === "pending").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#FFB74D]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#FFB74D]" />
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
                  {filteredAppointments.filter((a) => !a.paid && a.status !== "cancelled").length}
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
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Filtrar por estado:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px] bg-input-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
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
                        {appointment.status !== "cancelled" && (
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
                          {appointment.status !== "cancelled" && !appointment.paid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#66BB6A]"
                              onClick={() => handleOpenPayment(appointment)}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                          {appointment.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenReschedule(appointment)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Reagendar
                            </Button>
                          )}
                          {appointment.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleOpenCancel(appointment)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
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
            amount: selectedAppointment.amount.toString(),
          }}
        />
      )}

      {/* Reschedule Modal */}
      {selectedAppointment && (
        <AppointmentModal
          isOpen={rescheduleModalOpen}
          onClose={() => {
            setRescheduleModalOpen(false);
            setSelectedAppointment(null);
          }}
          selectedHour={parseInt(selectedAppointment.time.split(":")[0])}
          editMode={true}
          appointmentData={selectedAppointment}
          currentPsychologistId={currentPsychologistId}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      )}
    </div>
  );
}
