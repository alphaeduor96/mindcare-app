import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import { ensurePsychologistProfileId, supabaseRest } from "../../services/api";

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  psychologists: Array<{ id: string; name: string }>;
  defaultPsychologist?: string;
  editPatient?: {
    id: string;
    nombre: string;
    apellido: string;
    email?: string | null;
    telefono?: string | null;
    creado_por_psicologo_id?: string | null;
    metadata?: Record<string, any> | null;
  } | null;
  onCreated?: () => void;
}

export function AddPatientModal({
  isOpen,
  onClose,
  defaultPsychologist,
  editPatient,
  onCreated,
}: AddPatientModalProps) {
  const isEditing = !!editPatient;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    email: "",
    phone: "",
    address: "",
    sessionFee: "",
    notes: "",
    whatsappConfirmation: true,
    whatsappAppointmentReminder: true,
    whatsappPaymentReminder: true,
    requiresInvoice: false,
    billingMode: "corte_mensual",
    fiscalRfc: "",
    fiscalLegalName: "",
    fiscalRegime: "",
    fiscalZipCode: "",
    fiscalCfdiUse: "D01 - Honorarios médicos, dentales y gastos hospitalarios",
    fiscalEmail: "",
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      age: "",
      email: "",
      phone: "",
      address: "",
      sessionFee: "",
      notes: "",
      whatsappConfirmation: true,
      whatsappAppointmentReminder: true,
      whatsappPaymentReminder: true,
      requiresInvoice: false,
      billingMode: "corte_mensual",
      fiscalRfc: "",
      fiscalLegalName: "",
      fiscalRegime: "",
      fiscalZipCode: "",
      fiscalCfdiUse: "D01 - Honorarios médicos, dentales y gastos hospitalarios",
      fiscalEmail: "",
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!editPatient) {
      resetForm();
      return;
    }

    const metadata = editPatient.metadata || {};
    const whatsappReminders = metadata.whatsapp_reminders || {};
    const fiscal = metadata.fiscal || {};
    setFormData({
      firstName: editPatient.nombre || "",
      lastName: editPatient.apellido || "",
      age: metadata.edad ? String(metadata.edad) : "",
      email: editPatient.email || "",
      phone: editPatient.telefono || "",
      address: metadata.direccion || "",
      sessionFee: metadata.tarifa_sesion_centavos
        ? String(Number(metadata.tarifa_sesion_centavos) / 100)
        : "",
      notes: metadata.notas || "",
      whatsappConfirmation: whatsappReminders.confirmacion_cita ?? true,
      whatsappAppointmentReminder: whatsappReminders.recordatorio_cita ?? true,
      whatsappPaymentReminder: whatsappReminders.recordatorio_pago_pendiente ?? true,
      requiresInvoice: fiscal.requiere_factura ?? false,
      billingMode: fiscal.modo_facturacion || "corte_mensual",
      fiscalRfc: fiscal.rfc || "",
      fiscalLegalName: fiscal.razon_social || "",
      fiscalRegime: fiscal.regimen_fiscal || "",
      fiscalZipCode: fiscal.codigo_postal || "",
      fiscalCfdiUse: fiscal.uso_cfdi || "D01 - Honorarios médicos, dentales y gastos hospitalarios",
      fiscalEmail: fiscal.email_facturacion || editPatient.email || "",
    });
  }, [defaultPsychologist, editPatient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      toast.error("Por favor complete los campos requeridos");
      return;
    }

    setSaving(true);

    try {
      const psychologistProfileId = await ensurePsychologistProfileId(defaultPsychologist);

      if (!psychologistProfileId) {
        toast.error("Tu usuario no tiene perfil de psicólogo vinculado. Aplica la migración 0008 en Supabase e intenta de nuevo.");
        return;
      }

      const metadata = {
        ...(editPatient?.metadata || {}),
        edad: formData.age ? Number(formData.age) : null,
        direccion: formData.address.trim() || null,
        notas: formData.notes.trim() || null,
        tarifa_sesion_centavos: formData.sessionFee
          ? Math.round(Number(formData.sessionFee) * 100)
          : null,
        whatsapp_reminders: {
          confirmacion_cita: formData.whatsappConfirmation,
          recordatorio_cita: formData.whatsappAppointmentReminder,
          recordatorio_pago_pendiente: formData.whatsappPaymentReminder,
        },
        fiscal: {
          requiere_factura: formData.requiresInvoice,
          modo_facturacion: formData.billingMode,
          rfc: formData.fiscalRfc.trim().toUpperCase() || null,
          razon_social: formData.fiscalLegalName.trim() || null,
          regimen_fiscal: formData.fiscalRegime.trim() || null,
          codigo_postal: formData.fiscalZipCode.trim() || null,
          uso_cfdi: formData.fiscalCfdiUse.trim() || null,
          email_facturacion: formData.fiscalEmail.trim() || null,
        },
      };

      const payload = {
        ...(!isEditing ? { creado_por_psicologo_id: psychologistProfileId, fuente: "privado" } : {}),
        nombre: formData.firstName.trim(),
        apellido: formData.lastName.trim(),
        email: formData.email.trim() || null,
        telefono: formData.phone.trim(),
        estado: "activo",
        metadata,
      };

      await supabaseRest(isEditing ? `/pacientes?id=eq.${editPatient?.id}` : "/pacientes", {
        method: isEditing ? "PATCH" : "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });

      toast.success(isEditing ? "Paciente actualizado" : "Paciente registrado exitosamente");
      resetForm();
      onCreated?.();
      onClose();
    } catch (error: any) {
      console.error("Create patient error:", error);
      toast.error(`No se pudo guardar el paciente en la base de datos. ${error?.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Paciente" : "Registrar Nuevo Paciente"}</DialogTitle>
          <DialogDescription>
            Complete la información del paciente y su tarifa base
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="Nombre"
                className="bg-input-background"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Apellido <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Apellido"
                className="bg-input-background"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age">Edad</Label>
            <Input
              id="age"
              type="number"
              placeholder="Edad"
              className="bg-input-background"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="bg-input-background"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+52 55 1234 5678"
                className="bg-input-background"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionFee">Tarifa por sesión</Label>
            <Input
              id="sessionFee"
              type="number"
              min="0"
              step="1"
              placeholder="$0"
              className="bg-input-background"
              value={formData.sessionFee}
              onChange={(e) =>
                setFormData({ ...formData, sessionFee: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Se usará como monto sugerido al crear una cita, pero podrás editarlo en cada cita.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-4">
            <div>
              <Label>Recordatorios por WhatsApp</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Configura qué mensajes puede recibir este paciente por WhatsApp.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">Confirmación de cita</p>
                <p className="text-xs text-muted-foreground">Mensaje al crear o confirmar una cita.</p>
              </div>
              <Switch
                checked={formData.whatsappConfirmation}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, whatsappConfirmation: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">Recordatorio de cita</p>
                <p className="text-xs text-muted-foreground">Mensaje antes de la sesión.</p>
              </div>
              <Switch
                checked={formData.whatsappAppointmentReminder}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, whatsappAppointmentReminder: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">Pago pendiente</p>
                <p className="text-xs text-muted-foreground">Mensaje cuando tenga pagos por cubrir.</p>
              </div>
              <Switch
                checked={formData.whatsappPaymentReminder}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, whatsappPaymentReminder: checked })
                }
              />
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label>Facturación del paciente</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Configura si este paciente requiere factura. Esta información queda lista para conectar al timbrado real.
                </p>
              </div>
              <Switch
                checked={formData.requiresInvoice}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresInvoice: checked })
                }
              />
            </div>

            {formData.requiresInvoice && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingMode">Modo de facturación</Label>
                    <Select
                      value={formData.billingMode}
                      onValueChange={(value) => setFormData({ ...formData, billingMode: value })}
                    >
                      <SelectTrigger className="bg-input-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="por_cita">Factura por cita</SelectItem>
                        <SelectItem value="corte_mensual">Corte mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscalEmail">Email de facturación</Label>
                    <Input
                      id="fiscalEmail"
                      type="email"
                      placeholder="facturas@correo.com"
                      className="bg-input-background"
                      value={formData.fiscalEmail}
                      onChange={(e) => setFormData({ ...formData, fiscalEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscalRfc">RFC</Label>
                    <Input
                      id="fiscalRfc"
                      placeholder="XAXX010101000"
                      className="bg-input-background uppercase"
                      value={formData.fiscalRfc}
                      onChange={(e) => setFormData({ ...formData, fiscalRfc: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscalLegalName">Razón social</Label>
                    <Input
                      id="fiscalLegalName"
                      placeholder="Nombre o razón social"
                      className="bg-input-background"
                      value={formData.fiscalLegalName}
                      onChange={(e) => setFormData({ ...formData, fiscalLegalName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscalRegime">Régimen fiscal</Label>
                    <Input
                      id="fiscalRegime"
                      placeholder="Ej. 612 - Personas físicas..."
                      className="bg-input-background"
                      value={formData.fiscalRegime}
                      onChange={(e) => setFormData({ ...formData, fiscalRegime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscalZipCode">Código postal fiscal</Label>
                    <Input
                      id="fiscalZipCode"
                      placeholder="44100"
                      className="bg-input-background"
                      value={formData.fiscalZipCode}
                      onChange={(e) => setFormData({ ...formData, fiscalZipCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fiscalCfdiUse">Uso CFDI</Label>
                  <Input
                    id="fiscalCfdiUse"
                    placeholder="D01 - Honorarios médicos, dentales y gastos hospitalarios"
                    className="bg-input-background"
                    value={formData.fiscalCfdiUse}
                    onChange={(e) => setFormData({ ...formData, fiscalCfdiUse: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Dirección completa"
              className="bg-input-background"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Información adicional relevante..."
              className="bg-input-background min-h-[100px]"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={saving}
            >
              {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Guardar Paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
