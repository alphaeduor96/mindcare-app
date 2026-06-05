import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
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
import { CheckCircle2, CreditCard, FileText, Receipt, RefreshCw, Save } from "lucide-react";
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

interface BillingRow {
  psychologist: PsychologistRow;
  user?: UserRow;
  setting?: BillingSetting;
  latestDocument?: BillingDocument;
  stripeCustomer?: StripeCustomer;
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

export function AdminBillingPanel() {
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { plan: string; amount: string; cutDay: string }>>({});
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

        const [users, settings, documents, stripeCustomers] = await Promise.all([
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
        ]);

        const usersById = Object.fromEntries(users.map((user) => [user.id, user]));
        const settingsByPsychologist = Object.fromEntries(settings.map((setting) => [setting.psicologo_id, setting]));
        const stripeByPsychologist = Object.fromEntries(stripeCustomers.map((customer) => [customer.psicologo_id, customer]));
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
        }));

        const nextDrafts = Object.fromEntries(
          nextRows.map((row) => {
            const setting = row.setting || defaultSetting(row.psychologist);
            return [
              row.psychologist.id,
              {
                plan: setting.plan_nombre || "basico",
                amount: String(Math.round((setting.mensualidad_centavos || 0) / 100)),
                cutDay: String(setting.dia_corte || 1),
              },
            ];
          })
        );

        if (!active) return;
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
      const draft = drafts[row.psychologist.id];
      return total + Math.round(Number(draft?.amount || 0) * 100);
    }, 0);
    const issued = rows.filter((row) => row.latestDocument?.tipo === "factura").length;
    const paid = rows.filter((row) => row.latestDocument?.estado === "pagada").length;
    return { monthly, issued, paid };
  }, [drafts, rows]);

  const updateDraft = (psychologistId: string, patch: Partial<{ plan: string; amount: string; cutDay: string }>) => {
    setDrafts((current) => ({
      ...current,
      [psychologistId]: { ...current[psychologistId], ...patch },
    }));
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
      await supabaseFunction("stripe-charge-document", {
        method: "POST",
        body: JSON.stringify({ billing_document_id: document.id }),
      });

      toast.success("Cobro con tarjeta procesado");
      setReloadKey((key) => key + 1);
    } catch (chargeError: any) {
      console.error("Stripe charge error:", chargeError);
      toast.error(`No se pudo cobrar con Stripe. ${chargeError?.message || ""}`);
    } finally {
      setSavingId("");
    }
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
                              Pagado
                            </Button>
                          )}
                          {document && document.estado !== "pagada" && document.tipo === "factura" && (
                            <Button size="sm" className="gap-1" onClick={() => chargeWithStripe(document)} disabled={busy}>
                              <CreditCard className="w-3 h-3" />
                              Cobrar
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
    </div>
  );
}
