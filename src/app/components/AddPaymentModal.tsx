import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Array<{ id: string; name: string }>;
  psychologists: Array<{ id: string; name: string }>;
  defaultPsychologist?: string;
  onPaymentCreated?: () => void;
  prefilledData?: { patient?: string; amount?: string };
}

interface BankAccount {
  id: string;
  nombre: string;
  banco?: string | null;
  ultimos_4?: string | null;
  moneda: string;
}

interface UnpaidAppointment {
  id: string;
  paciente_id: string;
  inicia_at: string;
  estado: string;
  costo_centavos?: number | null;
  pacientes?: { nombre?: string | null; apellido?: string | null } | null;
  pagos_cita?: Array<{ estado: string }>;
}

interface PatientBalance {
  paciente_id: string;
  saldo_centavos: number;
}

function fullName(person?: { nombre?: string | null; apellido?: string | null } | null) {
  return `${person?.nombre || ""} ${person?.apellido || ""}`.trim();
}

function appointmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    solicitada: "Solicitada",
    agendada: "Agendada",
    confirmada: "Confirmada",
    completada: "Completada",
    no_asistio: "No asistió",
  };

  return labels[status] || status;
}

function centsFromAmount(amount: string) {
  return Math.round(Number(amount) * 100);
}

export function AddPaymentModal({
  isOpen,
  onClose,
  patients,
  psychologists,
  defaultPsychologist,
  onPaymentCreated,
  prefilledData,
}: AddPaymentModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<UnpaidAppointment[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [balances, setBalances] = useState<PatientBalance[]>([]);
  const [formData, setFormData] = useState({
    mode: "appointment",
    paymentSource: "transfer",
    patient: prefilledData?.patient || "",
    appointment: "",
    psychologist: defaultPsychologist || "",
    amount: prefilledData?.amount || "",
    bankAccountId: "",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    async function loadPaymentData() {
      setLoadingData(true);

      try {
        const resolvedProfileId = await resolvePsychologistProfileId(defaultPsychologist);

        if (!active) return;
        setProfileId(resolvedProfileId);

        if (!resolvedProfileId) {
          setAppointments([]);
          setBankAccounts([]);
          setBalances([]);
          return;
        }

        const [appointmentRows, accounts, balanceRows] = await Promise.all([
          supabaseRest<UnpaidAppointment[]>(
            `/citas?psicologo_id=eq.${resolvedProfileId}&estado=in.(solicitada,agendada,confirmada,completada)&select=id,paciente_id,inicia_at,estado,costo_centavos,pacientes(nombre,apellido),pagos_cita(estado)&order=inicia_at.desc`
          ),
          supabaseRest<BankAccount[]>(
            `/cuentas_bancarias?psicologo_id=eq.${resolvedProfileId}&estado=eq.activa&select=id,nombre,banco,ultimos_4,moneda&order=created_at.asc`
          ),
          supabaseRest<PatientBalance[]>(
            `/v_saldos_paciente?psicologo_id=eq.${resolvedProfileId}&select=paciente_id,saldo_centavos`
          ),
        ]);

        if (!active) return;
        setAppointments(
          appointmentRows.filter((appointment) =>
            !appointment.pagos_cita?.some((payment) => payment.estado === "pagado")
          )
        );
        setBankAccounts(accounts);
        setBalances(balanceRows);
        setFormData((current) => ({
          ...current,
          psychologist: defaultPsychologist || current.psychologist,
          bankAccountId: accounts[0]?.id || "",
        }));
      } catch (error: any) {
        console.error("Payment modal load error:", error);
        toast.error(`No se pudieron cargar los datos de pago. ${error?.message || ""}`);
      } finally {
        if (active) setLoadingData(false);
      }
    }

    loadPaymentData();

    return () => {
      active = false;
    };
  }, [defaultPsychologist, isOpen]);

  const selectablePatients = useMemo(() => {
    const patientMap = new Map<string, string>();

    patients.forEach((patient) => patientMap.set(patient.id, patient.name));
    appointments.forEach((appointment) => {
      patientMap.set(appointment.paciente_id, fullName(appointment.pacientes) || "Paciente sin nombre");
    });

    return Array.from(patientMap.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments, patients]);

  const patientAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.paciente_id === formData.patient),
    [appointments, formData.patient]
  );

  const selectedAppointment = appointments.find((appointment) => appointment.id === formData.appointment);
  const selectedBalance = balances.find((balance) => balance.paciente_id === formData.patient)?.saldo_centavos || 0;
  const usesCredit = formData.mode === "appointment" && formData.paymentSource === "credit";
  const needsBankAccount = formData.mode === "advance" || formData.paymentSource === "transfer";

  const handleCreateDefaultAccount = async () => {
    if (!profileId) {
      toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
      return;
    }

    try {
      const created = await supabaseRest<BankAccount[]>("/cuentas_bancarias", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          psicologo_id: profileId,
          nombre: "Cuenta BBVA",
          banco: "BBVA",
          moneda: "MXN",
          estado: "activa",
        }),
      });

      const nextAccount = created[0];
      setBankAccounts((current) => [...current, nextAccount]);
      setFormData((current) => ({ ...current, bankAccountId: nextAccount.id }));
      toast.success("Cuenta BBVA agregada");
    } catch (error: any) {
      console.error("Create bank account error:", error);
      toast.error(`No se pudo crear la cuenta bancaria. ${error?.message || ""}`);
    }
  };

  const resetAndClose = () => {
    setFormData({
      mode: "appointment",
      paymentSource: "transfer",
      patient: "",
      appointment: "",
      psychologist: defaultPsychologist || "",
      amount: "",
      bankAccountId: bankAccounts[0]?.id || "",
      reference: "",
      notes: "",
    });
    setDate(new Date());
    onPaymentCreated?.();
    onClose();
  };

  const createBankMovement = (paymentId: string | null, amountCents: number, description: string) =>
    supabaseRest("/movimientos_cuenta_bancaria", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        cuenta_bancaria_id: formData.bankAccountId,
        pago_cita_id: paymentId,
        tipo: "ingreso",
        monto_centavos: amountCents,
        descripcion: description,
        referencia: formData.reference || null,
        movimiento_at: date.toISOString(),
      }),
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileId || !formData.patient || !formData.psychologist || !formData.amount) {
      toast.error("Por favor complete los campos requeridos");
      return;
    }

    if (formData.mode === "appointment" && !formData.appointment) {
      toast.error("Selecciona una cita no pagada");
      return;
    }

    if (needsBankAccount && !formData.bankAccountId) {
      toast.error("Selecciona una cuenta bancaria");
      return;
    }

    setSaving(true);

    try {
      const amountCents = centsFromAmount(formData.amount);

      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        toast.error("Ingresa un monto válido");
        return;
      }

      if (formData.mode === "advance") {
        const advance = await supabaseRest<Array<{ id: string }>>("/pagos_anticipados_paciente", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            psicologo_id: profileId,
            paciente_id: formData.patient,
            cuenta_bancaria_id: formData.bankAccountId,
            monto_centavos: amountCents,
            moneda: "MXN",
            referencia: formData.reference || null,
            notas: formData.notes || null,
            pagado_at: date.toISOString(),
          }),
        });

        await Promise.all([
          createBankMovement(null, amountCents, "Anticipo / saldo a favor"),
          supabaseRest("/movimientos_saldo_paciente", {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify({
              psicologo_id: profileId,
              paciente_id: formData.patient,
              pago_anticipado_id: advance[0]?.id,
              tipo: "ingreso",
              monto_centavos: amountCents,
              descripcion: "Anticipo / saldo a favor",
              movimiento_at: date.toISOString(),
            }),
          }),
        ]);

        toast.success("Anticipo registrado como saldo a favor");
        resetAndClose();
        return;
      }

      if (usesCredit && selectedBalance < amountCents) {
        toast.error(`Saldo insuficiente. Disponible: $${Math.round(selectedBalance / 100).toLocaleString()}`);
        return;
      }

      const payment = await supabaseRest<Array<{ id: string }>>("/pagos_cita", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          cita_id: formData.appointment,
          pagador_tipo: "paciente",
          monto_centavos: amountCents,
          moneda: "MXN",
          estado: "pagado",
          proveedor_pago: usesCredit ? "saldo_a_favor" : "transferencia",
          referencia_externa: formData.reference || null,
          cuenta_bancaria_id: usesCredit ? null : formData.bankAccountId,
          pagado_at: date.toISOString(),
        }),
      });

      if (usesCredit) {
        await supabaseRest("/movimientos_saldo_paciente", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            psicologo_id: profileId,
            paciente_id: formData.patient,
            cita_id: formData.appointment,
            tipo: "aplicacion",
            monto_centavos: amountCents,
            descripcion: "Aplicación de saldo a favor a cita",
            movimiento_at: date.toISOString(),
          }),
        });
      } else {
        await createBankMovement(
          payment[0]?.id,
          amountCents,
          `Pago de cita${selectedAppointment ? ` - ${fullName(selectedAppointment.pacientes)}` : ""}`
        );
      }

      toast.success(usesCredit ? "Saldo aplicado a la cita" : "Pago registrado como pagado");
      resetAndClose();
    } catch (error: any) {
      console.error("Create payment error:", error);
      toast.error(`No se pudo registrar el pago. ${error?.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Registra una cita pagada o un anticipo para usarlo como saldo a favor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de registro</Label>
              <Select
                value={formData.mode}
                onValueChange={(value) =>
                  setFormData({ ...formData, mode: value, appointment: "", amount: "", paymentSource: "transfer" })
                }
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Pago de cita</SelectItem>
                  <SelectItem value="advance">Anticipo / saldo a favor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.mode === "appointment" && (
              <div className="space-y-2">
                <Label>Forma de pago</Label>
                <Select
                  value={formData.paymentSource}
                  onValueChange={(value) => setFormData({ ...formData, paymentSource: value })}
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transferencia nueva</SelectItem>
                    <SelectItem value="credit">Aplicar saldo a favor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Paciente <span className="text-destructive">*</span></Label>
            <Select
              value={formData.patient}
              onValueChange={(value) =>
                setFormData({ ...formData, patient: value, appointment: "", amount: "" })
              }
              disabled={loadingData}
            >
              <SelectTrigger className="bg-input-background">
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                {selectablePatients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>{patient.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.patient && (
              <p className="text-xs text-muted-foreground">
                Saldo a favor disponible: ${Math.round(selectedBalance / 100).toLocaleString()}
              </p>
            )}
          </div>

          {formData.mode === "appointment" && (
            <div className="space-y-2">
              <Label>Cita no pagada <span className="text-destructive">*</span></Label>
              <Select
                value={formData.appointment}
                onValueChange={(value) => {
                  const appointment = appointments.find((item) => item.id === value);
                  setFormData({
                    ...formData,
                    appointment: value,
                    amount: appointment?.costo_centavos ? String(appointment.costo_centavos / 100) : formData.amount,
                  });
                }}
                disabled={!formData.patient || loadingData}
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue placeholder={formData.patient ? "Seleccionar cita" : "Primero selecciona paciente"} />
                </SelectTrigger>
                <SelectContent>
                  {patientAppointments.map((appointment) => (
                    <SelectItem key={appointment.id} value={appointment.id}>
                      {format(new Date(appointment.inicia_at), "dd MMM yyyy, HH:mm", { locale: es })} · {appointmentStatusLabel(appointment.estado)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.patient && patientAppointments.length === 0 && (
                <p className="text-xs text-muted-foreground">Este paciente no tiene citas pendientes de pago.</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Psicólogo <span className="text-destructive">*</span></Label>
            <Select
              value={formData.psychologist}
              onValueChange={(value) => setFormData({ ...formData, psychologist: value })}
              disabled={!!defaultPsychologist}
            >
              <SelectTrigger className="bg-input-background">
                <SelectValue placeholder="Seleccionar psicólogo" />
              </SelectTrigger>
              <SelectContent>
                {psychologists.map((psychologist) => (
                  <SelectItem key={psychologist.id} value={psychologist.id}>{psychologist.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha del pago</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left bg-input-background">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PP", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(newDate) => newDate && setDate(newDate)} locale={es} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                placeholder="$0.00"
                className="bg-input-background"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            {needsBankAccount && (
              <div className="space-y-2">
                <Label>Cuenta destino <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.bankAccountId}
                  onValueChange={(value) => setFormData({ ...formData, bankAccountId: value })}
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.nombre}{account.ultimos_4 ? ` •••• ${account.ultimos_4}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {needsBankAccount && bankAccounts.length === 0 && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground mb-3">
                Agrega una cuenta para registrar transferencias y generar estado de cuenta.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleCreateDefaultAccount}>
                Crear Cuenta BBVA
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Referencia / No. de transacción</Label>
            <Input
              placeholder="Número de referencia o transacción"
              className="bg-input-background"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observaciones adicionales..."
              className="bg-input-background min-h-[80px]"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving || loadingData}>
              {saving ? "Guardando..." : "Guardar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
