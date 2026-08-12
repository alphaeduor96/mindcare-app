const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

const esc = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const money = (value: unknown) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

const formatDate = (value: unknown) => {
  if (!value) return "Fecha por confirmar";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(String(value)));
};

function appointmentDetails(data: Record<string, any>) {
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

  return `${details}${cancellationPolicy}`;
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
      detail: appointmentDetails(data),
    },
    payment_receipt: {
      subject: "Recibo de pago MindCare",
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
      subject: "Cobro de suscripción MindCare",
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
  const cta = content.cta
    ? `<a href="${esc(content.cta)}" style="display:inline-block;margin-top:22px;background:#4DB6AC;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:14px;font-weight:700">Abrir MindCare</a>`
    : "";

  return `
<div style="margin:0;background:#f4fbfa;padding:32px;font-family:Arial,sans-serif;color:#153033">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dcefed;border-radius:24px;overflow:hidden">
    <div style="background:#062F32;padding:28px 32px;color:#ffffff">
      <p style="margin:0;color:#8EDDD4;font-size:13px;font-weight:700;letter-spacing:.04em">MindCare</p>
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
      Este correo fue enviado automáticamente por MindCare.
    </div>
  </div>
</div>`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
    }

    const payload = await request.json();
    const type = String(payload.type || "") as EmailType;
    const to = String(payload.to || "").trim();
    const data = payload.data || {};

    if (!type || !to) {
      return Response.json({ error: "type y to son obligatorios." }, { status: 400, headers: corsHeaders });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return Response.json({ error: "Falta configurar RESEND_API_KEY." }, { status: 500, headers: corsHeaders });
    }

    const fromEmail = Deno.env.get("APP_EMAIL_FROM") || "MindCare <notificaciones@mindcare.mx>";
    const content = template(type, data);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        reply_to: payload.replyTo || undefined,
        subject: content.subject,
        html: renderHtml(type, data),
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
      return Response.json(
        { error: result?.message || "No se pudo enviar el correo.", detail: result },
        { status: 502, headers: corsHeaders },
      );
    }

    return Response.json({ ok: true, id: result?.id }, { headers: corsHeaders });
  } catch (error) {
    console.error("app-email error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo procesar la solicitud." },
      { status: 500, headers: corsHeaders },
    );
  }
});
