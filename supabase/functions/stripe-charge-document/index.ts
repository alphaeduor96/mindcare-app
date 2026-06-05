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

async function stripePost(path: string, params: Record<string, string>) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv("STRIPE_SECRET_KEY")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
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

    const { data: requester } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", authUser.user.id)
      .single();
    if (requester?.rol !== "admin") return json({ error: "Solo admin puede cobrar" }, 403);

    const { billing_document_id } = await req.json();
    if (!billing_document_id) return json({ error: "Falta billing_document_id" }, 400);

    const { data: document, error: documentError } = await supabase
      .from("psychologist_billing_documents")
      .select("*")
      .eq("id", billing_document_id)
      .single();
    if (documentError || !document) return json({ error: "Documento no encontrado" }, 404);
    if (document.estado === "pagada") return json({ error: "El documento ya está pagado" }, 400);

    const { data: customer, error: customerError } = await supabase
      .from("stripe_billing_customers")
      .select("*")
      .eq("psicologo_id", document.psicologo_id)
      .single();
    if (customerError || !customer?.default_payment_method_id) {
      return json({ error: "El psicólogo no tiene tarjeta guardada" }, 400);
    }

    const intent = await stripePost("/payment_intents", {
      amount: String(document.total_centavos),
      currency: String(document.moneda || "MXN").toLowerCase(),
      customer: customer.stripe_customer_id,
      payment_method: customer.default_payment_method_id,
      off_session: "true",
      confirm: "true",
      description: document.concepto || "Mensualidad MindCare",
      "metadata[billing_document_id]": document.id,
      "metadata[psicologo_id]": document.psicologo_id,
    });

    await supabase.from("stripe_billing_charges").insert({
      billing_document_id: document.id,
      psicologo_id: document.psicologo_id,
      stripe_customer_id: customer.stripe_customer_id,
      stripe_payment_intent_id: intent.id,
      amount_centavos: document.total_centavos,
      moneda: document.moneda || "MXN",
      estado: intent.status === "succeeded" ? "pagado" : "procesando",
      paid_at: intent.status === "succeeded" ? new Date().toISOString() : null,
      metadata: intent,
    });

    if (intent.status === "succeeded") {
      await supabase
        .from("psychologist_billing_documents")
        .update({
          estado: "pagada",
          paid_at: new Date().toISOString(),
        })
        .eq("id", document.id);
    }

    return json({ ok: true, payment_intent_id: intent.id, status: intent.status });
  } catch (error) {
    console.error("stripe-charge-document error:", error);
    return json({ error: error instanceof Error ? error.message : "Error desconocido" }, 500);
  }
});
