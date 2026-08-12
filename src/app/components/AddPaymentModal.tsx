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
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarCheck2, WalletCards } from "lucide-react";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Array<{ id: string; name: string }>;
  psychologists: Array<{ id: string; name: string }>;
  defaultPsychologist?: string;
  onPaymentCreated?: () => void;
  prefilledData?: { patient?: string; appointment?: string; amount?: string };
  prefilledPayment?: { id: string; patientId: string; amount: number };
}

interface PendingIncome {
  id: string;
  paciente_id: string;
  monto_centavos: number;
  estado: "pendiente_aplicar" | "aplicado" | "cancelado";
  fecha_pago: string;
  referencia?: string | null;
  notas?: string | null;
  pacientes?: { nombre?: string | null; apellido?: string | null } | null;
}

interface IncomeApplication {
  ingreso_paciente_id: string | null;
  monto_centavos: number;
  estado: string;
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

function fullName(person?: { nombre?: string | null; apellido?: string | null } | null) {
  return `${person?.nombre || ""} ${person?.apellido || ""}`.trim();
}

function centsFromAmount(amount: string) {
  return Math.round(Number(amount) * 100);
}

function appointmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    solicitada: "Agendada",
    agendada: "Agendada",
    confirmada: "Agendada",
    completada: "Agendada",
    cancelada: "Cancelada",
    no_asistio: "No asistió",
  };

  return labels[status] || status;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function AddPaymentModal({
  isOpen,
  onClose,
  patients,
  defaultPsychologist,
  onPaymentCreated,
  prefilledData,
  prefilledPayment,
}: AddPaymentModalProps) {
  const isApplyingFromAppointment = Boolean(prefilledData?.appointment && prefilledData?.patient);
  const isApplyingFromPayment = Boolean(prefilledPayment?.id && prefilledPayment?.patientId);
  const isApplying = isApplyingFromAppointment || isApplyingFromPayment;
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [pendingIncomes, setPendingIncomes] = useState<PendingIncome[]>([]);
  const [applications, setApplications] = useState<IncomeApplication[]>([]);
  const [appointments, setAppointments] = useState<UnpaidAppointment[]>([]);
  const [formData, setFormData] = useState({
    patient: prefilledData?.patient || prefilledPayment?.patientId || "",
    incomeId: prefilledPayment?.id || "",
    appointment: prefilledData?.appointment || "",
    amount: prefilledData?.amount || "",
    date: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      patient: prefilledData?.patient || prefilledPayment?.patientId || "",
      incomeId: prefilledPayment?.id || "",
      appointment: prefilledData?.appointment || "",
      amount: prefilledData?.amount || "",
      date: new Date().toISOString().slice(0, 10),
      reference: "",
      notes: "",
    });
  }, [isOpen, prefilledData?.amount, prefilledData?.appointment, prefilledData?.patient, prefilledPayment?.id, prefilledPayment?.patientId]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    async function loadData() {
      setLoadingData(true);
      try {
        const resolvedProfileId = await resolvePsychologistProfileId(defaultPsychologist);
        if (!active) return;
        setProfileId(resolvedProfileId);

        if (!resolvedProfileId) {
          setPendingIncomes([]);
          setAppointments([]);
          return;
        }

        let [incomeRows, appointmentRows] = await Promise.all([
          supabaseRest<PendingIncome[]>(
            `/ingresos_paciente?psicologo_id=eq.${resolvedProfileId}&estado=eq.pendiente_aplicar&select=id,paciente_id,monto_centavos,estado,fecha_pago,referencia,notas,pacientes(nombre,apellido)&order=fecha_pago.desc,created_at.desc`
          ).catch((error: any) => {
            if (String(error?.message || "").includes("ingresos_paciente")) return [];
            throw error;
          }),
          supabaseRest<UnpaidAppointment[]>(
            `/citas?psicologo_id=eq.${resolvedProfileId}&estado=in.(solicitada,agendada,confirmada,completada)&select=id,paciente_id,inicia_at,estado,costo_centavos,pacientes(nombre,apellido),pagos_cita(estado)&order=inicia_at.desc`
          ),
        ]);

        if (!active) return;
        if (prefilledPayment?.id && !incomeRows.some((income) => income.id === prefilledPayment.id)) {
          const selectedIncomeRows = await supabaseRest<PendingIncome[]>(
            `/ingresos_paciente?id=eq.${prefilledPayment.id}&psicologo_id=eq.${resolvedProfileId}&select=id,paciente_id,monto_centavos,estado,fecha_pago,referencia,notas,pacientes(nombre,apellido)&limit=1`
          ).catch((error: any) => {
            if (String(error?.message || "").includes("ingresos_paciente")) return [];
            throw error;
          });

          incomeRows = [...selectedIncomeRows, ...incomeRows];
        }

        const incomeIds = incomeRows.map((income) => income.id);
        const applicationRows = incomeIds.length
          ? await supabaseRest<IncomeApplication[]>(
              `/pagos_cita?ingreso_paciente_id=in.(${incomeIds.join(",")})&estado=eq.pagado&select=ingreso_paciente_id,monto_centavos,estado`
            ).catch((error: any) => {
              if (String(error?.message || "").includes("ingreso_paciente_id")) return [];
              throw error;
            })
          : [];

        if (!active) return;
        setPendingIncomes(incomeRows);
        setApplications(applicationRows);
        setAppointments(
          appointmentRows.filter((appointment) =>
            !appointment.pagos_cita?.some((payment) => payment.estado === "pagado")
          )
        );
      } catch (error: any) {
        console.error("Payment modal load error:", error);
        toast.error(`No se pudieron cargar los datos de pagos. ${error?.message || ""}`);
      } finally {
        if (active) setLoadingData(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [defaultPsychologist, isOpen, prefilledPayment?.id]);

  const selectablePatients = useMemo(() => {
    const map = new Map<string, string>();
    patients.forEach((patient) => map.set(patient.id, patient.name));
    pendingIncomes.forEach((income) => map.set(income.paciente_id, fullName(income.pacientes) || "Paciente sin nombre"));
    appointments.forEach((appointment) => map.set(appointment.paciente_id, fullName(appointment.pacientes) || "Paciente sin nombre"));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments, patients, pendingIncomes]);

  const patientPendingIncomes = pendingIncomes.filter((income) => income.paciente_id === formData.patient);
  const patientAppointments = appointments.filter((appointment) => appointment.paciente_id === formData.patient);
  const selectedIncome = pendingIncomes.find((income) => income.id === formData.incomeId);
  const selectedAppointment = appointments.find((appointment) => appointment.id === formData.appointment);
  const selectedIncomeApplied = applications
    .filter((application) => application.ingreso_paciente_id === formData.incomeId)
    .reduce((total, application) => total + application.monto_centavos, 0);
  const selectedIncomeRemaining = Math.max(0, (selectedIncome?.monto_centavos || prefilledPayment?.amount || 0) - selectedIncomeApplied);

  const resetAndClose = () => {
    onPaymentCreated?.();
    onClose();
  };

  const applyIncomeToAppointment = async () => {
    if (!profileId || !formData.incomeId || !formData.appointment) {
      toast.error("Selecciona el ingreso y la cita para hacer el cruce.");
      return;
    }

    let income = selectedIncome || pendingIncomes.find((item) => item.id === formData.incomeId);
    if (!income) {
      const incomeRows = await supabaseRest<PendingIncome[]>(
        `/ingresos_paciente?id=eq.${formData.incomeId}&psicologo_id=eq.${profileId}&select=id,paciente_id,monto_centavos,estado,fecha_pago,referencia,notas,pacientes(nombre,apellido)&limit=1`
      ).catch((error: any) => {
        if (String(error?.message || "").includes("ingresos_paciente")) return [];
        throw error;
      });
      income = incomeRows[0];
    }

    if (!income) {
      toast.error("No se encontró el ingreso pendiente.");
      return;
    }

    setSaving(true);
    try {
      const appointmentCost = selectedAppointment?.costo_centavos || income.monto_centavos;
      const alreadyApplied = applications
        .filter((application) => application.ingreso_paciente_id === income.id)
        .reduce((total, application) => total + application.monto_centavos, 0);
      const remaining = Math.max(0, income.monto_centavos - alreadyApplied);
      const amountToApply = Math.min(remaining, appointmentCost);

      if (amountToApply <= 0) {
        toast.error("Este ingreso ya no tiene saldo pendiente por aplicar.");
        return;
      }

      await supabaseRest("/pagos_cita", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          cita_id: formData.appointment,
          pagador_tipo: "paciente",
          monto_centavos: amountToApply,
          moneda: "MXN",
          estado: "pagado",
          proveedor_pago: "ingreso_recibido",
          ingreso_paciente_id: income.id,
          referencia_externa: income.referencia || null,
          pagado_at: new Date(`${income.fecha_pago}T12:00:00`).toISOString(),
        }),
      });

      const nextRemaining = remaining - amountToApply;
      await supabaseRest(`/ingresos_paciente?id=eq.${income.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          estado: nextRemaining <= 0 ? "aplicado" : "pendiente_aplicar",
          aplicado_a_cita_id: nextRemaining <= 0 ? formData.appointment : null,
          aplicado_at: nextRemaining <= 0 ? new Date().toISOString() : null,
        }),
      });

      toast.success(`Se aplicaron ${formatMoney(amountToApply)} a la cita.`);
      resetAndClose();
    } catch (error: any) {
      console.error("Apply income error:", error);
      if (
        error?.code === "PGRST204"
        || String(error?.message || "").includes("ingreso_paciente_id")
      ) {
        toast.error("Falta actualizar Supabase: aplica la migración de pagos parciales y recarga el schema cache.");
        return;
      }
      toast.error(`No se pudo aplicar el ingreso. ${error?.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isApplying) {
      await applyIncomeToAppointment();
      return;
    }

    if (!profileId || !formData.patient || !formData.amount || !formData.date) {
      toast.error("Selecciona paciente, fecha y monto.");
      return;
    }

    const amountCents = centsFromAmount(formData.amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      toast.error("Ingresa un monto válido.");
      return;
    }

    setSaving(true);
    try {
      await supabaseRest("/ingresos_paciente", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          psicologo_id: profileId,
          paciente_id: formData.patient,
          monto_centavos: amountCents,
          moneda: "MXN",
          estado: "pendiente_aplicar",
          fecha_pago: formData.date,
          referencia: formData.reference.trim() || null,
          notas: formData.notes.trim() || null,
        }),
      });

      toast.success("Ingreso registrado como Pendiente de aplicar.");
      resetAndClose();
    } catch (error: any) {
      console.error("Create income error:", error);
      toast.error(`No se pudo registrar el ingreso. ${error?.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isApplying ? "Aplicar ingreso a cita" : "Registrar ingreso"}</DialogTitle>
          <DialogDescription>
            {isApplying
              ? "Cruza un ingreso pendiente contra una cita no pagada."
              : "Registra dinero recibido. Quedará como Pendiente de aplicar hasta cruzarlo con una cita."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isApplying && (
            <>
              <div className="space-y-2">
                <Label>Paciente <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.patient}
                  onValueChange={(value) => setFormData({ ...formData, patient: value })}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(event) => setFormData({ ...formData, date: event.target.value })}
                    className="bg-input-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="$0"
                    value={formData.amount}
                    onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                    className="bg-input-background"
                  />
                </div>
              </div>
            </>
          )}

          {isApplying && (
            <>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="text-foreground">
                  {selectablePatients.find((patient) => patient.id === formData.patient)?.name || "Paciente seleccionado"}
                </p>
              </div>

              {isApplyingFromAppointment ? (
                <div className="space-y-2">
                  <Label>Ingreso pendiente <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.incomeId}
                    onValueChange={(value) => setFormData({ ...formData, incomeId: value })}
                    disabled={loadingData}
                  >
                    <SelectTrigger className="bg-input-background">
                      <SelectValue placeholder="Seleccionar ingreso no aplicado" />
                    </SelectTrigger>
                    <SelectContent>
                  {patientPendingIncomes.map((income) => (
                    <SelectItem key={income.id} value={income.id}>
                      {formatMoney(Math.max(
                        0,
                        income.monto_centavos - applications
                          .filter((application) => application.ingreso_paciente_id === income.id)
                          .reduce((total, application) => total + application.monto_centavos, 0)
                      ))} por aplicar · {format(new Date(`${income.fecha_pago}T12:00:00`), "dd MMM yyyy", { locale: es })}
                    </SelectItem>
                  ))}
                    </SelectContent>
                  </Select>
                  {patientPendingIncomes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Este paciente no tiene ingresos pendientes de aplicar. Registra primero el ingreso desde Pagos.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Ingreso seleccionado</p>
                      <p className="text-foreground">{formatMoney(prefilledPayment?.amount || selectedIncome?.monto_centavos || 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        Por aplicar: {formatMoney(selectedIncomeRemaining)}
                      </p>
                    </div>
                    <Badge className="bg-[#FFB74D] text-white">Pendiente de aplicar</Badge>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Cita no pagada <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.appointment}
                  onValueChange={(value) => setFormData({ ...formData, appointment: value })}
                  disabled={Boolean(prefilledData?.appointment) || loadingData}
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Seleccionar cita no pagada" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientAppointments.map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        {format(new Date(appointment.inicia_at), "dd MMM yyyy, HH:mm", { locale: es })} · {appointmentStatusLabel(appointment.estado)} · {formatMoney(appointment.costo_centavos || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {patientAppointments.length === 0 && (
                  <p className="text-xs text-muted-foreground">Este paciente no tiene citas pendientes de pago.</p>
                )}
              </div>
            </>
          )}

          {!isApplying && (
            <>
              <div className="space-y-2">
                <Label>Referencia</Label>
                <Input
                  placeholder="Transferencia, efectivo, nota interna..."
                  value={formData.reference}
                  onChange={(event) => setFormData({ ...formData, reference: event.target.value })}
                  className="bg-input-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observaciones del ingreso..."
                  value={formData.notes}
                  onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                  className="bg-input-background min-h-[80px]"
                />
              </div>
            </>
          )}

          <div className="rounded-xl border border-border bg-primary/5 p-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              {isApplying ? <CalendarCheck2 className="h-5 w-5 text-primary" /> : <WalletCards className="h-5 w-5 text-primary" />}
              <p>
                {isApplying
                  ? "Al aplicar, se marcará la cita como pagada y el ingreso dejará de aparecer como pendiente."
                  : "Este registro no paga una cita todavía; solo confirma que recibiste dinero del paciente."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || loadingData} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? "Guardando..." : isApplying ? "Aplicar a cita" : "Guardar ingreso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
