import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

export const citasRoutes = new Hono();

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
};

// =====================================================
// CITAS ENDPOINTS
// =====================================================

citasRoutes.get("/", async (c) => {
  try {
    const { psicologo_id, paciente_id, fecha_desde, fecha_hasta } = c.req.query();
    const supabase = getSupabaseClient();

    let query = supabase
      .from("vista_citas_completa")
      .select("*")
      .order("fecha_hora", { ascending: true });

    if (psicologo_id) {
      query = query.eq("psicologo_id", psicologo_id);
    }
    if (paciente_id) {
      query = query.eq("paciente_id", paciente_id);
    }
    if (fecha_desde) {
      query = query.gte("fecha_hora", fecha_desde);
    }
    if (fecha_hasta) {
      query = query.lte("fecha_hora", fecha_hasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Get appointments error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Get appointments error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("vista_citas_completa")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Get appointment error:", error);
      return c.json({ error: error.message }, 404);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Get appointment error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.post("/", async (c) => {
  try {
    const appointmentData = await c.req.json();
    const supabase = getSupabaseClient();

    // Verificar disponibilidad del psicólogo
    const fechaCita = new Date(appointmentData.fecha_hora);
    const diaSemana = fechaCita.getDay();

    const { data: disponibilidad } = await supabase
      .from("disponibilidad_horarios")
      .select("*")
      .eq("psicologo_id", appointmentData.psicologo_id)
      .eq("dia_semana", diaSemana)
      .eq("activo", true);

    if (!disponibilidad || disponibilidad.length === 0) {
      return c.json({ error: "El psicólogo no tiene disponibilidad en este día" }, 400);
    }

    // Verificar conflictos con otras citas
    const { data: citasExistentes } = await supabase
      .from("citas")
      .select("*")
      .eq("psicologo_id", appointmentData.psicologo_id)
      .eq("fecha_hora", appointmentData.fecha_hora)
      .in("estado", ["agendada", "confirmada"]);

    if (citasExistentes && citasExistentes.length > 0) {
      return c.json({ error: "Ya existe una cita en este horario" }, 400);
    }

    // Crear la cita
    const { data, error } = await supabase
      .from("citas")
      .insert(appointmentData)
      .select()
      .single();

    if (error) {
      console.error("Create appointment error:", error);
      return c.json({ error: error.message }, 400);
    }

    // Actualizar contador de sesiones si es de empresa
    if (appointmentData.empresa_id) {
      await supabase.rpc("incrementar_sesiones_usadas_empresa", {
        empresa_id_param: appointmentData.empresa_id
      });
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Create appointment error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("citas")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update appointment error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Update appointment error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("citas")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete appointment error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Delete appointment error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.post("/:id/cancelar", async (c) => {
  try {
    const id = c.req.param("id");
    const { motivo } = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("citas")
      .update({
        estado: "cancelada",
        fecha_cancelacion: new Date().toISOString(),
        motivo_cancelacion: motivo
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Cancel appointment error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Cancel appointment error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// DISPONIBILIDAD ENDPOINTS
// =====================================================

citasRoutes.get("/psicologos/:id/disponibilidad", async (c) => {
  try {
    const psicologoId = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("disponibilidad_horarios")
      .select(`
        *,
        consultorio:consultorios(*)
      `)
      .eq("psicologo_id", psicologoId)
      .eq("activo", true)
      .order("dia_semana", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (error) {
      console.error("Get availability error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Get availability error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.post("/disponibilidad", async (c) => {
  try {
    const availabilityData = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("disponibilidad_horarios")
      .insert(availabilityData)
      .select()
      .single();

    if (error) {
      console.error("Create availability error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Create availability error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.put("/disponibilidad/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("disponibilidad_horarios")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update availability error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Update availability error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.delete("/disponibilidad/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("disponibilidad_horarios")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete availability error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Delete availability error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// EMPLEADOS ENDPOINTS
// =====================================================

citasRoutes.get("/empleados/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("empleados")
      .select(`
        *,
        usuario:usuarios(*),
        empresa:empresas(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Get employee error:", error);
      return c.json({ error: error.message }, 404);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Get employee error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.post("/empleados", async (c) => {
  try {
    const employeeData = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("empleados")
      .insert(employeeData)
      .select()
      .single();

    if (error) {
      console.error("Create employee error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Create employee error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.put("/empleados/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("empleados")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update employee error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Update employee error:", error);
    return c.json({ error: error.message }, 500);
  }
});

citasRoutes.delete("/empleados/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("empleados")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete employee error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Delete employee error:", error);
    return c.json({ error: error.message }, 500);
  }
});
