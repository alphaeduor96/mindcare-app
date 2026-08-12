import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Building2,
  DollarSign,
  Edit,
  XCircle,
  CheckCircle2,
  ReceiptText,
} from "lucide-react";
import { AppointmentModal } from "./AppointmentModal";
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
import { toast } from "sonner";
import { supabaseRest } from "../../services/api";

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  currentPsychologistId?: string;
  onSaved?: () => void;
}

const statusConfig = {
  scheduled: {
    label: "Agendada",
    color: "bg-blue-600 text-white",
    icon: CheckCircle2,
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

const formatMoney = (amountCents?: number | null) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format((amountCents || 0) / 100);

const formatLongDate = (value?: string | null) => {
  if (!value) return "Sin fecha registrada";

  return new Date(value).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  currentPsychologistId,
  onSaved,
}: AppointmentDetailModalProps) {
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  const activeAppointment = appointment || editingAppointment;

  if (!activeAppointment) return null;

  const status = statusConfig[activeAppointment.status as keyof typeof statusConfig] || statusConfig.scheduled;
  const StatusIcon = status.icon;
  const payments = activeAppointment.payments || [];

  const handleCancel = async () => {
    setCancelling(true);

    try {
      await supabaseRest(`/citas?id=eq.${activeAppointment.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          estado: "cancelada",
          cancelada_at: new Date().toISOString(),
        }),
      });

      toast.success("Cita cancelada exitosamente");
      setCancelDialogOpen(false);
      onSaved?.();
      onClose();
    } catch (error) {
      console.error("Cancel appointment error:", error);
      toast.error("No se pudo cancelar la cita");
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = () => {
    setEditingAppointment(activeAppointment);
    setRescheduleModalOpen(true);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
            <DialogDescription>
              Información completa de la cita programada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge className={`${status.color} gap-2 px-3 py-1`}>
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </Badge>
                {activeAppointment.source === "network" && (
                  <Badge className="bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/20">
                    <Building2 className="w-3 h-3 mr-1" />
                    Red MindCare
                  </Badge>
                )}
              </div>
              {activeAppointment.paid && (
                <Badge className="bg-[#81C784] text-white">Pagado</Badge>
              )}
            </div>

            <Separator />

            {/* Patient Info */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Paciente
              </Label>
              <div className="pl-6">
                <p className="text-foreground">{activeAppointment.patient}</p>
                {activeAppointment.source === "network" && activeAppointment.company && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeAppointment.company}
                  </p>
                )}
              </div>
            </div>

            {/* Psychologist Info */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Psicólogo
              </Label>
              <p className="text-foreground pl-6">{activeAppointment.psychologist}</p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Fecha
                </Label>
                <p className="text-foreground pl-6">
                  {new Date(activeAppointment.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Hora
                </Label>
                <p className="text-foreground pl-6">{activeAppointment.time}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duración
              </Label>
              <p className="text-foreground pl-6">{activeAppointment.duration || 60} minutos</p>
            </div>

            {/* Office */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Consultorio
              </Label>
              <p className="text-foreground pl-6">{activeAppointment.office}</p>
            </div>

            {/* Amount */}
            {activeAppointment.amount && (
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Monto
                </Label>
                <div className="pl-6">
                  <p className="text-foreground text-xl">${activeAppointment.amount} MXN</p>
                  {activeAppointment.source === "network" && (
                    <p className="text-sm text-[#4DB6AC] mt-1">
                      Pago por MindCare • Corte semanal
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeAppointment.paid && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <ReceiptText className="w-4 h-4" />
                    Pago aplicado a esta cita
                  </Label>

                  {payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((payment: any) => (
                        <div
                          key={payment.id}
                          className="rounded-lg border border-border bg-muted/20 p-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Cuándo me pagaron</p>
                              <p className="text-sm text-foreground">
                                {formatLongDate(payment.incomeDate || payment.paidAt)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">De qué pago es</p>
                              <p className="text-sm text-foreground font-mono">
                                {payment.incomeId ? `Ingreso #${String(payment.incomeId).slice(0, 8)}` : `Pago #${String(payment.id).slice(0, 8)}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Monto total del ingreso</p>
                              <p className="text-sm text-foreground">
                                {formatMoney(payment.incomeAmountCents ?? payment.amountCents)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Aplicado a esta cita</p>
                              <p className="text-sm font-medium text-foreground">
                                {formatMoney(payment.amountCents)}
                              </p>
                            </div>
                          </div>

                          {(payment.incomeReference || payment.reference || payment.provider) && (
                            <div className="mt-3 rounded-md bg-background/70 p-3 text-xs text-muted-foreground">
                              {payment.provider && <p>Método: {payment.provider}</p>}
                              {(payment.incomeReference || payment.reference) && (
                                <p>Referencia: {payment.incomeReference || payment.reference}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      La cita está marcada como pagada, pero no se encontró el detalle del ingreso asociado.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {activeAppointment.status === "scheduled" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(true)}
                  className="text-destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar Cita
                </Button>
                <Button onClick={handleReschedule}>
                  <Edit className="w-4 h-4 mr-2" />
                  Reagendar
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la cita de{" "}
              <span className="font-medium">{activeAppointment.patient}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>No, volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelling}
            >
              {cancelling ? "Cancelando..." : "Sí, cancelar cita"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Modal */}
      {activeAppointment && (
        <AppointmentModal
          isOpen={rescheduleModalOpen}
          onClose={() => setRescheduleModalOpen(false)}
          editMode={true}
          appointmentData={activeAppointment}
          currentPsychologistId={currentPsychologistId}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
