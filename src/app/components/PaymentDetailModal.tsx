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
  User,
  DollarSign,
  CreditCard,
  Hash,
  FileText,
  Download,
  CheckCircle2,
} from "lucide-react";

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
}

const paymentMethods = {
  card: { label: "Tarjeta", icon: CreditCard },
  cash: { label: "Efectivo", icon: DollarSign },
  transfer: { label: "Transferencia", icon: CreditCard },
};

const paymentStatus = {
  paid: { label: "Pagado", color: "bg-[#81C784] text-white" },
  pending: { label: "Pendiente", color: "bg-[#FFB74D] text-white" },
  cancelled: { label: "Cancelado", color: "bg-destructive text-destructive-foreground" },
};

export function PaymentDetailModal({
  isOpen,
  onClose,
  payment,
}: PaymentDetailModalProps) {
  if (!payment) return null;

  const method = paymentMethods[payment.method as keyof typeof paymentMethods];
  const status = paymentStatus[payment.status as keyof typeof paymentStatus];
  const MethodIcon = method.icon;

  const handleDownloadReceipt = () => {
    console.log("Downloading receipt for payment:", payment.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Detalles del Pago</DialogTitle>
          <DialogDescription>
            Información completa de la transacción
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header with Amount */}
          <div className="text-center py-4 bg-accent/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Monto Total</p>
            <p className="text-4xl text-foreground">${payment.amount}</p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-center gap-3">
            <Badge className={`${status.color} gap-2 px-4 py-2`}>
              <CheckCircle2 className="w-4 h-4" />
              {status.label}
            </Badge>
          </div>

          <Separator />

          {/* Payment ID */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Hash className="w-4 h-4" />
              ID de Transacción
            </Label>
            <p className="text-foreground pl-6 font-mono text-sm">
              #{payment.id.toString().padStart(8, "0")}
            </p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Fecha
            </Label>
            <p className="text-foreground pl-6">
              {new Date(payment.date).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Patient */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Paciente
            </Label>
            <p className="text-foreground pl-6">{payment.patient}</p>
          </div>

          {/* Psychologist */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Psicólogo
            </Label>
            <p className="text-foreground pl-6">{payment.psychologist}</p>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <MethodIcon className="w-4 h-4" />
              Método de Pago
            </Label>
            <p className="text-foreground pl-6">{method.label}</p>
          </div>

          {/* Reference (if exists) */}
          {payment.reference && (
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Referencia
              </Label>
              <p className="text-foreground pl-6 font-mono text-sm">
                {payment.reference}
              </p>
            </div>
          )}

          {/* Notes (if exists) */}
          {payment.notes && (
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notas
              </Label>
              <p className="text-foreground pl-6 text-sm">{payment.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadReceipt}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar Recibo
          </Button>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
