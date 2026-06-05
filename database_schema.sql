-- =====================================================
-- MINDCARE - ESQUEMA DE BASE DE DATOS
-- Red de Psicólogos Profesional
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para mapas y ubicaciones

-- =====================================================
-- TABLA: usuarios
-- Usuarios del sistema (4 roles)
-- =====================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'psicologo', 'empresa', 'empleado')),
  foto_perfil TEXT,
  activo BOOLEAN DEFAULT true,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  ultima_sesion TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: psicologos
-- Perfil profesional de psicólogos
-- =====================================================
CREATE TABLE psicologos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  cedula_profesional TEXT UNIQUE NOT NULL,
  especialidades TEXT[] NOT NULL,
  biografia TEXT,
  anos_experiencia INTEGER,
  tipo_membresia TEXT CHECK (tipo_membresia IN ('red_afiliado', 'independiente_free', 'independiente_basico', 'independiente_pro')),
  plan_precio DECIMAL(10,2) DEFAULT 0,
  limite_citas_mes INTEGER,
  citas_usadas_mes INTEGER DEFAULT 0,
  modalidades TEXT[] DEFAULT ARRAY['presencial', 'virtual'],
  tarifa_sesion DECIMAL(10,2),
  duracion_sesion INTEGER DEFAULT 60, -- minutos
  acepta_nuevos_pacientes BOOLEAN DEFAULT true,
  calificacion_promedio DECIMAL(3,2) DEFAULT 0,
  total_resenas INTEGER DEFAULT 0,
  total_citas_completadas INTEGER DEFAULT 0,
  verificado BOOLEAN DEFAULT false,
  fecha_aprobacion TIMESTAMPTZ,
  aprobado_por UUID REFERENCES usuarios(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_psicologos_usuario ON psicologos(usuario_id);
CREATE INDEX idx_psicologos_especialidades ON psicologos USING GIN(especialidades);
CREATE INDEX idx_psicologos_modalidades ON psicologos USING GIN(modalidades);

-- =====================================================
-- TABLA: consultorios
-- Ubicaciones físicas en Guadalajara ZMG
-- =====================================================
CREATE TABLE consultorios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  colonia TEXT,
  municipio TEXT NOT NULL,
  codigo_postal TEXT,
  ubicacion GEOGRAPHY(POINT, 4326), -- PostGIS para coordenadas
  telefono TEXT,
  horario_apertura TIME,
  horario_cierre TIME,
  descripcion TEXT,
  amenidades TEXT[],
  fotos TEXT[],
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultorios_ubicacion ON consultorios USING GIST(ubicacion);

-- =====================================================
-- TABLA: psicologo_consultorios
-- Relación psicólogos con sus consultorios
-- =====================================================
CREATE TABLE psicologo_consultorios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  psicologo_id UUID REFERENCES psicologos(id) ON DELETE CASCADE,
  consultorio_id UUID REFERENCES consultorios(id) ON DELETE CASCADE,
  dias_atencion TEXT[], -- ['lunes', 'martes', 'miercoles']
  es_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(psicologo_id, consultorio_id)
);

CREATE INDEX idx_psicologo_consultorios_psicologo ON psicologo_consultorios(psicologo_id);
CREATE INDEX idx_psicologo_consultorios_consultorio ON psicologo_consultorios(consultorio_id);

-- =====================================================
-- TABLA: empresas
-- Empresas afiliadas a la red
-- =====================================================
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  razon_social TEXT NOT NULL,
  rfc TEXT UNIQUE NOT NULL,
  industria TEXT,
  tamano_empresa TEXT CHECK (tamano_empresa IN ('pequena', 'mediana', 'grande')),
  numero_empleados INTEGER,
  direccion TEXT,
  telefono_corporativo TEXT,
  contacto_rrhh_nombre TEXT,
  contacto_rrhh_email TEXT,
  contacto_rrhh_telefono TEXT,
  fecha_afiliacion TIMESTAMPTZ DEFAULT NOW(),
  sesiones_contratadas INTEGER,
  sesiones_usadas INTEGER DEFAULT 0,
  sesiones_disponibles INTEGER GENERATED ALWAYS AS (sesiones_contratadas - sesiones_usadas) STORED,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_empresas_usuario ON empresas(usuario_id);

-- =====================================================
-- TABLA: empleados
-- Empleados vinculados a empresas
-- =====================================================
CREATE TABLE empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  numero_empleado TEXT,
  departamento TEXT,
  puesto TEXT,
  fecha_ingreso DATE,
  sesiones_usadas INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, numero_empleado)
);

CREATE INDEX idx_empleados_usuario ON empleados(usuario_id);
CREATE INDEX idx_empleados_empresa ON empleados(empresa_id);

