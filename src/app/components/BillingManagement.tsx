import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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
  CreditCard,
  Download,
  Calendar,
  CheckCircle2,
  Zap,
  TrendingUp,
  AlertTriangle,
  Plus,
  FileText,
  Award,
  Printer,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { ensurePsychologistProfileId, supabaseFunction, supabaseRest } from "../../services/api";

interface BillingManagementProps {
  currentPlan: "basico" | "intermedio" | "pro" | "afiliado";
  currentPsychologistId?: string;
  onPlanChange?: (newPlan: "basico" | "intermedio" | "pro" | "afiliado") => void;
}

type PlanKey = "basico" | "intermedio" | "pro" | "afiliado";

const planDetails = {
  basico: {
    name: "Plan Básico",
    price: 0,
    appointments: "0-10 citas",
    limit: 10,
    color: "bg-[#66BB6A]/10 text-[#66BB6A] border-[#66BB6A]/20",
    features: [
      "Hasta 10 citas al mes",
      "Calendario y gestión completa",
      "Recordatorios automáticos",
      "Reportes básicos",
      "Soporte por email",
    ],
  },
  intermedio: {
    name: "Plan Intermedio",
    price: 150,
    appointments: "11-20 citas",
    limit: 20,
    color: "bg-[#7E57C2]/10 text-[#7E57C2] border-[#7E57C2]/20",
    features: [
      "Hasta 20 citas al mes",
      "Todo lo del plan Básico",
      "Reportes avanzados",
      "Gestión de múltiples consultorios",
      "Soporte prioritario",
    ],
  },
  pro: {
    name: "Plan Pro",
    price: 250,
    appointments: "21-50 citas",
    limit: 50,
    color: "bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/20",
    features: [
      "Hasta 50 citas al mes",
      "Todo lo del plan Intermedio",
      "Automatizaciones avanzadas",
      "Exportación avanzada de datos",
      "Soporte 24/7 por WhatsApp",
    ],
  },
  afiliado: {
    name: "Afiliado",
    price: 0,
    appointments: "Ilimitadas",
    limit: null,
    color: "bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/20",
    features: [
      "Citas ilimitadas",
      "Sistema 100% gratis",
      "Referidos constantes de 500+ empresas",
      "Prioridad en búsquedas",
      "Soporte dedicado",
    ],
  },
};

interface StripeCustomer {
  default_payment_method_id?: string | null;
  payment_method_type?: string | null;
  wallet_type?: string | null;
  card_brand?: string | null;
  card_last4?: string | null;
  card_exp_month?: number | null;
  card_exp_year?: number | null;
}

interface BillingDocument {
  id: string;
  periodo_inicio: string;
  periodo_fin: string;
  tipo: string;
  estado: string;
  total_centavos: number;
  concepto: string;
  created_at: string;
}

interface StripeCharge {
  id: string;
  amount_centavos: number;
  moneda: string;
  estado: "pendiente" | "procesando" | "pagado" | "fallido" | "cancelado";
  paid_at?: string | null;
  created_at: string;
  metadata?: Record<string, any> | null;
}

interface BillingSetting {
  requiere_factura?: boolean | null;
}

interface InvoicePreviewData {
  invoice?: BillingDocument;
  planName: string;
  monthlyPriceCents: number;
}

interface SubscriptionPlanRow {
  id: string;
  codigo: PlanKey;
  nombre: string;
  precio_mensual_centavos: number;
  limite_citas_mensuales: number | null;
}

interface PsychologistSubscriptionRow {
  id: string;
  plan_id: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  next_billing_at?: string | null;
  last_charge_at?: string | null;
  planes_suscripcion_psicologo?: SubscriptionPlanRow | null;
}

const SUBSCRIPTION_PLANS_CACHE_KEY = "mindcare_subscription_plans_cache";

function readCachedSubscriptionPlans(): SubscriptionPlanRow[] {
  try {
    const value = localStorage.getItem(SUBSCRIPTION_PLANS_CACHE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("No se pudo leer cache local de planes:", error);
    return [];
  }
}

function cacheSubscriptionPlans(plans: SubscriptionPlanRow[]) {
  try {
    localStorage.setItem(SUBSCRIPTION_PLANS_CACHE_KEY, JSON.stringify(plans));
  } catch (error) {
    console.warn("No se pudo guardar cache local de planes:", error);
  }
}

function currencyFromCents(cents = 0) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function paymentMethodLabel(customer: StripeCustomer) {
  if (customer.wallet_type === "apple_pay") return "Apple Pay";
  if (customer.wallet_type === "google_pay") return "Google Pay";
  return customer.card_brand ? customer.card_brand.toUpperCase() : "Tarjeta";
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

function chargeReason(charge: StripeCharge) {
  const type = charge.metadata?.charge_type;
  if (type === "plan_upgrade_proration") return "Cambio de plan: proporcional del mes";
  if (type === "monthly_subscription") return "Mensualidad de suscripción";
  if (type === "billing_document") return "Factura / documento de cobro";
  return "Cargo de suscripción MindCare";
}

function chargeStatusClass(status: string) {
  if (status === "pagado") return "bg-green-50 text-green-700 border-green-200";
  if (status === "procesando" || status === "pendiente") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-destructive text-destructive-foreground";
}

function currentMonthPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: now.toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
  };
}

