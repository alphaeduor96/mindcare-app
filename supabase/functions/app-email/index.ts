import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { checkRateLimit, clientIp, rateLimitHeaders } from "../_shared/rate_limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EmailType =
  | "appointment_created"
  | "appointment_updated"
  | "appointment_cancelled"
  | "payment_receipt"
  | "payment_pending"
  | "psychologist_welcome"
  | "subscription_charge_success"
  | "subscription_charge_failed"
  | "invoice_available";

type AuthorizationResult =
  | { ok: true; actorUserId: string; psychologistName?: string }
  | { ok: false; status: number; error: string };

const esc = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const money = (value: unknown) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

function requestHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";
  const configuredOrigins = [
    Deno.env.get("APP_PUBLIC_URL"),
    Deno.env.get("APP_ALLOWED_ORIGINS"),
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  const allowedOrigin =
    origin && (configuredOrigins.includes(origin.replace(/\/$/, "")) || isLocalOrigin)
      ? origin
      : configuredOrigins[0] || "https://app.mindcare.mx";

  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": allowedOrigin,
    "Vary": "Origin",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return Response.json(body, { status, headers: requestHeaders(request) });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function fullName(person?: { nombre?: string | null; apellido?: string | null } | null) {
  return `${person?.nombre || ""} ${person?.apellido || ""}`.trim();
}

function isGenericPsychologistName(value: unknown) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  return !normalized || ["psicologo", "psicologo(a)", "tu psicologo(a)"].includes(normalized);
}

const formatDate = (value: unknown) => {
  if (!value) return "Fecha por confirmar";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(String(value)));
};

function appointmentDetails(data: Record<string, any>, options: { includeCancellationPolicy?: boolean } = {}) {
  const lines = [
    ["Paciente", data.patientName],
    ["Psicólogo(a)", data.psychologistName],
    ["Fecha y hora", formatDate(data.startsAt)],
    ["Modalidad", data.modality === "virtual" ? "Videollamada" : "Presencial"],
    ["Consultorio", data.officeName],
    ["Dirección", data.officeAddress],
    ["Monto", data.amount ? money(data.amount) : ""],
  ].filter(([, value]) => value);

  const details = lines
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 10px"><b>${esc(label)}:</b> ${esc(String(value))}</p>`,
    )
    .join("");

  const cancellationPolicy = `
    <div style="margin-top:16px;padding:14px 16px;background:#fff8ed;border:1px solid #f4d7a1;border-radius:14px;color:#6d4b12">
      <p style="margin:0;line-height:1.55">
        <b>Política de cancelación:</b> puedes cancelar o reagendar tu cita sin costo hasta 24 horas antes.
        Si la cancelación se realiza con menos de 24 horas de anticipación, la sesión podrá cobrarse aunque no asistas.
      </p>
    </div>`;

  return `${details}${options.includeCancellationPolicy === false ? "" : cancellationPolicy}`;
}