-- =====================================================
-- TABLA: disponibilidad_horarios
-- Configuración de horarios de psicólogos
-- =====================================================
CREATE TABLE disponibilidad_horarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  psicologo_id UUID REFERENCES psicologos(id) ON DELETE CASCADE,
  dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  modalidad TEXT CHECK (modalidad IN ('presencial', 'virtual', 'ambas')),
  consultorio_id UUID REFERENCES consultorios(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disponibilidad_psicologo ON disponibilidad_horarios(psicologo_id);
CREATE INDEX idx_disponibilidad_dia ON disponibilidad_horarios(dia_semana);

-- =====================================================
-- TABLA: citas
-- Citas entre pacientes y psicólogos
-- =====================================================
CREATE TABLE citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  psicologo_id UUID REFERENCES psicologos(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id), -- NULL si es paciente privado
  tipo_paciente TEXT CHECK (tipo_paciente IN ('red_mindcare', 'privado')),
  fecha_hora TIMESTAMPTZ NOT NULL,
  duracion INTEGER DEFAULT 60, -- minutos
  modalidad TEXT CHECK (modalidad IN ('presencial', 'virtual')),
  consultorio_id UUID REFERENCES consultorios(id), -- NULL si es virtual
  link_videollamada TEXT, -- Para sesiones virtuales
  estado TEXT CHECK (estado IN ('agendada', 'confirmada', 'completada', 'cancelada', 'no_asistio')) DEFAULT 'agendada',
  motivo_consulta TEXT,
  notas_psicologo TEXT,
  costo DECIMAL(10,2),
  pagada BOOLEAN DEFAULT false,
  metodo_pago TEXT,
  fecha_cancelacion TIMESTAMPTZ,
  motivo_cancelacion TEXT,
  recordatorio_enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_citas_psicologo ON citas(psicologo_id);
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_citas_empresa ON citas(empresa_id);
CREATE INDEX idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX idx_citas_estado ON citas(estado);

-- =====================================================
-- TABLA: resenas
-- Reseñas y calificaciones de psicólogos
-- =====================================================
CREATE TABLE resenas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  psicologo_id UUID REFERENCES psicologos(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  cita_id UUID REFERENCES citas(id) ON DELETE CASCADE,
  calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  anonimo BOOLEAN DEFAULT false,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cita_id) -- Una reseña por cita
);

CREATE INDEX idx_resenas_psicologo ON resenas(psicologo_id);
CREATE INDEX idx_resenas_calificacion ON resenas(calificacion);

