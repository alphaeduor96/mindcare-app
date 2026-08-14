import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { checkRateLimit } from "../_shared/rate_limit.ts";

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

function cleanOrigin(value: string | null | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

function isAllowedAppUrl(value: string, allowedOrigins: string[]) {
  return allowedOrigins.includes(value)
    || value.startsWith("http://localhost:")
    || value.startsWith("http://127.0.0.1:");
}

async function stripeRequest(path: string, params: Record<string, string>) {
  const secret = requireEnv("STRIPE_SECRET_KEY");
  const body = new URLSearchParams(params);
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Stripe request failed");
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: authUser, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser.user) return json({ error: "No autorizado" }, 401);

    const limit = await checkRateLimit(supabase, {
      scope: "stripe-create-setup-session:user",
      identifier: authUser.user.id,
      maxRequests: 10,
      windowSeconds: 600,
    });
    if (!limit.allowed) return json({ error: "Demasiadas solicitudes. Intenta de nuevo más tarde." }, 429);

    const { psicologo_id, popup = false, app_url } = await req.json();
    if (!psicologo_id) return json({ error: "Falta psicologo_id" }, 400);

    const envAppUrl = cleanOrigin(Deno.env.get("APP_PUBLIC_URL"));
    const requestOrigin = cleanOrigin(req.headers.get("origin"));
    const requestedAppUrl = cleanOrigin(app_url);
    const appUrl = requestedAppUrl && isAllowedAppUrl(requestedAppUrl, [envAppUrl, requestOrigin].filter(Boolean))
      ? requestedAppUrl
      : envAppUrl || requestOrigin || "http://localhost:5174";

    const { data: requester } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", authUser.user.id)
      .single();

    const { data: psychologist, error: psychologistError } = await supabase
      .from("psicologos")
      .select("id,usuario_id,usuarios!psicologos_usuario_id_fkey(nombre,apellido,email)")
      .eq("id", psicologo_id)
      .single();

    if (psychologistError || !psychologist) return json({ error: "Psicólogo no encontrado" }, 404);

    const isAdmin = requester?.rol === "admin";
    const isOwner = psychologist.usuario_id === authUser.user.id;
    if (!isAdmin && !isOwner) return json({ error: "No autorizado" }, 403);

    let { data: billingCustomer } = await supabase
      .from("stripe_billing_customers")
      .select("*")
      .eq("psicologo_id", psicologo_id)
      .maybeSingle();

    if (!billingCustomer) {
      const user = Array.isArray(psychologist.usuarios) ? psychologist.usuarios[0] : psychologist.usuarios;
      const customer = await stripeRequest("/customers", {
        email: user?.email || "",
        name: `${user?.nombre || ""} ${user?.apellido || ""}`.trim() || "MindCare Psicólogo",
        "metadata[psicologo_id]": psicologo_id,
      });

      const { data: created, error: createError } = await supabase
        .from("stripe_billing_customers")
        .insert({
          psicologo_id,
          stripe_customer_id: customer.id,
          estado: "activo",
        })
        .select()
        .single();

      if (createError) throw createError;
      billingCustomer = created;
    }

    const callbackBase = `${appUrl.replace(/\/$/, "")}/?`;
    const popupParam = popup ? "&stripe_setup_popup=1" : "";

    const session = await stripeRequest("/checkout/sessions", {
      mode: "setup",
      customer: billingCustomer.stripe_customer_id,
      "payment_method_types[0]": "card",
      success_url: `${callbackBase}stripe_setup_session_id={CHECKOUT_SESSION_ID}${popupParam}`,
      cancel_url: `${callbackBase}stripe_setup_cancelled=1${popupParam}`,
      "metadata[psicologo_id]": psicologo_id,
    });

    return json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error("stripe-create-setup-session error:", error);
    return json({ error: "No se pudo abrir Stripe." }, 500);
  }
});
