import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { checkRateLimit, clientIp, rateLimitHeaders } from "../_shared/rate_limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const esc = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const phoneDigits = (value = "") => String(value).replace(/\D/g, "");

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
    }

    const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
    const ipLimit = await checkRateLimit(supabase, {
      scope: "company-lead-email:ip",
      identifier: clientIp(request),
      maxRequests: 5,
      windowSeconds: 600,
    });
    if (!ipLimit.allowed) {
      return Response.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders(ipLimit),
          },
        },
      );
    }

    const payload = await request.json();
    const name = String(payload.name || "").trim();
    const company = String(payload.company || "").trim();
    const email = String(payload.email || "").trim();
    const whatsapp = String(payload.whatsapp || "No especificado").trim();
    const employees = String(payload.employees || "No especificado").trim();
    const message = String(payload.message || "Sin mensaje").trim();
    const whatsappLink = phoneDigits(whatsapp)
      ? `https://wa.me/${phoneDigits(whatsapp)}`
      : "";

    if (!name || !company || !email) {
      return Response.json(
        { error: "Nombre, empresa y correo son obligatorios." },
        { status: 400, headers: corsHeaders },
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return Response.json(
        { error: "Falta configurar RESEND_API_KEY en Supabase Secrets." },
        { status: 500, headers: corsHeaders },
      );
    }

    const toEmail = Deno.env.get("LEADS_TO_EMAIL");
    const fromEmail = Deno.env.get("LEADS_FROM_EMAIL") || "MindCare <onboarding@resend.dev>";
    if (!toEmail) {
      return Response.json(
        { error: "Falta configurar LEADS_TO_EMAIL en Supabase Secrets." },
        { status: 500, headers: corsHeaders },
      );
    }

    const html = `
<div style="margin:0;background:#f4fbfa;padding:32px;font-family:Arial,sans-serif;color:#153033">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dcefed;border-radius:24px;overflow:hidden">
    <div style="background:#062F32;padding:28px 32px;color:#ffffff">
      <p style="margin:0;color:#8EDDD4;font-size:13px;font-weight:700;letter-spacing:.04em">MindCare Empresas</p>
      <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2">Nueva solicitud de información</h1>
    </div>
    <div style="padding:28px 32px">
      <h2 style="font-size:18px;margin:0 0 16px;color:#153033">Datos del contacto</h2>
      <div style="background:#f8fffe;border:1px solid #e0f2f1;border-radius:18px;padding:18px">
        <p style="margin:0 0 10px"><b>Nombre:</b> ${esc(name)}</p>
        <p style="margin:0 0 10px"><b>Empresa:</b> ${esc(company)}</p>
        <p style="margin:0 0 10px"><b>Correo:</b> <a href="mailto:${esc(email)}" style="color:#00796B">${esc(email)}</a></p>
        <p style="margin:0 0 10px"><b>WhatsApp:</b> ${whatsappLink ? `<a href="${whatsappLink}" style="color:#00796B">${esc(whatsapp)}</a>` : esc(whatsapp)}</p>
        <p style="margin:0"><b>Colaboradores:</b> ${esc(employees)}</p>
      </div>
      <div style="margin-top:22px;padding:20px;background:#f4fbfa;border-radius:18px">
        <p style="margin:0 0 8px;font-weight:700;color:#153033">Qué busca resolver</p>
        <p style="margin:0;line-height:1.6;color:#526d72">${esc(message).replaceAll("\n", "<br>")}</p>
      </div>
      <div style="margin-top:26px">
        <a href="mailto:${esc(email)}" style="display:inline-block;background:#4DB6AC;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700">Responder por correo</a>
        ${whatsappLink ? `<a href="${whatsappLink}" style="display:inline-block;margin-left:8px;background:#062F32;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700">Abrir WhatsApp</a>` : ""}
      </div>
    </div>
    <div style="padding:18px 32px;background:#f8fffe;color:#607d80;font-size:12px">
      Este lead fue enviado desde la landing de MindCare Empresas.
    </div>
  </div>
</div>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `Nuevo lead Empresas: ${company}`,
        html,
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
      console.error("Company lead provider error:", result);
      return Response.json(
        { error: "No se pudo enviar la solicitud." },
        { status: 502, headers: corsHeaders },
      );
    }

    return Response.json({ ok: true, id: result?.id }, { headers: corsHeaders });
  } catch (error) {
    console.error("Company lead email error:", error);
    return Response.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 500, headers: corsHeaders },
    );
  }
});