function template(type: EmailType, data: Record<string, any>) {
  const patientName = data.patientName || "Paciente";
  const psychologistName = data.psychologistName || "tu psicólogo(a)";
  const appUrl = data.appUrl || Deno.env.get("APP_PUBLIC_URL") || "";

  const templates: Record<EmailType, { subject: string; title: string; intro: string; detail: string; cta?: string }> = {
    appointment_created: {
      subject: `Cita agendada con ${psychologistName}`,
      title: "Tu cita quedó agendada",
      intro: `Hola ${patientName}, te compartimos los detalles de tu cita.`,
      detail: appointmentDetails(data),
    },
    appointment_updated: {
      subject: `Tu cita fue actualizada`,
      title: "Tu cita fue actualizada",
      intro: `Hola ${patientName}, estos son los datos actualizados de tu cita.`,
      detail: appointmentDetails(data),
    },
    appointment_cancelled: {
      subject: `Tu cita fue cancelada`,
      title: "Cita cancelada",
      intro: `Hola ${patientName}, tu cita con ${psychologistName} fue cancelada.`,
      detail: appointmentDetails(data, { includeCancellationPolicy: false }),
    },
    payment_receipt: {
      subject: "Recibo de pago MindCare Pro",
      title: "Pago registrado",
      intro: `Hola ${patientName}, registramos tu pago correctamente.`,
      detail: `<p style="margin:0 0 10px"><b>Monto:</b> ${money(data.amount)}</p><p style="margin:0"><b>Fecha:</b> ${esc(formatDate(data.paidAt))}</p>`,
    },
    payment_pending: {
      subject: "Recordatorio de pago pendiente",
      title: "Pago pendiente",
      intro: `Hola ${patientName}, tienes un saldo pendiente con ${psychologistName}.`,
      detail: `<p style="margin:0"><b>Saldo pendiente:</b> ${money(data.amount)}</p>`,
    },
    psychologist_welcome: {
      subject: "Bienvenido a MindCare Pro",
      title: "Tu cuenta está lista",
      intro: `Hola ${data.psychologistName || "psicólogo(a)"}, ya puedes entrar a MindCare Pro.`,
      detail: data.email ? `<p style="margin:0"><b>Usuario:</b> ${esc(data.email)}</p>` : "",
      cta: appUrl,
    },
    subscription_charge_success: {
      subject: "Cobro de suscripción MindCare Pro",
      title: "Cobro realizado",
      intro: "Tu suscripción fue cobrada correctamente.",
      detail: `<p style="margin:0 0 10px"><b>Plan:</b> ${esc(data.planName || "")}</p><p style="margin:0 0 10px"><b>Monto:</b> ${money(data.amount)}</p><p style="margin:0"><b>Periodo:</b> ${esc(data.period || "")}</p>`,
    },
    subscription_charge_failed: {
      subject: "No pudimos cobrar tu suscripción",
      title: "Cobro no procesado",
      intro: "No pudimos procesar el cobro de tu suscripción. Revisa tu método de pago.",
      detail: `<p style="margin:0"><b>Plan:</b> ${esc(data.planName || "")}</p>`,
      cta: appUrl,
    },
    invoice_available: {
      subject: "Factura disponible",
      title: "Tu factura está disponible",
      intro: "Ya puedes consultar la factura o recibo informativo de tu periodo.",
      detail: `<p style="margin:0"><b>Periodo:</b> ${esc(data.period || "")}</p>`,
      cta: appUrl,
    },
  };

  return templates[type] || templates.appointment_created;
}

function renderHtml(type: EmailType, data: Record<string, any>) {
  const content = template(type, data);
  const publicUrl = (Deno.env.get("APP_PUBLIC_URL") || "https://app.mindcare.mx").replace(/\/$/, "");
  const logoUrl = Deno.env.get("APP_EMAIL_LOGO_URL") || `${publicUrl}/email/mindcare-logo-pro.png`;
  const brandMark = logoUrl
    ? `<img src="${esc(logoUrl)}" width="170" alt="MindCare Pro" style="display:block;max-width:170px;height:auto;margin:0 0 12px" />`
    : `<p style="margin:0;color:#8EDDD4;font-size:13px;font-weight:700;letter-spacing:.04em">MindCare Pro</p>`;
  const cta = content.cta
    ? `<a href="${esc(content.cta)}" style="display:inline-block;margin-top:22px;background:#4DB6AC;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:14px;font-weight:700">Abrir MindCare Pro</a>`
    : "";

  return `
<div style="margin:0;background:#f4fbfa;padding:32px;font-family:Arial,sans-serif;color:#153033">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dcefed;border-radius:24px;overflow:hidden">
    <div style="background:#062F32;padding:28px 32px;color:#ffffff">
      ${brandMark}
      <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2">${esc(content.title)}</h1>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 20px;line-height:1.6;color:#526d72">${esc(content.intro)}</p>
      <div style="background:#f8fffe;border:1px solid #e0f2f1;border-radius:18px;padding:18px">
        ${content.detail}
      </div>
      ${cta}
    </div>
    <div style="padding:18px 32px;background:#f8fffe;color:#607d80;font-size:12px">
      Este correo fue enviado automáticamente por MindCare Pro.
    </div>
  </div>
</div>`;
}

