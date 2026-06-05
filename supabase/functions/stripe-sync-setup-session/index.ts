import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function stripeGet(path: string) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${requireEnv("STRIPE_SECRET_KEY")}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Stripe request failed");
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser.user) return json({ error: "No autorizado" }, 401);

    const { session_id } = await req.json();
    if (!session_id) return json({ error: "Falta session_id" }, 400);

    const session = await stripeGet(`/checkout/sessions/${session_id}`);
    const psicologoId = session.metadata?.psicologo_id;
    const setupIntentId = session.setup_intent;

    if (!psicologoId || !setupIntentId) return json({ error: "Sesión de Stripe incompleta" }, 400);

    const { data: requester } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", authUser.user.id)
      .single();
    const { data: psychologist } = await supabase
      .from("psicologos")
      .select("usuario_id")
      .eq("id", psicologoId)
      .single();

    if (requester?.rol !== "admin" && psychologist?.usuario_id !== authUser.user.id) {
      return json({ error: "No autorizado" }, 403);
    }

    const setupIntent = await stripeGet(`/setup_intents/${setupIntentId}`);
    const paymentMethodId = setupIntent.payment_method;
    if (!paymentMethodId) return json({ error: "No se encontró método de pago" }, 400);

    const paymentMethod = await stripeGet(`/payment_methods/${paymentMethodId}`);
    const card = paymentMethod.card || {};
    const walletType = card.wallet?.type || null;
    const methodType = paymentMethod.type || "card";

    const { error: updateError } = await supabase
      .from("stripe_billing_customers")
      .upsert({
        psicologo_id: psicologoId,
        stripe_customer_id: session.customer || null,
        default_payment_method_id: paymentMethodId,
        payment_method_type: methodType,
        wallet_type: walletType,
        card_brand: card.brand || null,
        card_last4: card.last4 || null,
        card_exp_month: card.exp_month || null,
        card_exp_year: card.exp_year || null,
        estado: "activo",
      }, { onConflict: "psicologo_id" });

    if (updateError) throw updateError;

    return json({
      ok: true,
      psicologo_id: psicologoId,
      payment_method_type: methodType,
      wallet_type: walletType,
      card_brand: card.brand,
      card_last4: card.last4,
      card_exp_month: card.exp_month,
      card_exp_year: card.exp_year,
    });
  } catch (error) {
    console.error("stripe-sync-setup-session error:", error);
    return json({ error: error instanceof Error ? error.message : "Error desconocido" }, 500);
  }
});
