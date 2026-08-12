import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
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
const wait = (p: Promise<unknown>) => ((globalThis as any).EdgeRuntime?.waitUntil ? ((globalThis as any).EdgeRuntime.waitUntil(p), true) : false);
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
async function runBilling() {
  const supabase = createClient(env("SUPABASE_URL"), serviceKey());
  const now = mxNow(), monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const { data: subs, error } = await supabase
    .from("suscripciones_psicologo")
    .select("id,psicologo_id,planes_suscripcion_psicologo(id,nombre,precio_mensual_centavos)")
    .eq("estado", "activa").lte("next_billing_at", new Date().toISOString());
  if (error) throw error;
  for (const sub of subs || []) {
    const plan = Array.isArray(sub.planes_suscripcion_psicologo) ? sub.planes_suscripcion_psicologo[0] : sub.planes_suscripcion_psicologo;
    const amount = Number(plan?.precio_mensual_centavos || 0);
    if (amount <= 0) {
      await supabase.from("suscripciones_psicologo").update({
        current_period_start: ymd(now), current_period_end: ymd(monthEnd), next_billing_at: nextBilling.toISOString(),
      }).eq("id", sub.id);
      continue;
    }
    const { data: customer } = await supabase.from("stripe_billing_customers").select("*").eq("psicologo_id", sub.psicologo_id).single();
    if (!customer?.default_payment_method_id) continue;
    const intent = await stripePost("/payment_intents", {
      amount: String(amount), currency: "mxn", customer: customer.stripe_customer_id,
      payment_method: customer.default_payment_method_id, off_session: "true", confirm: "true",
      description: `Mensualidad MindCare ${plan.nombre}`,
      "metadata[psicologo_id]": sub.psicologo_id, "metadata[subscription_id]": sub.id,
      "metadata[charge_type]": "monthly_subscription", "metadata[period_start]": ymd(now),
      "metadata[period_end]": ymd(monthEnd),
    }, `mindcare-monthly-${sub.id}-${ymd(now)}`);
    await supabase.from("stripe_billing_charges").insert({
      psicologo_id: sub.psicologo_id, stripe_customer_id: customer.stripe_customer_id,
      stripe_payment_intent_id: intent.id, amount_centavos: amount, moneda: "MXN",
      estado: intent.status === "succeeded" ? "pagado" : "procesando",
      paid_at: intent.status === "succeeded" ? new Date().toISOString() : null,
      metadata: { charge_type: "monthly_subscription", subscription_id: sub.id, period_start: ymd(now), period_end: ymd(monthEnd), stripe: intent },
    });
    await supabase.from("suscripciones_psicologo").update({
      current_period_start: ymd(now), current_period_end: ymd(monthEnd),
      next_billing_at: nextBilling.toISOString(), last_charge_at: new Date().toISOString(),
    }).eq("id", sub.id);
  }
}
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = opt("BILLING_CRON_SECRET");
  if (secret && req.headers.get("x-cron-secret") !== secret) return json({ error: "No autorizado" }, 401);
  const job = runBilling().catch((error) => console.error("stripe-charge-due-subscriptions error:", error));
  if (wait(job)) return json({ ok: true, queued: true }, 202);
  await job;
  return json({ ok: true, queued: false });
});
