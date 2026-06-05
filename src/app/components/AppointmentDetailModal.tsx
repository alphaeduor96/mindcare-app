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

  if (!appointment) return null;

  const status = statusConfig[appointment.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  const handleCancel = async () => {
    setCancelling(true);

    try {
      await supabaseRest(`/citas?id=eq.${appointment.id}`, {
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
                {appointment.source === "network" && (
                  <Badge className="bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/20">
                    <Building2 className="w-3 h-3 mr-1" />
                    Red MindCare
                  </Badge>
                )}
              </div>
              {appointment.paid && (
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
                <p className="text-foreground">{appointment.patient}</p>
                {appointment.source === "network" && appointment.company && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {appointment.company}
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
              <p className="text-foreground pl-6">{appointment.psychologist}</p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Fecha
                </Label>
                <p className="text-foreground pl-6">
                  {new Date(appointment.date).toLocaleDateString("es-ES", {
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
                <p className="text-foreground pl-6">{appointment.time}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duración
              </Label>
              <p className="text-foreground pl-6">{appointment.duration || 60} minutos</p>
            </div>

            {/* Office */}
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Consultorio
              </Label>
              <p className="text-foreground pl-6">{appointment.office}</p>
            </div>

            {/* Amount */}
            {appointment.amount && (
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Monto
                </Label>
                <div className="pl-6">
                  <p className="text-foreground text-xl">${appointment.amount} MXN</p>
                  {appointment.source === "network" && (
                    <p className="text-sm text-[#4DB6AC] mt-1">
                      Pago por MindCare • Corte semanal
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {appointment.status !== "cancelled" && (
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
              <span className="font-medium">{appointment.patient}</span>.
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
      {appointment && (
        <AppointmentModal
          isOpen={rescheduleModalOpen}
          onClose={() => setRescheduleModalOpen(false)}
          editMode={true}
          appointmentData={appointment}
          currentPsychologistId={currentPsychologistId}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
