import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function closeHtml(origin: string, status: "success" | "error", message: string) {
  const safeMessage = message.replace(/`/g, "'");
  return html(`<!doctype html>
<html><body>
<script>
  try {
    new BroadcastChannel("mindcare-video-integrations").postMessage({
      status: "${status}",
      message: \`${safeMessage}\`
    });
  } catch (error) {}
  window.location.href = "${origin}/?video_oauth_${status}=1";
  setTimeout(() => window.close(), 800);
</script>
${safeMessage}
</body></html>`);
}

function basicAuth(clientId: string, clientSecret: string) {
  return btoa(`${clientId}:${clientSecret}`);
}

async function exchangeZoomCode(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: `${requireEnv("SUPABASE_URL")}/functions/v1/video-oauth-callback`,
  });

  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(requireEnv("ZOOM_CLIENT_ID"), requireEnv("ZOOM_CLIENT_SECRET"))}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.reason || data?.error_description || "Zoom OAuth failed");
  return data;
}

async function exchangeGoogleCode(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
    redirect_uri: `${requireEnv("SUPABASE_URL")}/functions/v1/video-oauth-callback`,
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error_description || data?.error || "Google OAuth failed");
  return data;
}

async function getZoomEmail(accessToken: string) {
  const response = await fetch("https://api.zoom.us/v2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "No se pudo leer cuenta Zoom");
  return data.email || null;
}

async function getGoogleEmail(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error_description || "No se pudo leer cuenta Google");
  return data.email || null;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");

    const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));

    if (!state) return html("Falta state", 400);

    const { data: stateRow, error: stateError } = await supabase
      .from("video_oauth_states")
      .select("*")
      .eq("state_token", state)
      .is("consumed_at", null)
      .single();

    if (stateError || !stateRow) return html("State inválido o expirado", 400);
    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      return closeHtml(stateRow.redirect_origin, "error", "La conexión expiró. Intenta de nuevo.");
    }
    if (oauthError || !code) {
      return closeHtml(stateRow.redirect_origin, "error", oauthError || "No se recibió código OAuth.");
    }

    const provider = stateRow.proveedor;
    const tokenData = provider === "zoom" ? await exchangeZoomCode(code) : await exchangeGoogleCode(code);
    const accountEmail = provider === "zoom"
      ? await getZoomEmail(tokenData.access_token)
      : await getGoogleEmail(tokenData.access_token);

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
      : null;

    const { error: upsertError } = await supabase
      .from("video_integraciones")
      .upsert({
        psicologo_id: stateRow.psicologo_id,
        proveedor: provider,
        cuenta_email: accountEmail,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: expiresAt,
        scopes: tokenData.scope || tokenData.scopes || null,
        estado: "activa",
        metadata: tokenData,
      }, { onConflict: "psicologo_id,proveedor" });

    if (upsertError) throw upsertError;

    await supabase
      .from("video_oauth_states")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", stateRow.id);

    return closeHtml(stateRow.redirect_origin, "success", "Cuenta conectada correctamente.");
  } catch (error) {
    console.error("video-oauth-callback error:", error);
    return html(error instanceof Error ? error.message : "Error desconocido", 500);
  }
});
