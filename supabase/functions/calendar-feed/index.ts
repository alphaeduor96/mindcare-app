import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface AppointmentRow {
  id: string;
  inicia_at: string;
  termina_at: string;
  estado: string;
  modalidad: "presencial" | "virtual";
  link_videollamada?: string | null;
  motivo_consulta?: string | null;
  pacientes?: {
    nombre?: string | null;
    apellido?: string | null;
  } | null;
  consultorios?: {
    nombre?: string | null;
    direccion?: string | null;
    municipio?: string | null;
  } | null;
}

function textResponse(body: string, status = 200, contentType = "text/plain; charset=utf-8") {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}

function escapeIcs(value?: string | null) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string) {
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 74) {
    chunks.push(remaining.slice(0, 74));
    remaining = ` ${remaining.slice(74)}`;
  }
  chunks.push(remaining);
  return chunks.join("\r\n");
}

function formatIcsDate(dateValue: string | Date) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function patientName(row: AppointmentRow) {
  return `${row.pacientes?.nombre || ""} ${row.pacientes?.apellido || ""}`.trim() || "Paciente";
}

function appointmentLocation(row: AppointmentRow) {
  if (row.modalidad === "virtual") return row.link_videollamada || "Sesión virtual";
  const office = row.consultorios;
  return [office?.nombre, office?.direccion, office?.municipio].filter(Boolean).join(", ");
}

function buildCalendar(rows: AppointmentRow[], feedToken: string) {
  const now = formatIcsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MindCare//Psychologist Calendar//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:MindCare Citas",
    "X-WR-TIMEZONE:America/Mexico_City",
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
  ];

  for (const row of rows) {
    const status = row.estado === "cancelada" ? "CANCELLED" : "CONFIRMED";
    const summary = `MindCare - ${patientName(row)}`;
    const location = appointmentLocation(row);
    const description = [
      `Estado: ${row.estado}`,
      `Modalidad: ${row.modalidad}`,
      row.motivo_consulta ? `Motivo: ${row.motivo_consulta}` : "",
    ].filter(Boolean).join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${row.id}@mindcare-${feedToken}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatIcsDate(row.inicia_at)}`,
      `DTEND:${formatIcsDate(row.termina_at)}`,
      `STATUS:${status}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `LOCATION:${escapeIcs(location)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return textResponse("Method not allowed", 405);

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const includeCancelled = url.searchParams.get("canceladas") === "1";

  if (!token) return textResponse("Missing calendar token", 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return textResponse("Supabase environment is not configured", 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: feed, error: feedError } = await supabase
    .from("calendar_feeds")
    .select("psicologo_id, activo")
    .eq("token", token)
    .single();

  if (feedError || !feed || !feed.activo) {
    return textResponse("Calendar feed not found", 404);
  }

  const rangeStart = new Date();
  rangeStart.setMonth(rangeStart.getMonth() - 1);
  const rangeEnd = new Date();
  rangeEnd.setMonth(rangeEnd.getMonth() + 12);

  let query = supabase
    .from("citas")
    .select("id,inicia_at,termina_at,estado,modalidad,link_videollamada,motivo_consulta,pacientes(nombre,apellido),consultorios(nombre,direccion,municipio)")
    .eq("psicologo_id", feed.psicologo_id)
    .gte("inicia_at", rangeStart.toISOString())
    .lte("inicia_at", rangeEnd.toISOString())
    .order("inicia_at", { ascending: true });

  if (!includeCancelled) query = query.neq("estado", "cancelada");

  const { data: appointments, error: appointmentsError } = await query;

  if (appointmentsError) {
    console.error("Calendar feed appointments error:", appointmentsError);
    return textResponse(appointmentsError.message, 500);
  }

  return textResponse(
    buildCalendar((appointments || []) as AppointmentRow[], token),
    200,
    "text/calendar; charset=utf-8",
  );
});
