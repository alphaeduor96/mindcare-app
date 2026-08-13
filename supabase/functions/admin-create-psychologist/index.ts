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

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    nombre: parts[0] || "",
    apellido: parts.slice(1).join(" ") || parts[0] || "",
  };
}

function tempPassword() {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `MindCare-${random}!`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let createdAuthUserId = "";

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

    if (requester?.rol !== "admin") {
      return json({ error: "Solo un administrador puede crear psicólogos" }, 403);
    }

    const payload = await req.json();
    const {
      fullName,
      email,
      phone,
      license,
      approach,
      subspecialties = [],
      bio,
      experience,
      hourlyRate,
      modalidades = ["presencial", "virtual"],
      membresia = "red_afiliado",
    } = payload;

    if (!fullName || !email || !phone || !license || !approach) {
      return json({ error: "Faltan campos requeridos" }, 400);
    }

    const password = tempPassword();
    const { nombre, apellido } = splitName(fullName);

    const { data: authCreated, error: createAuthError } = await supabase.auth.admin.createUser({
      email: String(email).toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellido,
        rol: "psicologo",
        telefono: phone,
      },
    });

    if (createAuthError || !authCreated.user) {
      return json({ error: createAuthError?.message || "No se pudo crear el usuario Auth" }, 400);
    }

    createdAuthUserId = authCreated.user.id;

    const { error: userError } = await supabase.from("usuarios").insert({
      id: createdAuthUserId,
      email: String(email).toLowerCase(),
      nombre,
      apellido,
      telefono: phone,
      rol: "psicologo",
      estado: "activo",
    });

    if (userError) throw userError;

    const privateRate = hourlyRate ? Math.round(Number(hourlyRate) * 100) : null;
    const { data: psychologist, error: psychologistError } = await supabase
      .from("psicologos")
      .insert({
        usuario_id: createdAuthUserId,
        cedula_profesional: license,
        especialidades: [approach, ...subspecialties],
        enfoque_principal: approach,
        biografia: bio || `Psicólogo especializado en ${approach}`,
        anos_experiencia: Number(experience || 0),
        membresia,
        tarifa_privada_centavos: privateRate,
        tarifa_red_centavos: 35000,
        duracion_sesion_minutos: 60,
        modalidades,
        acepta_nuevos_pacientes: true,
        verificado_at: new Date().toISOString(),
        aprobado_por: authUser.user.id,
        estado: "activo",
      })
      .select("id,usuario_id")
      .single();

    if (psychologistError) throw psychologistError;

    return json({
      ok: true,
      user: {
        id: createdAuthUserId,
        email: String(email).toLowerCase(),
        nombre,
        apellido,
      },
      psychologist,
      password,
    });
  } catch (error) {
    console.error("admin-create-psychologist error:", error);

    if (createdAuthUserId) {
      await createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"))
        .auth.admin.deleteUser(createdAuthUserId);
    }

    return json({ error: "No se pudo completar la operación." }, 500);
  }
});
