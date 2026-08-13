import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { empresasRoutes } from "./endpoints_empresas.tsx";
import { citasRoutes } from "./endpoints_citas.tsx";
import { reportesRoutes } from "./endpoints_reportes.tsx";

const app = new Hono();

function configuredOrigins() {
  return [
    Deno.env.get("APP_PUBLIC_URL"),
    Deno.env.get("APP_ALLOWED_ORIGINS"),
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function allowedOrigin(origin: string) {
  const normalized = origin.replace(/\/$/, "");
  if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalized)) return origin;
  return configuredOrigins().includes(normalized) ? origin : configuredOrigins()[0] || "https://app.mindcare.mx";
}

// Create Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: allowedOrigin,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/make-server-0e77298f/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/make-server-0e77298f/*", async (c, next) => {
  if (c.req.method === "OPTIONS") return next();

  const supabase = getSupabaseClient();
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return c.json({ error: "No autorizado" }, 401);
  }

  const { data: authUser, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authUser.user) {
    return c.json({ error: "No autorizado" }, 401);
  }

  const { data: requester, error: requesterError } = await supabase
    .from("usuarios")
    .select("rol,activo,estado")
    .eq("id", authUser.user.id)
    .single();

  const isActive = requester?.activo !== false && requester?.estado !== "inactivo";
  if (requesterError || !requester || !isActive) {
    return c.json({ error: "Usuario sin permisos" }, 403);
  }

  if (requester.rol !== "admin") {
    return c.json({ error: "Solo administradores pueden usar este endpoint legacy" }, 403);
  }

  await next();
});

// =====================================================
// AUTH ENDPOINTS
// =====================================================

app.post("/make-server-0e77298f/auth/signup", async (c) => {
  return c.json({
    error: "Endpoint legacy deshabilitado. Usa Supabase Auth o una función administrativa específica.",
  }, 410);
});

app.post("/make-server-0e77298f/auth/login", async (c) => {
  return c.json({
    error: "Endpoint legacy deshabilitado. Usa Supabase Auth.",
  }, 410);
});

// =====================================================
// USUARIOS ENDPOINTS
// =====================================================

app.get("/make-server-0e77298f/usuarios/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Get user error:", error);
      return c.json({ error: error.message }, 404);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Get user error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-0e77298f/usuarios/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("usuarios")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update user error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Update user error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// PSICÓLOGOS ENDPOINTS
// =====================================================

app.get("/make-server-0e77298f/psicologos", async (c) => {
  try {
    const { activo, verificado } = c.req.query();
    const supabase = getSupabaseClient();

    let query = supabase
      .from("vista_psicologos_completa")
      .select("*");

    if (activo !== undefined) {
      query = query.eq("activo", activo === "true");
    }
    if (verificado !== undefined) {
      query = query.eq("verificado", verificado === "true");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Get psychologists error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Get psychologists error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-0e77298f/psicologos/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("vista_psicologos_completa")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Get psychologist error:", error);
      return c.json({ error: error.message }, 404);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Get psychologist error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-0e77298f/psicologos", async (c) => {
  try {
    const psychologistData = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("psicologos")
      .insert(psychologistData)
      .select()
      .single();

    if (error) {
      console.error("Create psychologist error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Create psychologist error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-0e77298f/psicologos/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("psicologos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update psychologist error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Update psychologist error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-0e77298f/psicologos/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("psicologos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete psychologist error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Delete psychologist error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-0e77298f/psicologos/:id/profile", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data: psychologist, error: pError } = await supabase
      .from("vista_psicologos_completa")
      .select("*")
      .eq("id", id)
      .single();

    if (pError) {
      console.error("Get psychologist profile error:", pError);
      return c.json({ error: pError.message }, 404);
    }

    // Get reviews
    const { data: reviews } = await supabase
      .from("resenas")
      .select("*")
      .eq("psicologo_id", id)
      .eq("visible", true)
      .order("created_at", { ascending: false });

    // Get consultorios
    const { data: consultorios } = await supabase
      .from("psicologo_consultorios")
      .select("*, consultorio:consultorios(*)")
      .eq("psicologo_id", id);

    return c.json({
      ...psychologist,
      reviews: reviews || [],
      consultorios: consultorios || []
    });
  } catch (error: any) {
    console.error("Get psychologist profile error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// CONSULTORIOS ENDPOINTS
// =====================================================

app.get("/make-server-0e77298f/consultorios", async (c) => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("consultorios")
      .select("*")
      .eq("activo", true);

    if (error) {
      console.error("Get offices error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Get offices error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-0e77298f/consultorios/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("consultorios")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Get office error:", error);
      return c.json({ error: error.message }, 404);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Get office error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-0e77298f/consultorios", async (c) => {
  try {
    const officeData = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("consultorios")
      .insert(officeData)
      .select()
      .single();

    if (error) {
      console.error("Create office error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Create office error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-0e77298f/consultorios/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("consultorios")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update office error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Update office error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-0e77298f/consultorios/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("consultorios")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete office error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Delete office error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// MOUNT ADDITIONAL ROUTES
// =====================================================

app.route("/make-server-0e77298f/empresas", empresasRoutes);
app.route("/make-server-0e77298f", citasRoutes);
app.route("/make-server-0e77298f", reportesRoutes);

Deno.serve(app.fetch);
