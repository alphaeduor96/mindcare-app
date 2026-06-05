import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

export const reportesRoutes = new Hono();

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
};

// =====================================================
// RESEÑAS ENDPOINTS
// =====================================================

reportesRoutes.get("/psicologos/:id/resenas", async (c) => {
  try {
    const psicologoId = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("resenas")
      .select(`
        *,
        paciente:usuarios(nombre, apellido, foto_perfil)
      `)
      .eq("psicologo_id", psicologoId)
      .eq("visible", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get reviews error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Get reviews error:", error);
    return c.json({ error: error.message }, 500);
  }
});

reportesRoutes.post("/resenas", async (c) => {
  try {
    const reviewData = await c.req.json();
    const supabase = getSupabaseClient();

    // Verificar que la cita existe y está completada
    const { data: cita } = await supabase
      .from("citas")
      .select("*")
      .eq("id", reviewData.cita_id)
      .single();

    if (!cita || cita.estado !== "completada") {
      return c.json({ error: "Solo puedes dejar reseñas para citas completadas" }, 400);
    }

    // Verificar que no existe ya una reseña para esta cita
    const { data: reseñaExistente } = await supabase
      .from("resenas")
      .select("*")
      .eq("cita_id", reviewData.cita_id)
      .single();

    if (reseñaExistente) {
      return c.json({ error: "Ya existe una reseña para esta cita" }, 400);
    }

    const { data, error } = await supabase
      .from("resenas")
      .insert(reviewData)
      .select()
      .single();

    if (error) {
      console.error("Create review error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Create review error:", error);
    return c.json({ error: error.message }, 500);
  }
});

reportesRoutes.put("/resenas/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("resenas")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update review error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Update review error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// CORTES DE PAGO ENDPOINTS
// =====================================================

reportesRoutes.get("/psicologos/:id/cortes", async (c) => {
  try {
    const psicologoId = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("cortes_pago")
      .select("*")
      .eq("psicologo_id", psicologoId)
      .order("periodo_inicio", { ascending: false });

    if (error) {
      console.error("Get payment cuts error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Get payment cuts error:", error);
    return c.json({ error: error.message }, 500);
  }
});

reportesRoutes.get("/cortes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("cortes_pago")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Get payment cut error:", error);
      return c.json({ error: error.message }, 404);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Get payment cut error:", error);
    return c.json({ error: error.message }, 500);
  }
});

reportesRoutes.post("/cortes/:id/procesar", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("cortes_pago")
      .update({
        estado: "procesado",
        fecha_pago: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Process payment cut error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Process payment cut error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// ESTADÍSTICAS DE PSICÓLOGO
// =====================================================

reportesRoutes.get("/psicologos/:id/estadisticas", async (c) => {
  try {
    const psicologoId = c.req.param("id");
    const supabase = getSupabaseClient();

    // Obtener datos del psicólogo
    const { data: psicologo } = await supabase
      .from("psicologos")
      .select("*")
      .eq("id", psicologoId)
      .single();

    // Total de citas
    const { count: totalCitas } = await supabase
      .from("citas")
      .select("*", { count: "exact", head: true })
      .eq("psicologo_id", psicologoId);

    // Citas completadas
    const { count: citasCompletadas } = await supabase
      .from("citas")
      .select("*", { count: "exact", head: true })
      .eq("psicologo_id", psicologoId)
      .eq("estado", "completada");

    // Citas próximas
    const { count: citasProximas } = await supabase
      .from("citas")
      .select("*", { count: "exact", head: true })
      .eq("psicologo_id", psicologoId)
      .gte("fecha_hora", new Date().toISOString())
      .in("estado", ["agendada", "confirmada"]);

    // Ingresos totales
    const { data: citas } = await supabase
      .from("citas")
      .select("costo")
      .eq("psicologo_id", psicologoId)
      .eq("estado", "completada");

    const ingresosTotales = citas?.reduce((sum, c) => sum + (c.costo || 0), 0) || 0;

    // Pacientes únicos
    const { data: pacientesUnicos } = await supabase
      .from("citas")
      .select("paciente_id")
      .eq("psicologo_id", psicologoId)
      .eq("estado", "completada");

    const totalPacientes = new Set(pacientesUnicos?.map(c => c.paciente_id) || []).size;

    return c.json({
      psicologo,
      estadisticas: {
        total_citas: totalCitas || 0,
        citas_completadas: citasCompletadas || 0,
        citas_proximas: citasProximas || 0,
        ingresos_totales: ingresosTotales,
        total_pacientes: totalPacientes,
        calificacion_promedio: psicologo?.calificacion_promedio || 0,
        total_resenas: psicologo?.total_resenas || 0
      }
    });
  } catch (error: any) {
    console.error("Get psychologist stats error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// DASHBOARD ADMIN
// =====================================================

reportesRoutes.get("/admin/dashboard", async (c) => {
  try {
    const supabase = getSupabaseClient();

    // Total de psicólogos activos
    const { count: totalPsicologos } = await supabase
      .from("psicologos")
      .select("*", { count: "exact", head: true })
      .eq("activo", true);

    // Total de empresas activas
    const { count: totalEmpresas } = await supabase
      .from("empresas")
      .select("*", { count: "exact", head: true })
      .eq("activo", true);

    // Total de empleados activos
    const { count: totalEmpleados } = await supabase
      .from("empleados")
      .select("*", { count: "exact", head: true })
      .eq("activo", true);

    // Total de citas este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { count: citasMes } = await supabase
      .from("citas")
      .select("*", { count: "exact", head: true })
      .gte("fecha_hora", inicioMes.toISOString());

    // Citas por estado
    const { data: citasPorEstado } = await supabase
      .from("citas")
      .select("estado")
      .gte("fecha_hora", inicioMes.toISOString());

    const estadisticasCitas = {
      agendadas: citasPorEstado?.filter(c => c.estado === "agendada").length || 0,
      confirmadas: citasPorEstado?.filter(c => c.estado === "confirmada").length || 0,
      completadas: citasPorEstado?.filter(c => c.estado === "completada").length || 0,
      canceladas: citasPorEstado?.filter(c => c.estado === "cancelada").length || 0,
    };

    // Últimas citas
    const { data: ultimasCitas } = await supabase
      .from("vista_citas_completa")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    return c.json({
      totales: {
        psicologos: totalPsicologos || 0,
        empresas: totalEmpresas || 0,
        empleados: totalEmpleados || 0,
        citas_mes: citasMes || 0
      },
      citas: estadisticasCitas,
      ultimas_citas: ultimasCitas || []
    });
  } catch (error: any) {
    console.error("Get admin dashboard error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// NOTIFICACIONES ENDPOINTS
// =====================================================

reportesRoutes.get("/usuarios/:id/notificaciones", async (c) => {
  try {
    const usuarioId = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("notificaciones")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Get notifications error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Get notifications error:", error);
    return c.json({ error: error.message }, 500);
  }
});

reportesRoutes.post("/notificaciones/:id/leer", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Mark notification read error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Mark notification read error:", error);
    return c.json({ error: error.message }, 500);
  }
});

reportesRoutes.post("/usuarios/:id/notificaciones/leer-todas", async (c) => {
  try {
    const usuarioId = c.req.param("id");
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("usuario_id", usuarioId)
      .eq("leida", false);

    if (error) {
      console.error("Mark all notifications read error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Mark all notifications read error:", error);
    return c.json({ error: error.message }, 500);
  }
});
