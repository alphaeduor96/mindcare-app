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

function cleanOrigin(value: string | null | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

function isAllowedOrigin(value: string) {
  return value.startsWith("http://localhost:")
    || value.startsWith("http://127.0.0.1:")
    || value === cleanOrigin(Deno.env.get("APP_PUBLIC_URL"));
}

function providerClientId(provider: string) {
  if (provider === "zoom") return requireEnv("ZOOM_CLIENT_ID");
  if (provider === "google_meet") return requireEnv("GOOGLE_CLIENT_ID");
  throw new Error("Proveedor no soportado");
}

function redirectUri() {
  return `${requireEnv("SUPABASE_URL")}/functions/v1/video-oauth-callback`;
}

function buildAuthorizeUrl(provider: string, state: string) {
  const redirect = redirectUri();

  if (provider === "zoom") {
    const url = new URL("https://zoom.us/oauth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", providerClientId(provider));
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("state", state);
    return url.toString();
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", providerClientId(provider));
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("scope", [
    "openid",
    "email",
    "https://www.googleapis.com/auth/calendar.events",
  ].join(" "));
  url.searchParams.set("state", state);
  return url.toString();
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

    const { proveedor, psicologo_id, app_url } = await req.json();
    if (!["zoom", "google_meet"].includes(proveedor)) return json({ error: "Proveedor inválido" }, 400);
    if (!psicologo_id) return json({ error: "Falta psicologo_id" }, 400);

    const redirectOrigin = cleanOrigin(app_url) || cleanOrigin(req.headers.get("origin")) || cleanOrigin(Deno.env.get("APP_PUBLIC_URL"));
    if (!redirectOrigin || !isAllowedOrigin(redirectOrigin)) return json({ error: "Origen de app no permitido" }, 400);

    const { data: psychologist, error: psychologistError } = await supabase
      .from("psicologos")
      .select("id,usuario_id")
      .eq("id", psicologo_id)
      .single();

    if (psychologistError || !psychologist) return json({ error: "Psicólogo no encontrado" }, 404);
    if (psychologist.usuario_id !== authUser.user.id) return json({ error: "No autorizado" }, 403);

    const state = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: stateError } = await supabase
      .from("video_oauth_states")
      .insert({
        state_token: state,
        psicologo_id,
        usuario_id: authUser.user.id,
        proveedor,
        redirect_origin: redirectOrigin,
        expires_at: expiresAt,
      });

    if (stateError) throw stateError;

    return json({ url: buildAuthorizeUrl(proveedor, state) });
  } catch (error) {
    console.error("video-oauth-start error:", error);
    return json({ error: "No se pudo iniciar la conexión de videollamada." }, 500);
  }
});
