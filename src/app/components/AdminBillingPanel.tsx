import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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
import { CheckCircle2, CreditCard, Eye, FileText, Printer, Receipt, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { supabaseFunction, supabaseRest } from "../../services/api";

interface PsychologistRow {
  id: string;
  usuario_id: string;
  membresia: string;
  estado: string;
}

interface UserRow {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

interface BillingSetting {
  id: string;
  psicologo_id: string;
  plan_nombre: string;
  mensualidad_centavos: number;
  dia_corte: number;
  moneda: string;
  requiere_factura: boolean;
  estado: string;
}

interface BillingDocument {
  id: string;
  psicologo_id: string;
  settings_id?: string | null;
  periodo_inicio: string;
  periodo_fin: string;
  tipo: "pre_factura" | "factura" | "cobro";
  estado: "borrador" | "emitida" | "enviada" | "pagada" | "cancelada" | "error";
  subtotal_centavos: number;
  iva_centavos: number;
  total_centavos: number;
  concepto: string;
  emitted_at?: string | null;
  paid_at?: string | null;
}

interface StripeCustomer {
  id: string;
  psicologo_id: string;
  stripe_customer_id: string;
  default_payment_method_id?: string | null;
  card_brand?: string | null;
  card_last4?: string | null;
  card_exp_month?: number | null;
  card_exp_year?: number | null;
}

interface SubscriptionRow {
  id: string;
  psicologo_id: string;
  plan_id: string;
  estado: "activa" | "cancelada" | "pausada";
  current_period_start?: string | null;
  current_period_end?: string | null;
  next_billing_at?: string | null;
  last_charge_at?: string | null;
  planes_suscripcion_psicologo?: SubscriptionPlanRow | SubscriptionPlanRow[] | null;
}

interface StripeCharge {
  id: string;
  psicologo_id: string;
  amount_centavos: number;
  moneda: string;
  estado: "pendiente" | "procesando" | "pagado" | "fallido" | "cancelado";
  paid_at?: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

interface BillingRow {
  psychologist: PsychologistRow;
  user?: UserRow;
  setting?: BillingSetting;
  latestDocument?: BillingDocument;
  stripeCustomer?: StripeCustomer;
  subscription?: SubscriptionRow;
  latestCharge?: StripeCharge;
}

interface SubscriptionPlanRow {
  id: string;
  codigo: string;
  nombre: string;
  precio_mensual_centavos: number;
  limite_citas_mensuales: number | null;
  orden: number;
}

const SUBSCRIPTION_PLANS_CACHE_KEY = "mindcare_subscription_plans_cache";

function cacheSubscriptionPlans(plans: SubscriptionPlanRow[]) {
  try {
    localStorage.setItem(SUBSCRIPTION_PLANS_CACHE_KEY, JSON.stringify(plans));
  } catch (error) {
    console.warn("No se pudo guardar cache local de planes:", error);
  }
}

interface InvoicePreviewData {
  row: BillingRow;
  document?: BillingDocument;
  draft: { plan: string; amount: string; cutDay: string };
}

const documentStatus: Record<string, { label: string; className: string }> = {
  borrador: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  emitida: { label: "Emitida", className: "bg-[#4DD0E1] text-white" },
  enviada: { label: "Enviada", className: "bg-[#FFB74D] text-white" },
  pagada: { label: "Pagada", className: "bg-[#81C784] text-white" },
  cancelada: { label: "Cancelada", className: "bg-destructive text-destructive-foreground" },
  error: { label: "Error", className: "bg-destructive text-destructive-foreground" },
};

function currencyFromCents(cents = 0) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function minimumStripeChargeCents(currency = "MXN") {
  const minimums: Record<string, number> = {
    MXN: 1000,
    USD: 50,
    EUR: 50,
  };
  return minimums[currency.toUpperCase()] || 1000;
}

function fullName(user?: UserRow) {
  return `${user?.nombre || ""} ${user?.apellido || ""}`.trim() || "Psicólogo sin nombre";
}

function monthPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: now.toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
  };
}

function longDate(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function shortDateTime(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function planFromSubscription(subscription?: SubscriptionRow) {
  const plan = subscription?.planes_suscripcion_psicologo;
  return Array.isArray(plan) ? plan[0] : plan;
}

function chargeStatusClass(status?: string) {
  if (status === "pagado") return "bg-[#81C784] text-white";
  if (status === "procesando" || status === "pendiente") return "bg-[#FFB74D] text-white";
  if (status === "fallido" || status === "cancelado") return "bg-destructive text-destructive-foreground";
  return "bg-muted text-muted-foreground";
}

function invoiceFolio(document?: BillingDocument) {
  const suffix = document?.id ? document.id.slice(0, 8).toUpperCase() : "DEMO-0001";
  return `MC-${new Date().getFullYear()}-${suffix}`;
}

function defaultSetting(row: PsychologistRow): Partial<BillingSetting> {
  if (row.membresia === "independiente_pro") {
    return { plan_nombre: "pro", mensualidad_centavos: 25000, dia_corte: 1, moneda: "MXN", requiere_factura: true, estado: "activo" };
  }
  if (row.membresia === "independiente_basico") {
    return { plan_nombre: "intermedio", mensualidad_centavos: 15000, dia_corte: 1, moneda: "MXN", requiere_factura: true, estado: "activo" };
  }
  if (row.membresia === "red_afiliado") {
    return { plan_nombre: "afiliado", mensualidad_centavos: 0, dia_corte: 1, moneda: "MXN", requiere_factura: false, estado: "activo" };
  }
  return { plan_nombre: "basico", mensualidad_centavos: 0, dia_corte: 1, moneda: "MXN", requiere_factura: true, estado: "activo" };
}

function MonthlyInvoicePreview({ data, period }: { data: InvoicePreviewData; period: ReturnType<typeof monthPeriod> }) {
  const { row, document, draft } = data;
  const subtotalCents = document?.subtotal_centavos ?? Math.round(Number(draft.amount || 0) * 100);
  const ivaCents = document?.iva_centavos ?? Math.round(subtotalCents * 0.16);
  const totalCents = document?.total_centavos ?? subtotalCents + ivaCents;
  const folio = invoiceFolio(document);
  const concept = document?.concepto || `Mensualidad MindCare ${period.label} - Plan ${draft.plan}`;

  return (
    <div className="bg-white text-slate-950 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-950 text-white px-8 py-7">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">MindCare</p>
                <p className="text-xs text-slate-300">Plataforma de gestión psicológica</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">Emisor</p>
            <p className="font-semibold">MINDCARE TECHNOLOGIES S.A. DE C.V.</p>
            <p className="text-sm text-slate-300">RFC: MTE240101AB1</p>
            <p className="text-sm text-slate-300">Régimen fiscal: 601 - General de Ley Personas Morales</p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm text-slate-300">Factura mensual</p>
            <p className="text-2xl font-semibold">{folio}</p>
            <div className="mt-4 space-y-1 text-sm text-slate-300">
              <p>Fecha de emisión: {longDate(document?.emitted_at)}</p>
              <p>Periodo: {longDate(period.start)} - {longDate(period.end)}</p>
              <p>Moneda: MXN</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Receptor</p>
            <p className="font-semibold">{fullName(row.user).toUpperCase()}</p>
            <p className="text-sm text-slate-600">{row.user?.email || "correo@cliente.com"}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">RFC</p>
                <p className="font-medium">XAXX010101000</p>
              </div>
              <div>
                <p className="text-slate-500">Uso CFDI</p>
                <p className="font-medium">G03 - Gastos en general</p>
              </div>
              <div>
                <p className="text-slate-500">Código postal</p>
                <p className="font-medium">44100</p>
              </div>
              <div>
                <p className="text-slate-500">Régimen fiscal</p>
                <p className="font-medium">612 - Persona física</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Datos fiscales</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">UUID</p>
                <p className="font-medium">DEMO-{folio}</p>
              </div>
              <div>
                <p className="text-slate-500">Serie</p>
                <p className="font-medium">MC</p>
              </div>
              <div>
                <p className="text-slate-500">Método de pago</p>
                <p className="font-medium">PUE</p>
              </div>
              <div>
                <p className="text-slate-500">Forma de pago</p>
                <p className="font-medium">04 - Tarjeta de crédito</p>
              </div>
              <div>
                <p className="text-slate-500">Tipo comprobante</p>
                <p className="font-medium">I - Ingreso</p>
              </div>
              <div>
                <p className="text-slate-500">Estatus</p>
                <p className="font-medium">{document?.estado || "demo"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-4">Clave</th>
                <th className="text-left p-4">Concepto</th>
                <th className="text-right p-4">Cantidad</th>
                <th className="text-right p-4">Precio</th>
                <th className="text-right p-4">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200">
                <td className="p-4 text-slate-600">81112501</td>
                <td className="p-4">
                  <p className="font-medium">{concept}</p>
                  <p className="text-xs text-slate-500">Suscripción mensual a software MindCare Control</p>
                </td>
                <td className="p-4 text-right">1</td>
                <td className="p-4 text-right">{currencyFromCents(subtotalCents)}</td>
                <td className="p-4 text-right">{currencyFromCents(subtotalCents)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600 md:max-w-md">
            <p className="font-medium text-slate-900 mb-2">Notas</p>
            <p>
              Esta es una factura demo para validar diseño. Los datos fiscales, UUID, sello digital,
              XML y timbrado se conectarán posteriormente con el proveedor de facturación.
            </p>
          </div>

          <div className="min-w-[280px] space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-medium">{currencyFromCents(subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">IVA 16%</span>
              <span className="font-medium">{currencyFromCents(ivaCents)}</span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-semibold text-primary">{currencyFromCents(totalCents)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">
          Sello digital demo: iQO9d2Vyc2lvbkRlbW9NaW5kQ2FyZTIuMC9TRU5EQV9ERU1PX0NGREk=
        </div>
      </div>
    </div>
  );
}

export function AdminBillingPanel() {
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { plan: string; amount: string; cutDay: string }>>({});
  const [plans, setPlans] = useState<SubscriptionPlanRow[]>([]);
  const [planDrafts, setPlanDrafts] = useState<Record<string, { price: string; limit: string }>>({});
  const [invoicePreview, setInvoicePreview] = useState<InvoicePreviewData | null>(null);
  const [pendingCharge, setPendingCharge] = useState<{ row: BillingRow; document: BillingDocument } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const period = monthPeriod();

  useEffect(() => {
    let active = true;

    async function loadBilling() {
      setLoading(true);
      setError("");

      try {
        const psychologists = await supabaseRest<PsychologistRow[]>(
          "/psicologos?select=id,usuario_id,membresia,estado&order=created_at.desc"
        );
        const psychologistIds = psychologists.map((psychologist) => psychologist.id);
        const userIds = psychologists.map((psychologist) => psychologist.usuario_id);

        const [users, settings, documents, stripeCustomers, subscriptions, charges, subscriptionPlans] = await Promise.all([
          userIds.length > 0
            ? supabaseRest<UserRow[]>(`/usuarios?id=in.(${userIds.join(",")})&select=id,nombre,apellido,email`)
            : Promise.resolve([]),
          psychologistIds.length > 0
            ? supabaseRest<BillingSetting[]>(`/psychologist_billing_settings?psicologo_id=in.(${psychologistIds.join(",")})&select=id,psicologo_id,plan_nombre,mensualidad_centavos,dia_corte,moneda,requiere_factura,estado`)
            : Promise.resolve([]),
          psychologistIds.length > 0
            ? supabaseRest<BillingDocument[]>(`/psychologist_billing_documents?psicologo_id=in.(${psychologistIds.join(",")})&periodo_inicio=eq.${period.start}&select=id,psicologo_id,settings_id,periodo_inicio,periodo_fin,tipo,estado,subtotal_centavos,iva_centavos,total_centavos,concepto,emitted_at,paid_at&order=created_at.desc`)
            : Promise.resolve([]),
          psychologistIds.length > 0
            ? supabaseRest<StripeCustomer[]>(`/stripe_billing_customers?psicologo_id=in.(${psychologistIds.join(",")})&select=id,psicologo_id,stripe_customer_id,default_payment_method_id,card_brand,card_last4,card_exp_month,card_exp_year`)
            : Promise.resolve([]),
          psychologistIds.length > 0
            ? supabaseRest<SubscriptionRow[]>(`/suscripciones_psicologo?psicologo_id=in.(${psychologistIds.join(",")})&estado=eq.activa&select=id,psicologo_id,plan_id,estado,current_period_start,current_period_end,next_billing_at,last_charge_at,planes_suscripcion_psicologo(id,codigo,nombre,precio_mensual_centavos,limite_citas_mensuales,orden)&order=updated_at.desc`)
            : Promise.resolve([]),
          psychologistIds.length > 0
            ? supabaseRest<StripeCharge[]>(`/stripe_billing_charges?psicologo_id=in.(${psychologistIds.join(",")})&select=id,psicologo_id,amount_centavos,moneda,estado,paid_at,created_at,metadata&order=created_at.desc`)
            : Promise.resolve([]),
          supabaseRest<SubscriptionPlanRow[]>(
            "/planes_suscripcion_psicologo?activo=eq.true&select=id,codigo,nombre,precio_mensual_centavos,limite_citas_mensuales,orden&order=orden.asc"
          ),
        ]);

        const usersById = Object.fromEntries(users.map((user) => [user.id, user]));
        const settingsByPsychologist = Object.fromEntries(settings.map((setting) => [setting.psicologo_id, setting]));
        const stripeByPsychologist = Object.fromEntries(stripeCustomers.map((customer) => [customer.psicologo_id, customer]));
        const subscriptionByPsychologist = Object.fromEntries(subscriptions.map((subscription) => [subscription.psicologo_id, subscription]));
        const latestChargeByPsychologist = charges.reduce<Record<string, StripeCharge>>((acc, charge) => {
          if (!acc[charge.psicologo_id]) acc[charge.psicologo_id] = charge;
          return acc;
        }, {});
        const documentsByPsychologist = documents.reduce<Record<string, BillingDocument>>((acc, document) => {
          if (!acc[document.psicologo_id]) acc[document.psicologo_id] = document;
          return acc;
        }, {});

        const nextRows = psychologists.map((psychologist) => ({
          psychologist,
          user: usersById[psychologist.usuario_id],
          setting: settingsByPsychologist[psychologist.id],
          latestDocument: documentsByPsychologist[psychologist.id],
          stripeCustomer: stripeByPsychologist[psychologist.id],
          subscription: subscriptionByPsychologist[psychologist.id],
          latestCharge: latestChargeByPsychologist[psychologist.id],
        }));

        const nextDrafts = Object.fromEntries(
          nextRows.map((row) => {
            const setting = row.setting || defaultSetting(row.psychologist);
            const subscriptionPlan = planFromSubscription(row.subscription);
            return [
              row.psychologist.id,
              {
                plan: subscriptionPlan?.codigo || setting.plan_nombre || "basico",
                amount: String(Math.round((subscriptionPlan?.precio_mensual_centavos ?? setting.mensualidad_centavos ?? 0) / 100)),
                cutDay: String(row.subscription?.next_billing_at ? new Date(row.subscription.next_billing_at).getUTCDate() : setting.dia_corte || 1),
              },
            ];
          })
        );

        if (!active) return;
        cacheSubscriptionPlans(subscriptionPlans);
        setPlans(subscriptionPlans);
        setPlanDrafts(Object.fromEntries(
          subscriptionPlans.map((plan) => [
            plan.id,
            {
              price: String(Math.round((plan.precio_mensual_centavos || 0) / 100)),
              limit: plan.limite_citas_mensuales == null ? "" : String(plan.limite_citas_mensuales),
            },
          ])
        ));
        setRows(nextRows);
        setDrafts(nextDrafts);
      } catch (loadError: any) {
        if (!active) return;
        console.error("Admin billing load error:", loadError);
        setError(`No se pudo cargar la facturación administrativa. ${loadError?.message || ""}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBilling();

    return () => {
      active = false;
    };
  }, [period.start, reloadKey]);

  const stats = useMemo(() => {
    const monthly = rows.reduce((total, row) => {
      const plan = planFromSubscription(row.subscription);
      const draft = drafts[row.psychologist.id];
      return total + (plan?.precio_mensual_centavos ?? Math.round(Number(draft?.amount || 0) * 100));
    }, 0);
    const issued = rows.filter((row) => row.latestDocument?.tipo === "factura").length;
    const paid = rows.filter((row) => row.latestCharge?.estado === "pagado" || row.latestDocument?.estado === "pagada").length;
    const due = rows.reduce((total, row) => total + (planFromSubscription(row.subscription)?.precio_mensual_centavos || 0), 0);
    return { monthly, issued, paid, due };
  }, [drafts, rows]);

  const updateDraft = (psychologistId: string, patch: Partial<{ plan: string; amount: string; cutDay: string }>) => {
    setDrafts((current) => ({
      ...current,
      [psychologistId]: { ...current[psychologistId], ...patch },
    }));
  };

  const updatePlanDraft = (planId: string, patch: Partial<{ price: string; limit: string }>) => {
    setPlanDrafts((current) => ({
      ...current,
      [planId]: { ...current[planId], ...patch },
    }));
  };

  const savePlan = async (plan: SubscriptionPlanRow) => {
    const draft = planDrafts[plan.id];
    if (!draft) return;
    setSavingId(`plan-${plan.id}`);

    try {
      const limitValue = draft.limit.trim() === "" ? null : Math.max(1, Number(draft.limit));
      await supabaseRest(`/planes_suscripcion_psicologo?id=eq.${plan.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          precio_mensual_centavos: Math.round(Number(draft.price || 0) * 100),
          limite_citas_mensuales: limitValue,
        }),
      });

      const updatedPlan = {
        ...plan,
        precio_mensual_centavos: Math.round(Number(draft.price || 0) * 100),
        limite_citas_mensuales: limitValue,
      };
      cacheSubscriptionPlans(plans.map((item) => item.id === plan.id ? updatedPlan : item));
      toast.success(`${plan.nombre} actualizado`);
      setReloadKey((key) => key + 1);
    } catch (planError: any) {
      console.error("Save plan error:", planError);
      toast.error(`No se pudo guardar el plan. ${planError?.message || ""}`);
    } finally {
      setSavingId("");
    }
  };

  const saveSetting = async (row: BillingRow) => {
    const draft = drafts[row.psychologist.id];
    if (!draft) return;
    setSavingId(row.psychologist.id);

    try {
      const payload = {
        psicologo_id: row.psychologist.id,
        plan_nombre: draft.plan,
        mensualidad_centavos: Math.round(Number(draft.amount || 0) * 100),
        dia_corte: Math.min(28, Math.max(1, Number(draft.cutDay || 1))),
        moneda: "MXN",
        requiere_factura: draft.plan !== "afiliado",
        estado: "activo",
      };

      if (row.setting) {
        await supabaseRest(`/psychologist_billing_settings?id=eq.${row.setting.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        });
      } else {
        await supabaseRest("/psychologist_billing_settings", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        });
      }

      toast.success("Configuración de cobro guardada");
      setReloadKey((key) => key + 1);
    } catch (saveError) {
      console.error("Save billing setting error:", saveError);
      toast.error("No se pudo guardar la configuración.");
    } finally {
      setSavingId("");
    }
  };

  const createPrefactura = async (row: BillingRow) => {
    const draft = drafts[row.psychologist.id];
    const amountCents = Math.round(Number(draft?.amount || 0) * 100);
    const ivaCents = Math.round(amountCents * 0.16);
    setSavingId(row.psychologist.id);

    try {
      await supabaseRest("/psychologist_billing_documents", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          psicologo_id: row.psychologist.id,
          settings_id: row.setting?.id || null,
          periodo_inicio: period.start,
          periodo_fin: period.end,
          tipo: "pre_factura",
          estado: "borrador",
          subtotal_centavos: amountCents,
          iva_centavos: ivaCents,
          total_centavos: amountCents + ivaCents,
          moneda: "MXN",
          concepto: `Mensualidad MindCare ${period.label} - ${fullName(row.user)}`,
        }),
      });

      toast.success("Prefactura generada");
      setReloadKey((key) => key + 1);
    } catch (prefacturaError) {
      console.error("Create prefactura error:", prefacturaError);
      toast.error("No se pudo generar la prefactura.");
    } finally {
      setSavingId("");
    }
  };

  const markInvoiceIssued = async (document: BillingDocument) => {
    setSavingId(document.psicologo_id);

    try {
      await supabaseRest(`/psychologist_billing_documents?id=eq.${document.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          tipo: "factura",
          estado: "emitida",
          emitted_at: new Date().toISOString(),
        }),
      });

      toast.success("Factura marcada como emitida");
      setReloadKey((key) => key + 1);
    } catch (invoiceError) {
      console.error("Issue invoice error:", invoiceError);
      toast.error("No se pudo marcar la factura.");
    } finally {
      setSavingId("");
    }
  };

  const markPaid = async (document: BillingDocument) => {
    setSavingId(document.psicologo_id);

    try {
      await supabaseRest(`/psychologist_billing_documents?id=eq.${document.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          estado: "pagada",
          paid_at: new Date().toISOString(),
        }),
      });

      toast.success("Cobro marcado como pagado");
      setReloadKey((key) => key + 1);
    } catch (paidError) {
      console.error("Mark paid error:", paidError);
      toast.error("No se pudo registrar el cobro.");
    } finally {
      setSavingId("");
    }
  };

  const addCard = async (row: BillingRow) => {
    setSavingId(row.psychologist.id);

    try {
      const result = await supabaseFunction<{ url: string }>("stripe-create-setup-session", {
        method: "POST",
        body: JSON.stringify({ psicologo_id: row.psychologist.id }),
      });

      window.location.href = result.url;
    } catch (cardError: any) {
      console.error("Add card error:", cardError);
      toast.error(`No se pudo iniciar Stripe. ${cardError?.message || ""}`);
      setSavingId("");
    }
  };

  const chargeWithStripe = async (document: BillingDocument) => {
    setSavingId(document.psicologo_id);

    try {
      const result = await supabaseFunction<{
        ok: boolean;
        already_paid?: boolean;
        already_processing?: boolean;
        payment_intent_id?: string;
        status?: string;
      }>("stripe-charge-document", {
        method: "POST",
        body: JSON.stringify({ billing_document_id: document.id }),
      });

      if (result.already_paid) {
        toast.success("Este documento ya estaba pagado en Stripe");
      } else if (result.already_processing) {
        toast.success("El cobro ya está en proceso");
      } else {
        toast.success("Cobro real con Stripe procesado");
      }
      setReloadKey((key) => key + 1);
    } catch (chargeError: any) {
      console.error("Stripe charge error:", chargeError);
      toast.error(`No se pudo cobrar con Stripe. ${chargeError?.message || ""}`);
    } finally {
      setSavingId("");
      setPendingCharge(null);
    }
  };

  const openInvoicePreview = (row: BillingRow) => {
    const draft = drafts[row.psychologist.id] || { plan: "basico", amount: "0", cutDay: "1" };
    setInvoicePreview({
      row,
      document: row.latestDocument,
      draft,
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("stripe_setup_session_id");
    const cancelled = params.get("stripe_setup_cancelled");

    if (cancelled) {
      toast.info("Registro de tarjeta cancelado");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (!sessionId) return;

    supabaseFunction("stripe-sync-setup-session", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(() => {
        toast.success("Tarjeta guardada correctamente");
        setReloadKey((key) => key + 1);
      })
      .catch((syncError: any) => {
        console.error("Stripe sync error:", syncError);
        toast.error(`No se pudo sincronizar la tarjeta. ${syncError?.message || ""}`);
      })
      .finally(() => {
        window.history.replaceState({}, "", window.location.pathname);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Cobros y Facturación</h1>
          <p className="text-muted-foreground">
            Configura mensualidades por psicólogo y controla prefacturas, facturas y cobros.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setReloadKey((key) => key + 1)}>
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Psicólogos</p>
            <p className="text-3xl text-foreground">{loading ? "..." : rows.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Mensualidad Potencial</p>
            <p className="text-3xl text-foreground">{loading ? "..." : currencyFromCents(stats.monthly)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Facturas Emitidas</p>
            <p className="text-3xl text-[#4DD0E1]">{loading ? "..." : stats.issued}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Cobros Pagados</p>
            <p className="text-3xl text-[#81C784]">{loading ? "..." : stats.paid}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Planes de Suscripción</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Costo mensual</TableHead>
                <TableHead>Límite de citas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    Cargando planes...
                  </TableCell>
                </TableRow>
              ) : plans.map((plan) => {
                const draft = planDrafts[plan.id] || { price: "0", limit: "" };
                const busy = savingId === `plan-${plan.id}`;

                return (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{plan.nombre}</p>
                        <p className="text-xs text-muted-foreground">{plan.codigo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <Input
                        type="number"
                        min="0"
                        value={draft.price}
                        onChange={(event) => updatePlanDraft(plan.id, { price: event.target.value })}
                      />
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ilimitado"
                        value={draft.limit}
                        onChange={(event) => updatePlanDraft(plan.id, { limit: event.target.value })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => savePlan(plan)} disabled={busy}>
                        <Save className="w-3 h-3" />
                        {busy ? "Guardando..." : "Guardar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            El límite se aplica desde base de datos al crear o mover citas. Deja el límite vacío para planes ilimitados.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Suscripciones activas y próximos cobros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Psicólogo</TableHead>
                <TableHead>Plan actual</TableHead>
                <TableHead>Mensualidad</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Próximo cobro</TableHead>
                <TableHead>Tarjeta</TableHead>
                <TableHead>Último cobro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Cargando suscripciones...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No hay psicólogos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const plan = planFromSubscription(row.subscription);
                  const nextBilling = row.subscription?.next_billing_at;
                  const isDue = nextBilling ? new Date(nextBilling).getTime() <= Date.now() : false;
                  const latestCharge = row.latestCharge;

                  return (
                    <TableRow key={`subscription-${row.psychologist.id}`}>
                      <TableCell>
                        <div>
                          <p className="text-foreground">{fullName(row.user)}</p>
                          <p className="text-xs text-muted-foreground">{row.user?.email || "Sin email"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {plan ? (
                          <div className="space-y-1">
                            <Badge variant="outline">{plan.nombre}</Badge>
                            <p className="text-xs text-muted-foreground">
                              {plan.limite_citas_mensuales == null ? "Citas ilimitadas" : `${plan.limite_citas_mensuales} citas/mes`}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin suscripción activa</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{currencyFromCents(plan?.precio_mensual_centavos || 0)}</p>
                          <p className="text-xs text-muted-foreground">Monto por cobrar</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.subscription?.current_period_start && row.subscription?.current_period_end ? (
                          <div className="text-sm">
                            <p className="text-foreground">{longDate(row.subscription.current_period_start)}</p>
                            <p className="text-muted-foreground">al {longDate(row.subscription.current_period_end)}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin periodo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm text-foreground">{shortDateTime(nextBilling)}</p>
                          <Badge className={isDue ? "bg-[#FFB74D] text-white" : "bg-muted text-muted-foreground"}>
                            {isDue ? "Pendiente de cobro" : "Programado"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.stripeCustomer?.default_payment_method_id ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="gap-1">
                              <CreditCard className="w-3 h-3" />
                              {row.stripeCustomer.card_brand || "card"} •••• {row.stripeCustomer.card_last4}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              Exp. {row.stripeCustomer.card_exp_month}/{row.stripeCustomer.card_exp_year}
                            </p>
                          </div>
                        ) : (
                          <Badge className="bg-destructive text-destructive-foreground">Sin tarjeta</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {latestCharge ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={chargeStatusClass(latestCharge.estado)}>{latestCharge.estado}</Badge>
                              <span className="text-sm text-foreground">{currencyFromCents(latestCharge.amount_centavos)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{shortDateTime(latestCharge.paid_at || latestCharge.created_at)}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin cobros registrados</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Esta sección usa datos reales de suscripción, tarjeta guardada y cobros Stripe registrados por el sistema.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Configuración por Psicólogo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Psicólogo</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Mensualidad</TableHead>
                <TableHead>Día de corte</TableHead>
                <TableHead>Tarjeta</TableHead>
                <TableHead>Documento del mes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Cargando facturación...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No hay psicólogos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const draft = drafts[row.psychologist.id] || { plan: "basico", amount: "0", cutDay: "1" };
                  const document = row.latestDocument;
                  const status = document ? documentStatus[document.estado] || documentStatus.borrador : null;
                  const busy = savingId === row.psychologist.id;
                  const belowStripeMinimum = Boolean(
                    document && document.total_centavos < minimumStripeChargeCents("MXN")
                  );

                  return (
                    <TableRow key={row.psychologist.id}>
                      <TableCell>
                        <div>
                          <p className="text-foreground">{fullName(row.user)}</p>
                          <p className="text-xs text-muted-foreground">{row.user?.email || "Sin email"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <Select value={draft.plan} onValueChange={(value) => updateDraft(row.psychologist.id, { plan: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basico">Básico</SelectItem>
                            <SelectItem value="intermedio">Intermedio</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="afiliado">Afiliado</SelectItem>
                            <SelectItem value="personalizado">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="min-w-[130px]">
                        <Input
                          type="number"
                          min="0"
                          value={draft.amount}
                          onChange={(event) => updateDraft(row.psychologist.id, { amount: event.target.value })}
                        />
                      </TableCell>
                      <TableCell className="min-w-[110px]">
                        <Input
                          type="number"
                          min="1"
                          max="28"
                          value={draft.cutDay}
                          onChange={(event) => updateDraft(row.psychologist.id, { cutDay: event.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        {row.stripeCustomer?.default_payment_method_id ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="gap-1">
                              <CreditCard className="w-3 h-3" />
                              {row.stripeCustomer.card_brand || "card"} •••• {row.stripeCustomer.card_last4}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              Exp. {row.stripeCustomer.card_exp_month}/{row.stripeCustomer.card_exp_year}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin tarjeta</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {document ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={status?.className}>{status?.label}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {document.tipo === "pre_factura" ? "Prefactura" : document.tipo === "factura" ? "Factura" : "Cobro"}
                              </span>
                            </div>
                            <p className="text-sm text-foreground">{currencyFromCents(document.total_centavos)}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin prefactura de {period.label}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => saveSetting(row)} disabled={busy}>
                            <Save className="w-3 h-3" />
                            Guardar
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => createPrefactura(row)} disabled={busy}>
                            <FileText className="w-3 h-3" />
                            Prefactura
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => openInvoicePreview(row)} disabled={busy}>
                            <Eye className="w-3 h-3" />
                            Vista factura
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => addCard(row)} disabled={busy}>
                            <CreditCard className="w-3 h-3" />
                            Tarjeta
                          </Button>
                          {document && document.tipo === "pre_factura" && (
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => markInvoiceIssued(document)} disabled={busy}>
                              <Receipt className="w-3 h-3" />
                              Factura
                            </Button>
                          )}
                          {document && document.estado !== "pagada" && document.tipo === "factura" && (
                            <Button size="sm" className="gap-1" onClick={() => markPaid(document)} disabled={busy}>
                              <CheckCircle2 className="w-3 h-3" />
                              Pagado manual
                            </Button>
                          )}
                          {document && document.estado !== "pagada" && document.tipo === "factura" && (
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => setPendingCharge({ row, document })}
                              disabled={busy || !row.stripeCustomer?.default_payment_method_id || belowStripeMinimum}
                              title={
                                belowStripeMinimum
                                  ? `El mínimo de Stripe para MXN es ${currencyFromCents(minimumStripeChargeCents("MXN"))}`
                                  : row.stripeCustomer?.default_payment_method_id
                                    ? "Cobrar con la tarjeta guardada"
                                    : "El psicólogo necesita tener una tarjeta guardada"
                              }
                            >
                              <CreditCard className="w-3 h-3" />
                              Cobrar real
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

      <Dialog open={!!invoicePreview} onOpenChange={(open) => !open && setInvoicePreview(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista previa de factura mensual</DialogTitle>
          </DialogHeader>
          {invoicePreview && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" />
                  Imprimir / guardar PDF
                </Button>
              </div>
              <MonthlyInvoicePreview data={invoicePreview} period={period} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingCharge} onOpenChange={(open) => !open && setPendingCharge(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cobro real con Stripe</AlertDialogTitle>
            <AlertDialogDescription>
              Se realizará un cargo real a la tarjeta guardada de{" "}
              <span className="font-semibold text-foreground">
                {fullName(pendingCharge?.row.user)}
              </span>{" "}
              por{" "}
              <span className="font-semibold text-foreground">
                {currencyFromCents(pendingCharge?.document.total_centavos || 0)}
              </span>
              . Si Stripe aprueba el cargo, la factura se marcará como pagada automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(pendingCharge && savingId === pendingCharge.document.psicologo_id)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (pendingCharge) chargeWithStripe(pendingCharge.document);
              }}
              disabled={Boolean(pendingCharge && savingId === pendingCharge.document.psicologo_id)}
            >
              {pendingCharge && savingId === pendingCharge.document.psicologo_id
                ? "Cobrando..."
                : "Sí, cobrar ahora"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