async function assertCanSendEmail(
  supabase: any,
  request: Request,
  type: EmailType,
  to: string,
  data: Record<string, any>
): Promise<AuthorizationResult> {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return { ok: false, status: 401, error: "No autorizado" };

  const { data: authUser, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authUser.user) return { ok: false, status: 401, error: "No autorizado" };

  const { data: requester } = await supabase
    .from("usuarios")
    .select("rol,email,nombre,apellido")
    .eq("id", authUser.user.id)
    .maybeSingle();

  if (requester?.rol === "admin") return { ok: true, actorUserId: authUser.user.id };

  if (["appointment_created", "appointment_updated", "appointment_cancelled", "payment_receipt", "payment_pending"].includes(type)) {
    const patientId = String(data.patientId || "").trim();
    if (!patientId) return { ok: false, status: 400, error: "Falta patientId para enviar este correo." };

    const { data: psychologist } = await supabase
      .from("psicologos")
      .select("id")
      .eq("usuario_id", authUser.user.id)
      .maybeSingle();

    if (!psychologist?.id) return { ok: false, status: 403, error: "No autorizado" };

    const { data: patient } = await supabase
      .from("pacientes")
      .select("id,email,creado_por_psicologo_id")
      .eq("id", patientId)
      .maybeSingle();

    if (!patient || patient.creado_por_psicologo_id !== psychologist.id || cleanEmail(patient.email) !== cleanEmail(to)) {
      return { ok: false, status: 403, error: "No autorizado para enviar correo a este paciente." };
    }

    return {
      ok: true,
      actorUserId: authUser.user.id,
      psychologistName: fullName(requester) || "tu psicólogo(a)",
    };
  }

  if (["psychologist_welcome", "subscription_charge_success", "subscription_charge_failed", "invoice_available"].includes(type)) {
    if (cleanEmail(requester?.email) === cleanEmail(to)) return { ok: true };
  }

  return { ok: false, status: 403, error: "No autorizado" };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: requestHeaders(request) });

  try {
    if (request.method !== "POST") {
      return json(request, { error: "Method not allowed" }, 405);
    }

    const payload = await request.json();
    const type = String(payload.type || "") as EmailType;
    const to = String(payload.to || "").trim();
    const data = payload.data || {};
    const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));

    const ipLimit = await checkRateLimit(supabase, {
      scope: "app-email:ip",
      identifier: clientIp(request),
      maxRequests: 60,
      windowSeconds: 60,
    });
    if (!ipLimit.allowed) {
      return json(request, { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }, 429);
    }

    if (!type || !to) {
      return json(request, { error: "type y to son obligatorios." }, 400);
    }

    const authorization = await assertCanSendEmail(supabase, request, type, to, data);
    if (!authorization.ok) {
      return json(request, { error: authorization.error }, authorization.status);
    }

    const userLimit = await checkRateLimit(supabase, {
      scope: `app-email:user:${type}`,
      identifier: authorization.actorUserId,
      maxRequests: 40,
      windowSeconds: 600,
    });
    if (!userLimit.allowed) {
      return Response.json(
        { error: "Límite temporal de correos alcanzado. Intenta de nuevo más tarde." },
        {
          status: 429,
          headers: {
            ...requestHeaders(request),
            ...rateLimitHeaders(userLimit),
          },
        },
      );
    }

    const emailData = { ...data };
    if (authorization.psychologistName && isGenericPsychologistName(emailData.psychologistName)) {
      emailData.psychologistName = authorization.psychologistName;
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return json(request, { error: "Servicio de correo no configurado." }, 500);
    }

    const fromEmail = Deno.env.get("APP_EMAIL_FROM") || "MindCare Pro <notificaciones@mindcare.mx>";
    const content = template(type, emailData);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        reply_to: payload.replyTo || undefined,
        subject: content.subject,
        html: renderHtml(type, emailData),
      }),
    });

    const responseText = await response.text();
    let result: any = {};
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (_error) {
      result = { message: responseText };
    }

    if (!response.ok) {
      console.error("app-email provider error:", result);
      return json(request, { error: "No se pudo enviar el correo." }, 502);
    }

    return json(request, { ok: true, id: result?.id });
  } catch (error) {
    console.error("app-email error:", error);
    return json(request, { error: "No se pudo procesar la solicitud." }, 500);
  }
});
