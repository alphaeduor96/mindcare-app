import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const env = (n: string) => {
  const v = Deno.env.get(n);
  if (!v) throw new Error(`Missing ${n}`);
  return v;
};
const opt = (n: string) => Deno.env.get(n) || "";
const serviceKey = () => opt("SUPABASE_SERVICE_ROLE_KEY") || String(Object.values(JSON.parse(opt("SUPABASE_SECRET_KEYS") || "{}"))[0] || "");
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const mxNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
async function stripePost(path: string, params: Record<string, string>, key: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("STRIPE_SECRET_KEY")}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": key },
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Stripe request failed");
  return data;
}
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const supabase = createClient(env("SUPABASE_URL"), serviceKey());
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "No autorizado" }, 401);
    const { psicologo_id, target_plan_id } = await req.json();
    if (!psicologo_id || !target_plan_id) return json({ error: "Faltan datos" }, 400);
    const { data: psych } = await supabase.from("psicologos").select("usuario_id").eq("id", psicologo_id).single();
    const { data: user } = await supabase.from("usuarios").select("rol").eq("id", auth.user.id).single();
    if (user?.rol !== "admin" && psych?.usuario_id !== auth.user.id) return json({ error: "No autorizado" }, 403);
    const { data: target } = await supabase
      .from("planes_suscripcion_psicologo")
      .select("id,codigo,nombre,precio_mensual_centavos")
      .eq("id", target_plan_id).eq("activo", true).single();
    if (!target) return json({ error: "Plan destino no encontrado" }, 404);
    const { data: sub } = await supabase
      .from("suscripciones_psicologo")
      .select("planes_suscripcion_psicologo(codigo,precio_mensual_centavos)")
      .eq("psicologo_id", psicologo_id).eq("estado", "activa").maybeSingle();
    const currentPlan = Array.isArray(sub?.planes_suscripcion_psicologo)
      ? sub?.planes_suscripcion_psicologo[0]
      : sub?.planes_suscripcion_psicologo;
    const currentPrice = Number(currentPlan?.precio_mensual_centavos || 0);
    const targetPrice = Number(target.precio_mensual_centavos || 0);
    const now = mxNow(), day = now.getDate(), days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diff = Math.max(0, targetPrice - currentPrice);
    const amount = day >= 16 ? 0 : Math.round(diff * ((days - day + 1) / days));
    let intent = null;
    if (amount > 0) {
      if (amount < 1000) return json({ error: "El cobro mínimo en MXN es $10.00." }, 400);
      const { data: customer } = await supabase.from("stripe_billing_customers").select("*").eq("psicologo_id", psicologo_id).single();
      if (!customer?.default_payment_method_id) return json({ error: "Agrega una tarjeta antes de cambiar de plan" }, 400);
      intent = await stripePost("/payment_intents", {
        amount: String(amount), currency: "mxn", customer: customer.stripe_customer_id,
        payment_method: customer.default_payment_method_id, off_session: "true", confirm: "true",
        description: `Upgrade MindCare a ${target.nombre}`,
        "metadata[psicologo_id]": psicologo_id, "metadata[target_plan_id]": target.id,
        "metadata[charge_type]": "plan_upgrade_proration", "metadata[period_start]": ymd(now),
        "metadata[period_end]": ymd(monthEnd),
      }, `mindcare-plan-${psicologo_id}-${target.id}-${ymd(now)}`);
      await supabase.from("stripe_billing_charges").insert({
        psicologo_id, stripe_customer_id: customer.stripe_customer_id, stripe_payment_intent_id: intent.id,
        amount_centavos: amount, moneda: "MXN", estado: intent.status === "succeeded" ? "pagado" : "procesando",
        paid_at: intent.status === "succeeded" ? new Date().toISOString() : null,
        metadata: { charge_type: "plan_upgrade_proration", target_plan_id: target.id, period_start: ymd(now), period_end: ymd(monthEnd), stripe: intent },
      });
    }
    const { error } = await supabase.from("suscripciones_psicologo").upsert({
      psicologo_id, plan_id: target.id, estado: "activa",
      current_period_start: ymd(now), current_period_end: ymd(monthEnd),
      next_billing_at: nextBilling.toISOString(), last_charge_at: intent ? new Date().toISOString() : null,
    }, { onConflict: "psicologo_id" });
    if (error) throw error;
    return json({ ok: true, charged: Boolean(intent), amount_centavos: amount, payment_intent_id: intent?.id, plan: target });
  } catch (error) {
    console.error("stripe-charge-plan-change error:", error);
    return json({ error: "No se pudo procesar el cambio de plan." }, 500);
  }
});
