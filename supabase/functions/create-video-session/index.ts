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

function basicAuth(clientId: string, clientSecret: string) {
  return btoa(`${clientId}:${clientSecret}`);
}

function providerLabel(provider: string) {
  if (provider === "zoom") return "Zoom";
  if (provider === "google_meet") return "Google Meet";
  return "MindCare";
}

function patientName(patient: any) {
  return `${patient?.nombre || ""} ${patient?.apellido || ""}`.trim() || "Paciente";
}

async function refreshZoomToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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
  if (!response.ok) throw new Error(data?.reason || data?.error_description || "No se pudo refrescar Zoom");
  return data;
}

async function refreshGoogleToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error_description || data?.error || "No se pudo refrescar Google");
  return data;
}

async function getIntegrationToken(supabase: any, integration: any) {
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : 0;
  const shouldRefresh = integration.refresh_token && expiresAt && expiresAt < Date.now() + 2 * 60 * 1000;
  if (!shouldRefresh) return integration.access_token;

  const refreshed = integration.proveedor === "zoom"
    ? await refreshZoomToken(integration.refresh_token)
    : await refreshGoogleToken(integration.refresh_token);

  const nextExpiresAt = refreshed.expires_in
    ? new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString()
    : integration.token_expires_at;

  await supabase
    .from("video_integraciones")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token || integration.refresh_token,
      token_expires_at: nextExpiresAt,
      metadata: refreshed,
    })
    .eq("id", integration.id);

  return refreshed.access_token;
}

async function createZoomMeeting(accessToken: string, appointment: any, patient: any, duration: number, passcode: string) {
  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: `MindCare - Sesión con ${patientName(patient)}`,
      type: 2,
      start_time: appointment.inicia_at,
      duration,
      timezone: "America/Mexico_City",
      password: passcode,
      agenda: appointment.motivo_consulta || "Sesión MindCare",
      settings: {
        waiting_room: true,
        join_before_host: false,
        participant_video: true,
        host_video: true,
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "No se pudo crear reunión Zoom");
  return {
    join_url: data.join_url,
    start_url: data.start_url,
    provider_meeting_id: String(data.id),
    metadata: data,
  };
}

async function createGoogleMeet(accessToken: string, appointment: any, patient: any) {
  const attendees = patient?.email ? [{ email: patient.email }] : [];
  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: `MindCare - Sesión con ${patientName(patient)}`,
      description: appointment.motivo_consulta || "Sesión MindCare",
      start: { dateTime: appointment.inicia_at, timeZone: "America/Mexico_City" },
      end: { dateTime: appointment.termina_at, timeZone: "America/Mexico_City" },
      attendees,
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "No se pudo crear Google Meet");
  const videoEntry = data.conferenceData?.entryPoints?.find((entry: any) => entry.entryPointType === "video");
  return {
    join_url: data.hangoutLink || videoEntry?.uri,
    start_url: data.htmlLink,
    provider_meeting_id: data.id,
    metadata: data,
  };
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

    const limit = await checkRateLimit(supabase, {
      scope: "create-video-session:user",
      identifier: authUser.user.id,
      maxRequests: 20,
      windowSeconds: 600,
    });
    if (!limit.allowed) return json({ error: "Demasiadas solicitudes. Intenta de nuevo más tarde." }, 429);

    const {
      proveedor = "mindcare_webrtc",
      psicologo_id,
      paciente_id,
      cita_id,
      duracion_minutos = 50,
      codigo_acceso,
      app_url,
    } = await req.json();

    if (!["mindcare_webrtc", "zoom", "google_meet"].includes(proveedor)) return json({ error: "Proveedor inválido" }, 400);
    if (!psicologo_id || !paciente_id || !cita_id) return json({ error: "Faltan datos de la sesión" }, 400);

    const { data: psychologist, error: psychologistError } = await supabase
      .from("psicologos")
      .select("id,usuario_id")
      .eq("id", psicologo_id)
      .single();
    if (psychologistError || !psychologist) return json({ error: "Psicólogo no encontrado" }, 404);
    if (psychologist.usuario_id !== authUser.user.id) return json({ error: "No autorizado" }, 403);

    const { data: appointment, error: appointmentError } = await supabase
      .from("citas")
      .select("id,psicologo_id,paciente_id,inicia_at,termina_at,motivo_consulta,pacientes(id,nombre,apellido,email,telefono)")
      .eq("id", cita_id)
      .single();
    if (appointmentError || !appointment) return json({ error: "Cita no encontrada" }, 404);
    if (appointment.psicologo_id !== psicologo_id || appointment.paciente_id !== paciente_id) {
      return json({ error: "La cita no coincide con paciente/psicólogo" }, 400);
    }

    const passcode = codigo_acceso || Math.random().toString(36).slice(2, 8).toUpperCase();
    const duration = Number(duracion_minutos || 50);
    const startsAt = new Date(appointment.inicia_at);
    const expiresAt = new Date(startsAt.getTime() + duration * 60000);
    const salaToken = crypto.randomUUID();
    const appOrigin = cleanOrigin(app_url) || cleanOrigin(req.headers.get("origin")) || cleanOrigin(Deno.env.get("APP_PUBLIC_URL")) || "http://localhost:5174";
    let providerResult = {
      join_url: `${appOrigin}/?video_session=${salaToken}`,
      start_url: `${appOrigin}/?video_session=${salaToken}`,
      provider_meeting_id: salaToken,
      metadata: {},
    };

    if (proveedor !== "mindcare_webrtc") {
      const { data: integration, error: integrationError } = await supabase
        .from("video_integraciones")
        .select("*")
        .eq("psicologo_id", psicologo_id)
        .eq("proveedor", proveedor)
        .eq("estado", "activa")
        .single();
      if (integrationError || !integration) {
        return json({ error: `Conecta tu cuenta de ${providerLabel(proveedor)} antes de crear esta videollamada.` }, 400);
      }

      const accessToken = await getIntegrationToken(supabase, integration);
      providerResult = proveedor === "zoom"
        ? await createZoomMeeting(accessToken, appointment, appointment.pacientes, duration, passcode)
        : await createGoogleMeet(accessToken, appointment, appointment.pacientes);
    }

    const { data: created, error: insertError } = await supabase
      .from("videollamada_sesiones")
      .insert({
        psicologo_id,
        paciente_id,
        cita_id,
        sala_token: salaToken,
        codigo_acceso: passcode,
        duracion_minutos: duration,
        inicia_at: startsAt.toISOString(),
        expira_at: expiresAt.toISOString(),
        estado: "programada",
        proveedor,
        join_url: providerResult.join_url,
        start_url: providerResult.start_url,
        provider_meeting_id: providerResult.provider_meeting_id,
        metadata: providerResult.metadata,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;
    return json({ session: created });
  } catch (error) {
    console.error("create-video-session error:", error);
    return json({ error: "No se pudo crear la videollamada." }, 500);
  }
});
