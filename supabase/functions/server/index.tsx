import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { empresasRoutes } from "./endpoints_empresas.tsx";
import { citasRoutes } from "./endpoints_citas.tsx";
import { reportesRoutes } from "./endpoints_reportes.tsx";

const app = new Hono();

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
    origin: "*",
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

// =====================================================
// AUTH ENDPOINTS
// =====================================================

app.post("/make-server-0e77298f/auth/signup", async (c) => {
  try {
    const { email, password, nombre, apellido, rol, telefono } = await c.req.json();
    const supabase = getSupabaseClient();

    console.log(`Creating user: ${email}, role: ${rol}`);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since we don't have email server configured
      user_metadata: {
        nombre,
        apellido,
        rol,
        telefono
      }
    });

    if (authError) {
      console.error("Auth user creation error:", authError);
      return c.json({ error: `Error al crear usuario en Auth: ${authError.message}` }, 400);
    }

    console.log(`User created in Auth with ID: ${authData.user.id}`);

    // Create user in usuarios table
    const { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .insert({
        id: authData.user.id, // Use same ID from auth.users
        email,
        nombre,
        apellido,
        telefono,
        rol,
        activo: true
      })
      .select()
      .single();

    if (userError) {
      console.error("User table creation error:", userError);
      // If usuarios insert fails, try to clean up auth user
      console.log(`Cleaning up auth user: ${authData.user.id}`);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: `Error al crear perfil de usuario: ${userError.message}` }, 400);
    }

    console.log(`User profile created successfully for: ${email}`);

    // Generate a simple access token
    const access_token = btoa(JSON.stringify({
      user_id: authData.user.id,
      email: authData.user.email,
      timestamp: Date.now()
    }));

    return c.json({
      user: usuario,
      access_token,
      message: "Usuario creado exitosamente. Use estas credenciales para iniciar sesión."
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return c.json({ error: `Error en el proceso de registro: ${error.message}` }, 500);
  }
});

app.post("/make-server-0e77298f/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const supabase = getSupabaseClient();

    // MÉTODO HÍBRIDO: Intentar con Supabase Auth primero, luego con password_hash

    // Intento 1: Supabase Auth (usuarios nuevos creados con admin.createUser)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!authError && authData?.user) {
      // Login exitoso con Supabase Auth
      console.log(`Supabase Auth successful for user: ${authData.user.email}`);

      let { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (userError || !usuario) {
        console.log("User not found in usuarios table, attempting to create from auth metadata");

        // Si el usuario existe en auth pero no en la tabla usuarios, crearlo
        const metadata = authData.user.user_metadata || {};
        const emailParts = authData.user.email?.split('@') || ['User'];

        const { data: newUser, error: createError } = await supabase
          .from("usuarios")
          .insert({
            id: authData.user.id,
            email: authData.user.email || '',
            nombre: metadata.nombre || emailParts[0],
            apellido: metadata.apellido || '',
            telefono: metadata.telefono || '',
            rol: metadata.rol || 'empleado',
            activo: true
          })
          .select()
          .single();

        if (createError) {
          console.error("Failed to create user in usuarios table:", createError);
          return c.json({ error: "Error al crear perfil de usuario" }, 500);
        }

        usuario = newUser;
        console.log("User profile created successfully from auth metadata");
      }

      // Verificar que el usuario esté activo
      if (!usuario.activo) {
        return c.json({ error: "Usuario inactivo" }, 401);
      }

      return c.json({
        user: usuario,
        access_token: authData.session.access_token,
        session: authData.session
      });
    }

    // Intento 2: Sistema legacy con password_hash (usuarios antiguos)
    console.log("Supabase Auth failed, trying legacy password_hash system");

    const { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .eq("activo", true)
      .single();

    if (userError || !usuario) {
      console.error("User fetch error:", userError);
      return c.json({ error: "Credenciales incorrectas" }, 401);
    }

    // Verificar si tiene password_hash (sistema legacy)
    if (usuario.password_hash && usuario.password_hash === password) {
      // Login exitoso con password_hash
      const access_token = btoa(JSON.stringify({
        user_id: usuario.id,
        email: usuario.email,
        timestamp: Date.now()
      }));

      // Remover password_hash de la respuesta
      delete usuario.password_hash;

      return c.json({
        user: usuario,
        access_token,
        message: "Login con sistema legacy. Considere migrar a Supabase Auth."
      });
    }

    // Si llegamos aquí, las credenciales son incorrectas
    console.error("Invalid credentials for user:", email);
    return c.json({ error: "Credenciales incorrectas" }, 401);
  } catch (error: any) {
    console.error("Login error:", error);
    return c.json({ error: error.message || "Login failed" }, 500);
  }
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