-- =====================================================
-- TABLA: cortes_pago
-- Cortes semanales para psicólogos afiliados
-- =====================================================
CREATE TABLE cortes_pago (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  psicologo_id UUID REFERENCES psicologos(id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  total_citas INTEGER DEFAULT 0,
  total_monto DECIMAL(10,2) DEFAULT 0,
  comision_plataforma DECIMAL(10,2) DEFAULT 0,
  monto_neto DECIMAL(10,2) DEFAULT 0,
  estado TEXT CHECK (estado IN ('pendiente', 'procesado', 'pagado')) DEFAULT 'pendiente',
  fecha_pago TIMESTAMPTZ,
  metodo_pago TEXT,
  referencia_pago TEXT,
  citas_incluidas UUID[], -- Array de IDs de citas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cortes_psicologo ON cortes_pago(psicologo_id);
CREATE INDEX idx_cortes_periodo ON cortes_pago(periodo_inicio, periodo_fin);
CREATE INDEX idx_cortes_estado ON cortes_pago(estado);

-- =====================================================
-- TABLA: reportes_empresariales
-- Reportes de impacto y métricas para empresas
-- =====================================================
CREATE TABLE reportes_empresariales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  total_empleados_activos INTEGER,
  total_sesiones_usadas INTEGER,
  tasa_utilizacion DECIMAL(5,2), -- Porcentaje
  empleados_participantes INTEGER,
  tasa_participacion DECIMAL(5,2), -- Porcentaje
  satisfaccion_promedio DECIMAL(3,2),
  total_invertido DECIMAL(10,2),
  deduccion_fiscal_estimada DECIMAL(10,2),
  ahorro_estimado_rotacion DECIMAL(10,2),
  ahorro_estimado_ausentismo DECIMAL(10,2),
  metricas_bienestar JSONB, -- Datos agregados de bienestar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reportes_empresa ON reportes_empresariales(empresa_id);
CREATE INDEX idx_reportes_periodo ON reportes_empresariales(periodo_inicio, periodo_fin);

-- =====================================================
-- TABLA: planes_suscripcion
-- Planes para psicólogos independientes (MindCare Control)
-- =====================================================
CREATE TABLE planes_suscripcion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_mensual DECIMAL(10,2) NOT NULL,
  limite_citas INTEGER, -- NULL = ilimitado
  caracteristicas JSONB,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar planes por defecto
INSERT INTO planes_suscripcion (nombre, descripcion, precio_mensual, limite_citas, caracteristicas) VALUES
('Free', 'Hasta 3 citas mensuales', 0, 3, '{"acceso_calendario": true, "acceso_expedientes": true, "soporte": "comunidad"}'::jsonb),
('Básico', 'Hasta 15 citas mensuales', 200, 15, '{"acceso_calendario": true, "acceso_expedientes": true, "soporte": "email", "reportes_basicos": true}'::jsonb),
('Pro', 'Citas ilimitadas', 500, NULL, '{"acceso_calendario": true, "acceso_expedientes": true, "soporte": "prioritario", "reportes_avanzados": true, "integracion_api": true}'::jsonb);

-- =====================================================
-- TABLA: suscripciones
-- Suscripciones activas de psicólogos
-- =====================================================
CREATE TABLE suscripciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  psicologo_id UUID REFERENCES psicologos(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES planes_suscripcion(id),
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  estado TEXT CHECK (estado IN ('activa', 'cancelada', 'suspendida', 'vencida')) DEFAULT 'activa',
  renovacion_automatica BOOLEAN DEFAULT true,
  metodo_pago TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suscripciones_psicologo ON suscripciones(psicologo_id);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado);

-- =====================================================
-- TABLA: notificaciones
-- Sistema de notificaciones
-- =====================================================
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'cita_agendada', 'cita_cancelada', 'recordatorio', 'mensaje', etc.
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  accion_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);

-- =====================================================
-- TABLA: configuracion_sistema
-- Configuraciones globales
-- =====================================================
CREATE TABLE configuracion_sistema (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuraciones iniciales
INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
('comision_red_mindcare', '0.15'::jsonb, 'Comisión de la plataforma para citas de red (15%)'),
('duracion_sesion_default', '60'::jsonb, 'Duración default de sesión en minutos'),
('dias_recordatorio', '1'::jsonb, 'Días de anticipación para recordatorios'),
('horario_atencion_inicio', '"09:00"'::jsonb, 'Horario de atención inicio'),
('horario_atencion_fin', '"20:00"'::jsonb, 'Horario de atención fin');

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_psicologos_updated_at BEFORE UPDATE ON psicologos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultorios_updated_at BEFORE UPDATE ON consultorios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disponibilidad_updated_at BEFORE UPDATE ON disponibilidad_horarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_citas_updated_at BEFORE UPDATE ON citas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resenas_updated_at BEFORE UPDATE ON resenas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cortes_updated_at BEFORE UPDATE ON cortes_pago FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reportes_updated_at BEFORE UPDATE ON reportes_empresariales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planes_updated_at BEFORE UPDATE ON planes_suscripcion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suscripciones_updated_at BEFORE UPDATE ON suscripciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON configuracion_sistema FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar calificación promedio de psicólogos
CREATE OR REPLACE FUNCTION actualizar_calificacion_psicologo()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE psicologos
  SET
    calificacion_promedio = (
      SELECT COALESCE(AVG(calificacion), 0)
      FROM resenas
      WHERE psicologo_id = NEW.psicologo_id AND visible = true
    ),
    total_resenas = (
      SELECT COUNT(*)
      FROM resenas
      WHERE psicologo_id = NEW.psicologo_id AND visible = true
    )
  WHERE id = NEW.psicologo_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_calificacion
AFTER INSERT OR UPDATE ON resenas
FOR EACH ROW EXECUTE FUNCTION actualizar_calificacion_psicologo();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en tablas sensibles
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE psicologos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortes_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_empresariales ENABLE ROW LEVEL SECURITY;

-- Nota: Las políticas específicas se configurarán según el sistema de autenticación

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de psicólogos con información completa
CREATE VIEW vista_psicologos_completa AS
SELECT
  p.*,
  u.email,
  u.nombre,
  u.apellido,
  u.telefono,
  u.foto_perfil,
  ARRAY_AGG(DISTINCT c.nombre) FILTER (WHERE c.id IS NOT NULL) as nombres_consultorios,
  ARRAY_AGG(DISTINCT c.municipio) FILTER (WHERE c.id IS NOT NULL) as municipios_atencion
FROM psicologos p
JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN psicologo_consultorios pc ON p.id = pc.psicologo_id
LEFT JOIN consultorios c ON pc.consultorio_id = c.id
GROUP BY p.id, u.email, u.nombre, u.apellido, u.telefono, u.foto_perfil;

-- Vista de citas con información completa
CREATE VIEW vista_citas_completa AS
SELECT
  c.*,
  up.nombre as psicologo_nombre,
  up.apellido as psicologo_apellido,
  upa.nombre as paciente_nombre,
  upa.apellido as paciente_apellido,
  upa.email as paciente_email,
  emp.razon_social as empresa_nombre,
  con.nombre as consultorio_nombre,
  con.direccion as consultorio_direccion
FROM citas c
JOIN psicologos p ON c.psicologo_id = p.id
JOIN usuarios up ON p.usuario_id = up.id
JOIN usuarios upa ON c.paciente_id = upa.id
LEFT JOIN empresas emp ON c.empresa_id = emp.id
LEFT JOIN consultorios con ON c.consultorio_id = con.id;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- =====================================================

/*
-- Ejemplo de usuario administrador
INSERT INTO usuarios (email, nombre, apellido, rol) VALUES
('admin@mindcare.com', 'Admin', 'Principal', 'admin');

-- Ejemplo de consultorio
INSERT INTO consultorios (nombre, direccion, municipio, ubicacion) VALUES
('Consultorio Centro', 'Av. Hidalgo 123', 'Guadalajara', ST_SetSRID(ST_MakePoint(-103.3494, 20.6737), 4326));
*/

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
