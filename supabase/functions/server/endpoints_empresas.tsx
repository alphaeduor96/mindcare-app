import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

export const empresasRoutes = new Hono();

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
};

// =====================================================
// EMPRESAS ENDPOINTS
// =====================================================

empresasRoutes.get("/", async (c) => {
  try {
    const supabase = getSupabaseClient();

    // Get empresas with usuario data
    const { data: empresas, error } = await supabase
      .from("empresas")
      .select(`
        *,
        usuario:usuarios(id, email, nombre, apellido, telefono, foto_perfil, activo)
      `);

    if (error) {
      console.error("Get companies error:", error);
      return c.json({ error: error.message }, 400);
    }

    // Transform data to flatten usuario fields
    const transformedData = empresas?.map((empresa: any) => ({
      ...empresa,
      nombre: empresa.usuario?.nombre,
      apellido: empresa.usuario?.apellido,
      email: empresa.usuario?.email,
      telefono: empresa.usuario?.telefono,
      foto_perfil: empresa.usuario?.foto_perfil,
    })) || [];

    return c.json(transformedData);
  } catch (error: any) {
    console.error("Get companies error:", error);
    return c.json({ error: error.message }, 500);
  }
});

empresasRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("empresas")
      .select(`
        *,
        usuario:usuarios(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Get company error:", error);
      return c.json({ error: error.message }, 404);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Get company error:", error);
    return c.json({ error: error.message }, 500);
  }
});

empresasRoutes.post("/", async (c) => {
  try {
    const companyData = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("empresas")
      .insert(companyData)
      .select()
      .single();

    if (error) {
      console.error("Create company error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Create company error:", error);
    return c.json({ error: error.message }, 500);
  }
});

empresasRoutes.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("empresas")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update company error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Update company error:", error);
    return c.json({ error: error.message }, 500);
  }
});

empresasRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("empresas")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete company error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Delete company error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// EMPLEADOS DE EMPRESA
// =====================================================

empresasRoutes.get("/:id/empleados", async (c) => {
  try {
    const empresaId = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("empleados")
      .select(`
        *,
        usuario:usuarios(*)
      `)
      .eq("empresa_id", empresaId)
      .eq("activo", true);

    if (error) {
      console.error("Get employees error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Get employees error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// REPORTES EMPRESARIALES
// =====================================================

empresasRoutes.get("/:id/reportes", async (c) => {
  try {
    const empresaId = c.req.param("id");
    const { periodo_inicio, periodo_fin } = c.req.query();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("reportes_empresariales")
      .select("*")
      .eq("empresa_id", empresaId)
      .gte("periodo_inicio", periodo_inicio)
      .lte("periodo_fin", periodo_fin)
      .order("periodo_inicio", { ascending: false });

    if (error) {
      console.error("Get company reports error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Get company reports error:", error);
    return c.json({ error: error.message }, 500);
  }
});
