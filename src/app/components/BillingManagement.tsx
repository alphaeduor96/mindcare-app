import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
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
} from "lucide-react";
import { toast } from "sonner";
import { resolvePsychologistProfileId, supabaseFunction, supabaseRest } from "../../services/api";

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
      "Análisis predictivo con IA",
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
  planes_suscripcion_psicologo?: SubscriptionPlanRow | null;
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

export function BillingManagement({ currentPlan, currentPsychologistId, onPlanChange }: BillingManagementProps) {
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<string>("");
  const [activePlan, setActivePlan] = useState<PlanKey>(currentPlan);
  const [appointmentsUsed, setAppointmentsUsed] = useState(0);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlanRow[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [stripeCustomer, setStripeCustomer] = useState<StripeCustomer | null>(null);
  const [billingDocuments, setBillingDocuments] = useState<BillingDocument[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const currentPlanDetails = planDetails[activePlan];
  const dbCurrentPlan = subscriptionPlans.find((plan) => plan.codigo === activePlan);
  const maxAppointments = dbCurrentPlan?.limite_citas_mensuales ?? currentPlanDetails.limit;
  const displayedMonthlyPrice = Math.round((dbCurrentPlan?.precio_mensual_centavos ?? currentPlanDetails.price * 100) / 100);
  const appointmentsLabel = maxAppointments ? `Hasta ${maxAppointments} citas` : "Ilimitadas";
  const usagePercentage = !maxAppointments ? 0 : Math.min(100, (appointmentsUsed / maxAppointments) * 100);

  const loadStripeCustomer = async (psychologistId: string) => {
    const customers = await supabaseRest<StripeCustomer[]>(
      `/stripe_billing_customers?psicologo_id=eq.${psychologistId}&select=default_payment_method_id,payment_method_type,wallet_type,card_brand,card_last4,card_exp_month,card_exp_year&limit=1`
    );
    const customer = customers[0] || null;
    setStripeCustomer(customer);
    return customer;
  };

  const handleChangePlan = (newPlan: string) => {
    const nextPlan = planDetails[newPlan as PlanKey];

    if (nextPlan.price > 0 && !stripeCustomer?.default_payment_method_id) {
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

    try {
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

      setActivePlan(selectedNewPlan as PlanKey);
      onPlanChange?.(selectedNewPlan as any);
      toast.success(`Plan actualizado a ${planDetails[selectedNewPlan as keyof typeof planDetails].name}`);
      setShowChangePlanDialog(false);
    } catch (error: any) {
      console.error("Plan change error:", error);
      toast.error(`No se pudo cambiar el plan. ${error?.message || ""}`);
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
        const resolvedProfileId = await resolvePsychologistProfileId(currentPsychologistId);
        if (!resolvedProfileId) return;
        setProfileId(resolvedProfileId);

        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

        const [customer, documents, plans, subscriptions, appointments] = await Promise.all([
          loadStripeCustomer(resolvedProfileId),
          supabaseRest<BillingDocument[]>(
            `/psychologist_billing_documents?psicologo_id=eq.${resolvedProfileId}&select=id,periodo_inicio,periodo_fin,tipo,estado,total_centavos,concepto,created_at&order=created_at.desc&limit=12`
          ),
          supabaseRest<SubscriptionPlanRow[]>(
            `/planes_suscripcion_psicologo?activo=eq.true&select=id,codigo,nombre,precio_mensual_centavos,limite_citas_mensuales&order=orden.asc`
          ),
          supabaseRest<PsychologistSubscriptionRow[]>(
            `/suscripciones_psicologo?psicologo_id=eq.${resolvedProfileId}&estado=eq.activa&select=id,plan_id,planes_suscripcion_psicologo(id,codigo,nombre,precio_mensual_centavos,limite_citas_mensuales)&limit=1`
          ),
          supabaseRest<Array<{ id: string }>>(
            `/citas?psicologo_id=eq.${resolvedProfileId}&inicia_at=gte.${monthStart.toISOString()}&inicia_at=lt.${nextMonthStart.toISOString()}&estado=in.(solicitada,agendada,confirmada,completada)&select=id`
          ),
        ]);

        if (!active) return;
        setStripeCustomer(customer);
        setBillingDocuments(documents);
        setSubscriptionPlans(plans);
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
      const resolvedProfileId = await resolvePsychologistProfileId(currentPsychologistId);
      if (!resolvedProfileId) {
        setSavingCard(false);
        toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
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

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Descargando factura ${invoiceId}...`);
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
                <CardTitle>{currentPlanDetails.name}</CardTitle>
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
                  {appointmentsUsed} / {maxAppointments}
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
              {currentPlanDetails.features.map((feature, index) => (
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
                <span>Próximo cobro: 15 Oct 2024</span>
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
            {(Object.keys(planDetails) as Array<keyof typeof planDetails>)
              .filter(key => key !== "afiliado" && key !== activePlan)
              .map((planKey) => {
                const plan = planDetails[planKey];
                return (
                  <Card key={planKey} className="border-2 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.appointments}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-3xl text-foreground">
                        ${plan.price}
                        {plan.price > 0 && (
                          <span className="text-base text-muted-foreground">/mes</span>
                        )}
                      </div>

                      <ul className="space-y-2">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleChangePlan(planKey)}
                        className="w-full"
                        variant={plan.price > currentPlanDetails.price ? "default" : "outline"}
                      >
                        {plan.price > currentPlanDetails.price ? (
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

      {/* Billing History */}
      <div className="space-y-4">
        <h2 className="text-xl text-foreground">Historial de Facturación</h2>
        
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm text-foreground">Factura</th>
                    <th className="text-left p-4 text-sm text-foreground">Fecha</th>
                    <th className="text-left p-4 text-sm text-foreground">Período</th>
                    <th className="text-left p-4 text-sm text-foreground">Plan</th>
                    <th className="text-right p-4 text-sm text-foreground">Monto</th>
                    <th className="text-center p-4 text-sm text-foreground">Estado</th>
                    <th className="text-right p-4 text-sm text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingBilling ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                        Cargando historial...
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
                          <span className="text-sm text-foreground">{invoice.tipo}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(invoice.created_at).toLocaleDateString("es-MX")}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {invoice.periodo_inicio} / {invoice.periodo_fin}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
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
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {selectedNewPlan && (
                <>
                  Estás a punto de cambiar de <strong>{currentPlanDetails.name}</strong> a{" "}
                  <strong>{planDetails[selectedNewPlan as keyof typeof planDetails].name}</strong>.
                  <br /><br />
                  {planDetails[selectedNewPlan as keyof typeof planDetails].price > currentPlanDetails.price ? (
                    <>El cambio será efectivo inmediatamente y se te cobrará la diferencia prorrateada.</>
                  ) : planDetails[selectedNewPlan as keyof typeof planDetails].price === 0 ? (
                    <>El cambio será efectivo inmediatamente. No se realizarán más cobros.</>
                  ) : (
                    <>El cambio será efectivo en tu próximo ciclo de facturación.</>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChangePlan}>
              Confirmar Cambio
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
              Tu suscripción al {currentPlanDetails.name} será cancelada al finalizar el período actual
              (15 Oct 2024). Después de esa fecha, serás cambiado automáticamente al Plan Básico gratuito
              con límite de 10 citas al mes.
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