function planLimitLabel(limit: number | null | undefined) {
  return limit ? `Hasta ${limit} citas` : "Citas ilimitadas";
}

function planFeaturesFromDb(plan: SubscriptionPlanRow, fallback: typeof planDetails[PlanKey]) {
  const features = [
    `${planLimitLabel(plan.limite_citas_mensuales)} al mes`,
    ...fallback.features.filter((feature) => !feature.toLowerCase().includes("citas")),
  ];

  return Array.from(new Set(features));
}

function demoInvoiceFolio(invoice?: BillingDocument) {
  return `MC-${new Date().getFullYear()}-${invoice?.id ? invoice.id.slice(0, 8).toUpperCase() : "DEMO-0001"}`;
}

function invoiceTotals(data: InvoicePreviewData) {
  const subtotalCents = data.invoice
    ? Math.round(data.invoice.total_centavos / 1.16)
    : data.monthlyPriceCents;
  const ivaCents = data.invoice
    ? data.invoice.total_centavos - subtotalCents
    : Math.round(subtotalCents * 0.16);
  const totalCents = data.invoice?.total_centavos ?? subtotalCents + ivaCents;
  const period = currentMonthPeriod();

  return {
    subtotalCents,
    ivaCents,
    totalCents,
    period,
    folio: demoInvoiceFolio(data.invoice),
    concept: data.invoice?.concepto || `Mensualidad MindCare ${period.label} - ${data.planName}`,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function invoiceDocumentHtml(data: InvoicePreviewData) {
  const { subtotalCents, ivaCents, totalCents, period, folio, concept } = invoiceTotals(data);
  const issuedAt = longDate(data.invoice?.created_at);
  const periodStart = longDate(data.invoice?.periodo_inicio || period.start);
  const periodEnd = longDate(data.invoice?.periodo_fin || period.end);
  const status = data.invoice?.estado || "demo";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Factura ${escapeHtml(folio)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #e5e7eb;
      color: #0f172a;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 24px 70px rgba(15, 23, 42, .18);
      overflow: hidden;
    }
    .header {
      background: #020617;
      color: #fff;
      padding: 28px 34px;
      display: flex;
      justify-content: space-between;
      gap: 28px;
    }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
    .logo {
      width: 46px; height: 46px; border-radius: 14px;
      background: #14b8a6; display: grid; place-items: center;
      font-size: 25px; font-weight: 800;
    }
    h1, h2, p { margin: 0; }
    .brand-name { font-size: 26px; font-weight: 750; letter-spacing: -0.02em; }
    .muted-dark { color: #cbd5e1; font-size: 12px; }
    .issuer-title { color: #cbd5e1; font-size: 12px; margin-bottom: 5px; }
    .issuer-name { font-size: 15px; font-weight: 700; margin-bottom: 3px; }
    .invoice-meta { text-align: right; min-width: 250px; }
    .invoice-meta .label { color: #cbd5e1; font-size: 13px; }
    .invoice-meta .folio { font-size: 25px; font-weight: 760; margin: 4px 0 16px; }
    .invoice-meta p { color: #cbd5e1; font-size: 12px; line-height: 1.55; }
    .content { padding: 32px 34px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .box { border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; }
    .section-label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 12px; }
    .strong { font-weight: 720; }
    .small { color: #475569; font-size: 12px; line-height: 1.45; }
    .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
    .field-label { color: #64748b; font-size: 11px; margin-bottom: 2px; }
    .field-value { font-size: 12px; font-weight: 650; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 28px; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    th { background: #f8fafc; color: #475569; text-align: left; font-size: 12px; padding: 14px; }
    td { border-top: 1px solid #e2e8f0; font-size: 12px; padding: 14px; vertical-align: top; }
    .right { text-align: right; }
    .concept { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
    .bottom { display: flex; justify-content: space-between; gap: 26px; margin-top: 28px; }
    .note { background: #f8fafc; border-radius: 16px; padding: 18px; color: #475569; font-size: 12px; line-height: 1.55; flex: 1; }
    .totals { width: 285px; }
    .line { display: flex; justify-content: space-between; padding: 9px 0; font-size: 13px; }
    .divider { height: 1px; background: #e2e8f0; margin: 4px 0; }
    .total { font-size: 18px; font-weight: 760; }
    .teal { color: #0f766e; }
    .seal { margin-top: 28px; border: 1px dashed #cbd5e1; border-radius: 14px; padding: 13px; color: #64748b; font-size: 10px; overflow-wrap: anywhere; }
    .actions { width: 210mm; margin: 18px auto; display: flex; justify-content: flex-end; gap: 10px; }
    .actions button { border: 1px solid #cbd5e1; background: #fff; border-radius: 10px; padding: 10px 14px; cursor: pointer; font-weight: 650; }
    @media print {
      body { background: #fff; }
      .page { width: auto; min-height: auto; box-shadow: none; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Guardar como PDF / Imprimir</button>
  </div>
  <main class="page">
    <section class="header">
      <div>
        <div class="brand">
          <div class="logo">M</div>
          <div>
            <p class="brand-name">MindCare</p>
            <p class="muted-dark">Plataforma de gestión psicológica</p>
          </div>
        </div>
        <p class="issuer-title">Emisor</p>
        <p class="issuer-name">MINDCARE TECHNOLOGIES S.A. DE C.V.</p>
        <p class="muted-dark">RFC: MTE240101AB1</p>
        <p class="muted-dark">Régimen fiscal: 601 - General de Ley Personas Morales</p>
      </div>
      <div class="invoice-meta">
        <p class="label">Factura mensual</p>
        <p class="folio">${escapeHtml(folio)}</p>
        <p>Fecha de emisión: ${escapeHtml(issuedAt)}</p>
        <p>Periodo: ${escapeHtml(periodStart)} - ${escapeHtml(periodEnd)}</p>
        <p>Moneda: MXN</p>
      </div>
    </section>
    <section class="content">
      <div class="grid">
        <div class="box">
          <p class="section-label">Tus datos fiscales</p>
          <p class="strong">RAZÓN SOCIAL DEL PSICÓLOGO</p>
          <p class="small">correo@cliente.com</p>
          <div class="fields">
            <div><p class="field-label">RFC</p><p class="field-value">XAXX010101000</p></div>
            <div><p class="field-label">Uso CFDI</p><p class="field-value">G03 - Gastos en general</p></div>
            <div><p class="field-label">Código postal</p><p class="field-value">44100</p></div>
            <div><p class="field-label">Régimen fiscal</p><p class="field-value">612 - Persona física</p></div>
          </div>
        </div>
        <div class="box">
          <p class="section-label">Datos CFDI</p>
          <div class="fields">
            <div><p class="field-label">UUID</p><p class="field-value">DEMO-${escapeHtml(folio)}</p></div>
            <div><p class="field-label">Serie</p><p class="field-value">MC</p></div>
            <div><p class="field-label">Método de pago</p><p class="field-value">PUE</p></div>
            <div><p class="field-label">Forma de pago</p><p class="field-value">04 - Tarjeta de crédito</p></div>
            <div><p class="field-label">Tipo comprobante</p><p class="field-value">I - Ingreso</p></div>
            <div><p class="field-label">Estatus</p><p class="field-value">${escapeHtml(status)}</p></div>
          </div>
        </div>
      </div>
      <table>
        <thead><tr><th>Clave</th><th>Concepto</th><th class="right">Cantidad</th><th class="right">Precio</th><th class="right">Importe</th></tr></thead>
        <tbody>
          <tr>
            <td>81112501</td>
            <td><p class="concept">${escapeHtml(concept)}</p><p class="small">Suscripción mensual a software MindCare Control</p></td>
            <td class="right">1</td>
            <td class="right">${escapeHtml(currencyFromCents(subtotalCents))}</td>
            <td class="right">${escapeHtml(currencyFromCents(subtotalCents))}</td>
          </tr>
        </tbody>
      </table>
      <div class="bottom">
        <div class="note"><p class="strong">Demo fiscal</p><p>Esta vista valida el diseño final que recibirá el psicólogo. Después se conectará a datos fiscales reales, timbrado, XML y PDF descargable.</p></div>
        <div class="totals">
          <div class="line"><span>Subtotal</span><span>${escapeHtml(currencyFromCents(subtotalCents))}</span></div>
          <div class="line"><span>IVA 16%</span><span>${escapeHtml(currencyFromCents(ivaCents))}</span></div>
          <div class="divider"></div>
          <div class="line total"><span>Total</span><span class="teal">${escapeHtml(currencyFromCents(totalCents))}</span></div>
        </div>
      </div>
      <div class="seal">Sello digital demo: iQO9d2Vyc2lvbkRlbW9NaW5kQ2FyZTIuMC9QU0lDT0xPR09fQ0ZESQ==</div>
    </section>
  </main>
</body>
</html>`;
}

function PsychologistInvoicePreview({ data }: { data: InvoicePreviewData }) {
  const { subtotalCents, ivaCents, totalCents, period, folio, concept } = invoiceTotals(data);

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
              <p>Fecha de emisión: {longDate(data.invoice?.created_at)}</p>
              <p>Periodo: {longDate(data.invoice?.periodo_inicio || period.start)} - {longDate(data.invoice?.periodo_fin || period.end)}</p>
              <p>Moneda: MXN</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Tus datos fiscales</p>
            <p className="font-semibold">RAZÓN SOCIAL DEL PSICÓLOGO</p>
            <p className="text-sm text-slate-600">correo@cliente.com</p>
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
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Datos CFDI</p>
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
                <p className="font-medium">{data.invoice?.estado || "demo"}</p>
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
            <p className="font-medium text-slate-900 mb-2">Demo fiscal</p>
            <p>
              Esta vista valida el diseño final que recibirá el psicólogo. Después se conectará a datos fiscales reales,
              timbrado, XML y PDF descargable.
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
          Sello digital demo: iQO9d2Vyc2lvbkRlbW9NaW5kQ2FyZTIuMC9QU0lDT0xPR09fQ0ZESQ==
        </div>
      </div>
    </div>
  );
}

export function BillingManagement({ currentPlan, currentPsychologistId, onPlanChange }: BillingManagementProps) {
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<string>("");
  const [activePlan, setActivePlan] = useState<PlanKey>(currentPlan);
  const [appointmentsUsed, setAppointmentsUsed] = useState(0);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlanRow[]>(() => readCachedSubscriptionPlans());
  const [profileId, setProfileId] = useState<string | null>(null);
  const [stripeCustomer, setStripeCustomer] = useState<StripeCustomer | null>(null);
  const [billingDocuments, setBillingDocuments] = useState<BillingDocument[]>([]);
  const [billingCharges, setBillingCharges] = useState<StripeCharge[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<PsychologistSubscriptionRow | null>(null);
  const [requiresFiscalInvoice, setRequiresFiscalInvoice] = useState(false);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const currentPlanDetails = planDetails[activePlan];
  const dbCurrentPlan = subscriptionPlans.find((plan) => plan.codigo === activePlan);
  const currentPlanName = dbCurrentPlan?.nombre ?? currentPlanDetails.name;
  const currentPlanPriceCents = dbCurrentPlan?.precio_mensual_centavos ?? currentPlanDetails.price * 100;
  const maxAppointments = dbCurrentPlan?.limite_citas_mensuales ?? currentPlanDetails.limit;
  const displayedMonthlyPrice = Math.round(currentPlanPriceCents / 100);
  const appointmentsLabel = planLimitLabel(maxAppointments);
  const usagePercentage = !maxAppointments ? 0 : Math.min(100, (appointmentsUsed / maxAppointments) * 100);
  const currentPlanFeatures = dbCurrentPlan
    ? planFeaturesFromDb(dbCurrentPlan, currentPlanDetails)
    : currentPlanDetails.features;
  const basicPlanLimit = subscriptionPlans.find((plan) => plan.codigo === "basico")?.limite_citas_mensuales
    ?? planDetails.basico.limit;
  const availablePlans = subscriptionPlans.length > 0
    ? subscriptionPlans.filter((plan) => plan.codigo !== "afiliado" && plan.codigo !== activePlan)
    : (Object.keys(planDetails) as PlanKey[])
        .filter((key) => key !== "afiliado" && key !== activePlan)
        .map((key) => ({
          id: key,
          codigo: key,
          nombre: planDetails[key].name,
          precio_mensual_centavos: planDetails[key].price * 100,
          limite_citas_mensuales: planDetails[key].limit,
        }));

  const loadStripeCustomer = async (psychologistId: string) => {
    const customers = await supabaseRest<StripeCustomer[]>(
      `/stripe_billing_customers?psicologo_id=eq.${psychologistId}&select=default_payment_method_id,payment_method_type,wallet_type,card_brand,card_last4,card_exp_month,card_exp_year&limit=1`
    );
    const customer = customers[0] || null;
    setStripeCustomer(customer);
    return customer;
  };

  const handleChangePlan = (newPlan: string) => {
    const nextPlan = subscriptionPlans.find((plan) => plan.codigo === newPlan);
    const fallbackPlan = planDetails[newPlan as PlanKey];
    const nextPlanPrice = nextPlan?.precio_mensual_centavos ?? fallbackPlan.price * 100;

    if (nextPlanPrice > 0 && !stripeCustomer?.default_payment_method_id) {
      toast.error("Agrega o selecciona una tarjeta guardada antes de cambiar a un plan de pago.");
      return;
    }

    setSelectedNewPlan(newPlan);
    setShowChangePlanDialog(true);
  };

  const confirmChangePlan = async () => {
    if (!selectedNewPlan || !profileId) return;

    const targetPlan = subscriptionPlans.find((plan) => plan.codigo === selectedNewPlan);
    if (!targetPlan) {
      toast.error("No se encontró el plan en base de datos.");
      return;
    }

    if (targetPlan.precio_mensual_centavos > 0 && !stripeCustomer?.default_payment_method_id) {
      toast.error("Selecciona una tarjeta guardada antes de cambiar a este plan.");
      return;
    }

    const currentPlanRow = subscriptionPlans.find((plan) => plan.codigo === activePlan);
    const currentPriceCents = currentPlanRow?.precio_mensual_centavos ?? currentPlanDetails.price * 100;
    const isUpgrade = targetPlan.precio_mensual_centavos > currentPriceCents;

    setChangingPlan(true);

    try {
      if (isUpgrade) {
        const result = await supabaseFunction<{
          ok: boolean;
          charged: boolean;
          amount_centavos: number;
          payment_intent_id?: string | null;
        }>("stripe-charge-plan-change", {
          method: "POST",
          body: JSON.stringify({
            psicologo_id: profileId,
            target_plan_id: targetPlan.id,
          }),
        });

        if (result.charged) {
          toast.success(`Cobro realizado por ${new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            maximumFractionDigits: 0,
          }).format(result.amount_centavos / 100)}`);
        } else {
          toast.success("Plan actualizado. El resto del mes no tendrá costo y el primer cobro será el día 1.");
        }
      } else {
        await supabaseRest("/suscripciones_psicologo?on_conflict=psicologo_id", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=representation" },
          body: JSON.stringify({
            psicologo_id: profileId,
            plan_id: targetPlan.id,
            estado: "activa",
            default_payment_method_id: stripeCustomer?.default_payment_method_id || null,
          }),
        });
      }

      setActivePlan(selectedNewPlan as PlanKey);
      onPlanChange?.(selectedNewPlan as any);
      toast.success(`Plan actualizado a ${targetPlan.nombre}`);
      setShowChangePlanDialog(false);
      setReloadKey((key) => key + 1);
    } catch (error: any) {
      console.error("Plan change error:", error);
      toast.error(`No se pudo cambiar el plan. ${error?.message || ""}`);
    } finally {
      setChangingPlan(false);
    }
  };

  const handleCancelSubscription = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelSubscription = () => {
    if (onPlanChange) {
      onPlanChange("basico");
      setActivePlan("basico");
      toast.success("Suscripción cancelada. Has sido cambiado al Plan Básico gratuito.");
    }
    setShowCancelDialog(false);
  };

  useEffect(() => {
    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel("mindcare-stripe-setup");
      channel.onmessage = (event) => {
        if (event.data?.status === "success") {
          toast.success("Método de pago actualizado");
          setSavingCard(false);
          setReloadKey((key) => key + 1);
        }

        if (event.data?.status === "cancelled") {
          toast.info("Registro de método de pago cancelado");
          setSavingCard(false);
        }

        if (event.data?.status === "error") {
          setSavingCard(false);
        }
      };
    } catch (error) {
      console.warn("Stripe setup channel unavailable:", error);
    }

    return () => {
      channel?.close();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadBilling() {
      setLoadingBilling(true);

      try {
        const plans = await supabaseRest<SubscriptionPlanRow[]>(
          `/planes_suscripcion_psicologo?activo=eq.true&select=id,codigo,nombre,precio_mensual_centavos,limite_citas_mensuales&order=orden.asc`
        ).catch((error) => {
          console.warn("Subscription plans load skipped:", error);
          return readCachedSubscriptionPlans();
        });

        if (!active) return;
        const nextPlans = plans.length > 0 ? plans : readCachedSubscriptionPlans();
        if (nextPlans.length > 0) {
          cacheSubscriptionPlans(nextPlans);
          setSubscriptionPlans(nextPlans);
        }

        const resolvedProfileId = await ensurePsychologistProfileId(currentPsychologistId);
        if (!resolvedProfileId) return;
        setProfileId(resolvedProfileId);

        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

        const [customer, documents, charges, subscriptions, settings, appointments] = await Promise.all([
          loadStripeCustomer(resolvedProfileId).catch((error) => {
            console.warn("Stripe customer load skipped:", error);
            return null;
          }),
          supabaseRest<BillingDocument[]>(
            `/psychologist_billing_documents?psicologo_id=eq.${resolvedProfileId}&select=id,periodo_inicio,periodo_fin,tipo,estado,total_centavos,concepto,created_at&order=created_at.desc&limit=12`
          ).catch((error) => {
            console.warn("Billing documents load skipped:", error);
            return [];
          }),
          supabaseRest<StripeCharge[]>(
            `/stripe_billing_charges?psicologo_id=eq.${resolvedProfileId}&select=id,amount_centavos,moneda,estado,paid_at,created_at,metadata&order=created_at.desc&limit=24`
          ).catch((error) => {
            console.warn("Billing charges load skipped:", error);
            return [];
          }),
          supabaseRest<PsychologistSubscriptionRow[]>(
            `/suscripciones_psicologo?psicologo_id=eq.${resolvedProfileId}&estado=eq.activa&select=id,plan_id,current_period_start,current_period_end,next_billing_at,last_charge_at,planes_suscripcion_psicologo(id,codigo,nombre,precio_mensual_centavos,limite_citas_mensuales)&limit=1`
          ).catch((error) => {
            console.warn("Subscription load skipped:", error);
            return [];
          }),
          supabaseRest<BillingSetting[]>(
            `/psychologist_billing_settings?psicologo_id=eq.${resolvedProfileId}&select=requiere_factura&limit=1`
          ).catch((error) => {
            console.warn("Billing settings load skipped:", error);
            return [];
          }),
          supabaseRest<Array<{ id: string }>>(
            `/citas?psicologo_id=eq.${resolvedProfileId}&inicia_at=gte.${monthStart.toISOString()}&inicia_at=lt.${nextMonthStart.toISOString()}&estado=in.(solicitada,agendada,confirmada,completada)&select=id`
          ).catch((error) => {
            console.warn("Appointment usage load skipped:", error);
            return [];
          }),
        ]);

        if (!active) return;
        setStripeCustomer(customer);
        setBillingDocuments(documents);
        setBillingCharges(charges);
        setActiveSubscription(subscriptions[0] || null);
        setRequiresFiscalInvoice(Boolean(settings[0]?.requiere_factura));
        setAppointmentsUsed(appointments.length);

        const dbPlanCode = subscriptions[0]?.planes_suscripcion_psicologo?.codigo;
        if (dbPlanCode) setActivePlan(dbPlanCode);
      } catch (error) {
        console.error("Psychologist billing load error:", error);
      } finally {
        if (active) setLoadingBilling(false);
      }
    }

    loadBilling();

    return () => {
      active = false;
    };
  }, [currentPsychologistId, reloadKey]);

  const handleAddCard = async () => {
    setSavingCard(true);

    try {
      const previousPaymentMethodId = stripeCustomer?.default_payment_method_id || null;
      const resolvedProfileId = await ensurePsychologistProfileId(currentPsychologistId);
      if (!resolvedProfileId) {
        setSavingCard(false);
        toast.error("No se pudo crear o encontrar tu perfil de psicólogo. Revisa que tu cuenta esté registrada como psicólogo.");
        return;
      }

      const result = await supabaseFunction<{ url: string }>("stripe-create-setup-session", {
        method: "POST",
        body: JSON.stringify({
          psicologo_id: resolvedProfileId,
          popup: true,
          app_url: window.location.origin,
        }),
      });

      const stripeWindow = window.open(
        result.url,
        "mindcare-stripe-setup",
        "popup=yes,width=560,height=760,menubar=no,toolbar=no,location=no,status=no"
      );

      if (!stripeWindow) {
        setSavingCard(false);
        toast.error("El navegador bloqueó la ventana de Stripe. Permite ventanas emergentes para este sitio.");
        return;
      }

      toast.info("Completa el método de pago en la ventana de Stripe.");

      const startedAt = Date.now();
      let syncStarted = false;
      const intervalId = window.setInterval(async () => {
        const timedOut = Date.now() - startedAt > 120000;

        if (!syncStarted) {
          try {
            const popupParams = new URL(stripeWindow.location.href).searchParams;
            const sessionId = popupParams.get("stripe_setup_session_id");
            const cancelled = popupParams.get("stripe_setup_cancelled");

            if (cancelled) {
              window.clearInterval(intervalId);
              stripeWindow.close();
              setSavingCard(false);
              toast.info("Registro de método de pago cancelado");
              return;
            }

            if (sessionId) {
              syncStarted = true;
              await supabaseFunction("stripe-sync-setup-session", {
                method: "POST",
                body: JSON.stringify({ session_id: sessionId }),
              });
            }
          } catch {
            // Stripe is still on a different domain; keep polling Supabase.
          }
        }

        try {
          const customer = await loadStripeCustomer(resolvedProfileId);
          const hasNewPaymentMethod = customer?.default_payment_method_id
            && customer.default_payment_method_id !== previousPaymentMethodId;

          if (hasNewPaymentMethod) {
            window.clearInterval(intervalId);
            stripeWindow.close();
            setSavingCard(false);
            setReloadKey((key) => key + 1);
            toast.success("Método de pago guardado correctamente");
            return;
          }
        } catch (pollError) {
          console.warn("Stripe customer polling failed:", pollError);
        }

        if (stripeWindow.closed || timedOut) {
          window.clearInterval(intervalId);
          setSavingCard(false);
          setReloadKey((key) => key + 1);
        }
      }, 2500);
    } catch (error: any) {
      console.error("Add card error:", error);
      toast.error(`No se pudo abrir Stripe. ${error?.message || ""}`);
      setSavingCard(false);
    }
  };

  const handleDownloadInvoice = (invoice?: BillingDocument) => {
    openPrintableInvoice(printableInvoiceData(invoice), true);
  };

  const printableInvoiceData = (invoice?: BillingDocument): InvoicePreviewData => ({
    invoice,
    planName: currentPlanName,
    monthlyPriceCents: Math.round(displayedMonthlyPrice * 100),
  });

  const openPrintableInvoice = (data: InvoicePreviewData, autoPrint = false) => {
    const popup = window.open("", "_blank", "width=980,height=1200");

    if (!popup) {
      toast.error("El navegador bloqueó la ventana de factura. Permite ventanas emergentes para este sitio.");
      return;
    }

    popup.document.open();
    popup.document.write(invoiceDocumentHtml(data));
    popup.document.close();

    if (autoPrint) {
      popup.onload = () => {
        popup.focus();
        popup.print();
      };
    }
  };

  const downloadInvoiceHtml = (data: InvoicePreviewData) => {
    const html = invoiceDocumentHtml(data);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${demoInvoiceFolio(data.invoice)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadInvoiceXml = (invoice: BillingDocument) => {
    const data = printableInvoiceData(invoice);
    const { subtotalCents, ivaCents, totalCents, period, folio, concept } = invoiceTotals(data);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante Serie="MC" Folio="${escapeHtml(folio)}" Moneda="MXN" SubTotal="${(subtotalCents / 100).toFixed(2)}" Total="${(totalCents / 100).toFixed(2)}">
  <cfdi:Emisor Rfc="MTE240101AB1" Nombre="MINDCARE TECHNOLOGIES S.A. DE C.V." RegimenFiscal="601" />
  <cfdi:Receptor Rfc="XAXX010101000" Nombre="PUBLICO EN GENERAL" UsoCFDI="S01" />
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="81112501" Cantidad="1" Descripcion="${escapeHtml(concept)}" ValorUnitario="${(subtotalCents / 100).toFixed(2)}" Importe="${(subtotalCents / 100).toFixed(2)}" />
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${(ivaCents / 100).toFixed(2)}" />
  <mindcare:Periodo Inicio="${escapeHtml(invoice.periodo_inicio || period.start)}" Fin="${escapeHtml(invoice.periodo_fin || period.end)}" />
</cfdi:Comprobante>`;
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${folio}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-foreground mb-2">Suscripción</h1>
        <p className="text-muted-foreground">
          Gestiona tu plan, método de pago y límite mensual de citas
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className={`border-2 ${currentPlanDetails.color}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                <CardTitle>{currentPlanName}</CardTitle>
                <Badge variant="outline" className={currentPlanDetails.color}>
                  Plan Actual
                </Badge>
              </div>
              <CardDescription>
                {activePlan === "afiliado" 
                  ? "Sistema 100% gratuito para psicólogos afiliados"
                  : appointmentsLabel + " por mes"
                }
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl text-foreground">
                ${displayedMonthlyPrice}
                {displayedMonthlyPrice > 0 && (
                  <span className="text-base text-muted-foreground">/mes</span>
                )}
              </div>
              {displayedMonthlyPrice === 0 && activePlan !== "afiliado" && (
                <p className="text-sm text-muted-foreground">Gratis</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Progress - Only for non-affiliated */}
          {activePlan !== "afiliado" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Citas este mes</span>
                <span className="text-foreground">
                  {maxAppointments ? `${appointmentsUsed} / ${maxAppointments}` : `${appointmentsUsed} / ilimitadas`}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              {usagePercentage > 80 && (
                <div className="flex items-center gap-2 text-sm text-[#FF9800]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Estás cerca del límite de tu plan</span>
                </div>
              )}
            </div>
          )}

          {/* Plan Features */}
          <div>
            <h4 className="text-sm text-foreground mb-3">Lo que incluye tu plan:</h4>
            <ul className="space-y-2">
              {currentPlanFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Billing Date */}
          {activePlan !== "basico" && activePlan !== "afiliado" && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Próximo cobro: {shortDateTime(activeSubscription?.next_billing_at)}</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Activo
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Plan Section - Not for affiliated */}
      {activePlan !== "afiliado" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-foreground">Planes Disponibles</h2>
            <Badge variant="outline" className="gap-1">
              <Zap className="w-3 h-3" />
              Sin permanencia
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availablePlans
              .map((dbPlan) => {
                const planKey = dbPlan.codigo;
                const plan = planDetails[planKey] ?? planDetails.basico;
                const planPrice = Math.round(dbPlan.precio_mensual_centavos / 100);
                const planLimit = dbPlan.limite_citas_mensuales;
                const planFeatures = planFeaturesFromDb(dbPlan, plan);
                return (
                  <Card key={planKey} className="border-2 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{dbPlan.nombre}</CardTitle>
                      <CardDescription>{planLimitLabel(planLimit)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-3xl text-foreground">
                        ${planPrice}
                        {planPrice > 0 && (
                          <span className="text-base text-muted-foreground">/mes</span>
                        )}
                      </div>

                      <ul className="space-y-2">
                        {planFeatures.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleChangePlan(planKey)}
                        className="w-full"
                        variant={dbPlan.precio_mensual_centavos > currentPlanPriceCents ? "default" : "outline"}
                      >
                        {dbPlan.precio_mensual_centavos > currentPlanPriceCents ? (
                          <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Mejorar Plan
                          </>
                        ) : (
                          "Cambiar a este plan"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Affiliated Info */}
      {activePlan === "afiliado" && (
        <Card className="border-2 border-[#4DB6AC]/20 bg-gradient-to-br from-[#4DB6AC]/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#4DB6AC]/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-[#4DB6AC]" />
              </div>
              <div>
                <h3 className="text-foreground mb-2">Psicólogo Afiliado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Como parte de nuestra red de psicólogos afiliados, tienes acceso completo al sistema sin ningún costo. No necesitas cambiar de plan ni agregar métodos de pago.
                </p>
                <div className="flex items-center gap-2 text-sm text-[#4DB6AC]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Acceso ilimitado garantizado</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods */}
      {activePlan !== "afiliado" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-foreground">Métodos de Pago</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCard}
              className="gap-2"
              disabled={savingCard}
            >
              <Plus className="w-4 h-4" />
              {savingCard ? "Esperando Stripe..." : stripeCustomer?.default_payment_method_id ? "Actualizar Tarjeta" : "Agregar Tarjeta"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stripeCustomer?.default_payment_method_id ? (
              <Card className="border-2 border-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-foreground">
                          {paymentMethodLabel(stripeCustomer)} •••• {stripeCustomer.card_last4}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vence {stripeCustomer.card_exp_month}/{stripeCustomer.card_exp_year}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Predeterminada
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No tienes una tarjeta guardada. Usa Stripe para agregar una tarjeta de forma segura.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Tabs defaultValue="charges" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl text-foreground">Cobros y facturación</h2>
            <p className="text-sm text-muted-foreground">
              Consulta cuándo se cargó tu tarjeta, por qué concepto y los documentos de cada periodo.
            </p>
          </div>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="charges" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Mis cobros
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="w-4 h-4" />
              Facturación
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="charges">
          <Card>
            <CardHeader>
              <CardTitle>Mis cobros</CardTitle>
              <CardDescription>
                Cargos reales realizados a tu método de pago guardado en Stripe.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm text-foreground">Fecha</th>
                      <th className="text-left p-4 text-sm text-foreground">Por qué se cobró</th>
                      <th className="text-left p-4 text-sm text-foreground">Periodo</th>
                      <th className="text-left p-4 text-sm text-foreground">Tarjeta</th>
                      <th className="text-right p-4 text-sm text-foreground">Monto</th>
                      <th className="text-center p-4 text-sm text-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingBilling ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                          Cargando cobros...
                        </td>
                      </tr>
                    ) : billingCharges.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                          Aún no hay cargos registrados en tu cuenta.
                        </td>
                      </tr>
                    ) : billingCharges.map((charge) => (
                      <tr key={charge.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-4 text-sm text-muted-foreground">
                          {shortDateTime(charge.paid_at || charge.created_at)}
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground">{chargeReason(charge)}</p>
                          <p className="text-xs text-muted-foreground">
                            {charge.metadata?.target_plan_id ? "Se activó al cambiar de plan." : "Cobro automático de MindCare."}
                          </p>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {charge.metadata?.period_start && charge.metadata?.period_end
                            ? `${longDate(String(charge.metadata.period_start))} al ${longDate(String(charge.metadata.period_end))}`
                            : "Sin periodo"}
                        </td>
                        <td className="p-4">
                          {stripeCustomer?.default_payment_method_id ? (
                            <Badge variant="outline" className="gap-1">
                              <CreditCard className="w-3 h-3" />
                              {paymentMethodLabel(stripeCustomer)} •••• {stripeCustomer.card_last4}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin tarjeta guardada</span>
                          )}
                        </td>
                        <td className="p-4 text-right text-foreground">
                          {currencyFromCents(charge.amount_centavos)}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={chargeStatusClass(charge.estado)}>
                            {charge.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm text-foreground">Documento</th>
                      <th className="text-left p-4 text-sm text-foreground">Fecha</th>
                      <th className="text-left p-4 text-sm text-foreground">Periodo</th>
                      <th className="text-left p-4 text-sm text-foreground">Concepto</th>
                      <th className="text-right p-4 text-sm text-foreground">Monto</th>
                      <th className="text-center p-4 text-sm text-foreground">Estado</th>
                      <th className="text-right p-4 text-sm text-foreground">Descargas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingBilling ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                          Cargando documentos...
                        </td>
                      </tr>
                    ) : billingDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                          Aún no hay documentos de facturación.
                        </td>
                      </tr>
                    ) : billingDocuments.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-foreground">
                                {requiresFiscalInvoice ? "Factura CFDI" : "Recibo informativo"}
                              </p>
                              <p className="text-xs text-muted-foreground">{invoice.tipo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {shortDateTime(invoice.created_at)}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {longDate(invoice.periodo_inicio)} al {longDate(invoice.periodo_fin)}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs max-w-[280px] truncate">
                            {invoice.concepto}
                          </Badge>
                        </td>
                        <td className="p-4 text-right text-foreground">
                          {currencyFromCents(invoice.total_centavos)}
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={invoice.estado === "pagada" ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}>
                            {invoice.estado}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice)} className="gap-2">
                              <Download className="w-4 h-4" />
                              PDF
                            </Button>
                            {requiresFiscalInvoice && (
                              <Button variant="ghost" size="sm" onClick={() => downloadInvoiceXml(invoice)} className="gap-2">
                                <Download className="w-4 h-4" />
                                XML
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Subscription - Only for paid plans */}
      {activePlan !== "basico" && activePlan !== "afiliado" && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
            <CardDescription>
              Acciones irreversibles relacionadas con tu suscripción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground mb-1">Cancelar Suscripción</p>
                <p className="text-sm text-muted-foreground">
                  Serás cambiado al Plan Básico gratuito al finalizar tu período actual
                </p>
              </div>
              <Button variant="destructive" onClick={handleCancelSubscription}>
                Cancelar Suscripción
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Plan Dialog */}
      <AlertDialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cambio de Plan</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedNewPlan && (() => {
                const targetPlan = subscriptionPlans.find((plan) => plan.codigo === selectedNewPlan);
                const fallbackPlan = planDetails[selectedNewPlan as PlanKey];
                const targetName = targetPlan?.nombre ?? fallbackPlan.name;
                const targetPriceCents = targetPlan?.precio_mensual_centavos ?? fallbackPlan.price * 100;

                return (
                  <>
                    Estás a punto de cambiar de <strong>{currentPlanName}</strong> a{" "}
                    <strong>{targetName}</strong>.
                    <br /><br />
                    {targetPriceCents > currentPlanPriceCents ? (
                      <>
                        El cambio será efectivo inmediatamente. Del día 1 al 15 se cobra solo el proporcional
                        de los días restantes del mes; del día 16 en adelante el resto del mes no tiene costo
                        y el primer cobro será el día 1 del siguiente mes.
                      </>
                    ) : targetPriceCents === 0 ? (
                      <>El cambio será efectivo inmediatamente. No se realizarán más cobros.</>
                    ) : (
                      <>El cambio será efectivo en tu próximo ciclo de facturación.</>
                    )}
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingPlan}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={changingPlan}
              onClick={(event) => {
                event.preventDefault();
                confirmChangePlan();
              }}
            >
              {changingPlan ? "Procesando..." : "Confirmar Cambio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu suscripción al {currentPlanName} será cancelada al finalizar el período actual
              (15 Oct 2024). Después de esa fecha, serás cambiado automáticamente al Plan Básico gratuito
              con límite de {basicPlanLimit} citas al mes.
              <br /><br />
              Podrás reactivar tu suscripción en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener suscripción</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar suscripción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
