import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  BriefcaseMedical,
  Building2,
  CreditCard,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { toast } from "sonner";
import { supabaseRest } from "../../services/api";

interface PsychologistsListProps {
  isAdmin?: boolean;
}

interface Psychologist {
  id: string;
  usuario_id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  foto_perfil?: string;
  cedula_profesional?: string;
  membresia?: string;
  especialidades: string[];
  tarifa_sesion: number;
  modalidades: string[];
  verificado: boolean;
  activo: boolean;
  estado: string;
  anos_experiencia?: number;
  consultorios: OfficeSummary[];
  suscripcion_activa?: SubscriptionSummary | null;
}

interface OfficeSummary {
  id: string;
  nombre: string;
  domicilio: string;
  es_principal: boolean;
  estado?: string;
}

interface SubscriptionSummary {
  id: string;
  estado: string;
  plan_nombre: string;
  plan_codigo?: string;
  precio_mensual: number;
  limite_citas_mensuales?: number | null;
}

interface PsychologistRow {
  id: string;
  usuario_id: string;
  cedula_profesional?: string | null;
  especialidades?: string[] | null;
  membresia?: string | null;
  tarifa_privada_centavos?: number | null;
  tarifa_red_centavos?: number | null;
  modalidades?: string[] | null;
  verificado_at?: string | null;
  estado: string;
  anos_experiencia?: number | null;
  usuarios?: {
    nombre?: string | null;
    apellido?: string | null;
    email?: string | null;
    telefono?: string | null;
    foto_perfil_url?: string | null;
  } | null;
}

interface PsychologistOfficeRow {
  psicologo_id: string;
  es_principal: boolean;
  consultorios?: {
    id: string;
    nombre?: string | null;
    direccion?: string | null;
    colonia?: string | null;
    municipio?: string | null;
    estado_region?: string | null;
    codigo_postal?: string | null;
    estado?: string | null;
  } | null;
}

interface PsychologistSubscriptionRow {
  id: string;
  psicologo_id: string;
  estado: string;
  planes_suscripcion_psicologo?: {
    codigo?: string | null;
    nombre?: string | null;
    precio_mensual_centavos?: number | null;
    limite_citas_mensuales?: number | null;
  } | null;
}

function mapPsychologist(row: PsychologistRow): Psychologist {
  const user = Array.isArray(row.usuarios) ? row.usuarios[0] : row.usuarios;
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    nombre: user?.nombre || "Sin nombre",
    apellido: user?.apellido || "",
    email: user?.email || "",
    telefono: user?.telefono || "",
    foto_perfil: user?.foto_perfil_url || undefined,
    cedula_profesional: row.cedula_profesional || undefined,
    membresia: row.membresia || undefined,
    especialidades: row.especialidades || [],
    tarifa_sesion: Math.round(((row.tarifa_privada_centavos ?? row.tarifa_red_centavos) || 0) / 100),
    modalidades: row.modalidades || [],
    verificado: Boolean(row.verificado_at),
    activo: row.estado === "activo",
    estado: row.estado,
    anos_experiencia: row.anos_experiencia || 0,
    consultorios: [],
    suscripcion_activa: null,
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildOfficeAddress(office: NonNullable<PsychologistOfficeRow["consultorios"]>) {
  return [
    office.direccion,
    office.colonia,
    office.municipio,
    office.estado_region,
    office.codigo_postal ? `CP ${office.codigo_postal}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function getStatusClass(status: string, active: boolean) {
  if (active) return "bg-[#81C784] text-white";
  if (status === "pendiente") return "bg-[#FFB74D] text-white";
  return "bg-muted text-muted-foreground";
}

function DetailMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PsychologistsList({ isAdmin = true }: PsychologistsListProps) {
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [selectedPsychologist, setSelectedPsychologist] = useState<Psychologist | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar psicólogos desde la base de datos
  useEffect(() => {
    fetchPsychologists();
  }, []);

  const fetchPsychologists = async () => {
    try {
      setLoading(true);
      const data = await supabaseRest<PsychologistRow[]>(
        "/psicologos?select=id,usuario_id,cedula_profesional,especialidades,membresia,tarifa_privada_centavos,tarifa_red_centavos,modalidades,verificado_at,estado,anos_experiencia,usuarios!psicologos_usuario_id_fkey(nombre,apellido,email,telefono,foto_perfil_url)&order=created_at.desc"
      );
      const mappedPsychologists = data.map(mapPsychologist);
      const psychologistIds = mappedPsychologists.map((psychologist) => psychologist.id);

      if (psychologistIds.length === 0) {
        setPsychologists([]);
        return;
      }

      const idFilter = psychologistIds.join(",");
      const [officeRows, subscriptionRows] = await Promise.all([
        supabaseRest<PsychologistOfficeRow[]>(
          `/psicologo_consultorios?psicologo_id=in.(${idFilter})&select=psicologo_id,es_principal,consultorios(id,nombre,direccion,colonia,municipio,estado_region,codigo_postal,estado)&order=es_principal.desc`
        ).catch((error) => {
          console.warn("No se pudieron cargar consultorios de psicólogos:", error);
          return [];
        }),
        supabaseRest<PsychologistSubscriptionRow[]>(
          `/suscripciones_psicologo?psicologo_id=in.(${idFilter})&estado=eq.activa&select=id,psicologo_id,estado,planes_suscripcion_psicologo(codigo,nombre,precio_mensual_centavos,limite_citas_mensuales)&order=created_at.desc`
        ).catch((error) => {
          console.warn("No se pudieron cargar suscripciones de psicólogos:", error);
          return [];
        }),
      ]);

      const officesByPsychologist = officeRows.reduce<Map<string, OfficeSummary[]>>((map, row) => {
        const office = Array.isArray(row.consultorios) ? row.consultorios[0] : row.consultorios;
        if (!office?.id) return map;

        const existing = map.get(row.psicologo_id) || [];
        existing.push({
          id: office.id,
          nombre: office.nombre || "Consultorio sin nombre",
          domicilio: buildOfficeAddress(office) || "Domicilio pendiente",
          es_principal: row.es_principal,
          estado: office.estado || undefined,
        });
        map.set(row.psicologo_id, existing);
        return map;
      }, new Map());

      const subscriptionByPsychologist = subscriptionRows.reduce<Map<string, SubscriptionSummary>>((map, row) => {
        if (map.has(row.psicologo_id)) return map;
        const plan = Array.isArray(row.planes_suscripcion_psicologo)
          ? row.planes_suscripcion_psicologo[0]
          : row.planes_suscripcion_psicologo;

        map.set(row.psicologo_id, {
          id: row.id,
          estado: row.estado,
          plan_nombre: plan?.nombre || "Plan sin nombre",
          plan_codigo: plan?.codigo || undefined,
          precio_mensual: Math.round((plan?.precio_mensual_centavos || 0) / 100),
          limite_citas_mensuales: plan?.limite_citas_mensuales,
        });
        return map;
      }, new Map());

      setPsychologists(
        mappedPsychologists.map((psychologist) => ({
          ...psychologist,
          consultorios: officesByPsychologist.get(psychologist.id) || [],
          suscripcion_activa: subscriptionByPsychologist.get(psychologist.id) || null,
        }))
      );
    } catch (error: any) {
      console.error("Error fetching psychologists:", error);
      toast.error("Error al cargar la lista de psicólogos");
      setPsychologists([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPsychologists = psychologists.length;
  const activePsychologists = psychologists.filter((p) => p.activo).length;
  const verifiedPsychologists = psychologists.filter((p) => p.verificado).length;
  const activeSubscriptions = psychologists.filter((p) => p.suscripcion_activa).length;

  if (selectedPsychologist) {
    const principalOffice =
      selectedPsychologist.consultorios.find((office) => office.es_principal) ||
      selectedPsychologist.consultorios[0];

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Button
            variant="ghost"
            className="w-fit gap-2 text-muted-foreground"
            onClick={() => setSelectedPsychologist(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a psicólogos
          </Button>
          <Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 text-primary">
            Vista administrador de solo lectura
          </Badge>
        </div>

        <Card className="overflow-hidden border-border">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-background p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-4 border-background">
                    <AvatarImage src={selectedPsychologist.foto_perfil} />
                    <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                      {selectedPsychologist.nombre[0]}{selectedPsychologist.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-semibold text-foreground">
                        {selectedPsychologist.nombre} {selectedPsychologist.apellido}
                      </h1>
                      <Badge className={getStatusClass(selectedPsychologist.estado, selectedPsychologist.activo)}>
                        {selectedPsychologist.estado}
                      </Badge>
                      {selectedPsychologist.verificado && (
                        <Badge className="bg-blue-500 text-white">
                          Verificado
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedPsychologist.email || "Email pendiente"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedPsychologist.telefono || "Teléfono pendiente"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <DetailMetric
            label="Consultorios"
            value={selectedPsychologist.consultorios.length}
            icon={Building2}
          />
          <DetailMetric
            label="Suscripción"
            value={selectedPsychologist.suscripcion_activa ? "Activa" : "Sin plan"}
            icon={CreditCard}
          />
          <DetailMetric
            label="Tarifa privada"
            value={formatMoney(selectedPsychologist.tarifa_sesion)}
            icon={BriefcaseMedical}
          />
          <DetailMetric
            label="Experiencia"
            value={`${selectedPsychologist.anos_experiencia || 0} años`}
            icon={ShieldCheck}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="border-border xl:col-span-2">
            <CardHeader>
              <CardTitle>Datos generales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Cédula profesional</p>
                <p className="mt-1 font-medium text-foreground">
                  {selectedPsychologist.cedula_profesional || "Pendiente por el psicólogo"}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Membresía</p>
                <p className="mt-1 font-medium text-foreground">
                  {selectedPsychologist.membresia || "Sin membresía registrada"}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4 md:col-span-2">
                <p className="text-sm text-muted-foreground">Especialidades</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPsychologist.especialidades.length > 0 ? (
                    selectedPsychologist.especialidades.map((specialty) => (
                      <Badge key={specialty} variant="outline">
                        {specialty}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Pendientes por el psicólogo</span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl bg-muted/30 p-4 md:col-span-2">
                <p className="text-sm text-muted-foreground">Modalidades configuradas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPsychologist.modalidades.length > 0 ? (
                    selectedPsychologist.modalidades.map((modality) => (
                      <Badge key={modality} variant="secondary">
                        {modality}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Pendientes por el psicólogo</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Suscripción activa</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPsychologist.suscripcion_activa ? (
                <div className="space-y-4 rounded-3xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {selectedPsychologist.suscripcion_activa.plan_nombre}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPsychologist.suscripcion_activa.estado}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-background p-3">
                      <p className="text-xs text-muted-foreground">Mensualidad</p>
                      <p className="font-semibold text-foreground">
                        {formatMoney(selectedPsychologist.suscripcion_activa.precio_mensual)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-background p-3">
                      <p className="text-xs text-muted-foreground">Límite</p>
                      <p className="font-semibold text-foreground">
                        {selectedPsychologist.suscripcion_activa.limite_citas_mensuales
                          ? `${selectedPsychologist.suscripcion_activa.limite_citas_mensuales} citas`
                          : "Ilimitado"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Este psicólogo todavía no tiene una suscripción activa registrada.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Consultorios y domicilios</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPsychologist.consultorios.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {selectedPsychologist.consultorios.map((office) => (
                  <div
                    key={office.id}
                    className={`rounded-3xl border p-5 ${
                      principalOffice?.id === office.id
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{office.nombre}</h3>
                          {office.es_principal && (
                            <Badge className="bg-primary text-primary-foreground">Principal</Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{office.domicilio}</p>
                      </div>
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Este psicólogo aún no ha configurado sus consultorios.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Psicólogos</h1>
          <p className="text-muted-foreground">
            Consulta de profesionales registrados. Cada psicólogo administra su propia información.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 bg-primary/5 px-4 py-2 text-primary">
          Administrador solo lectura
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total</p>
            <p className="text-3xl text-foreground">{totalPsychologists}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Activos</p>
            <p className="text-3xl text-[#81C784]">{activePsychologists}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Verificados</p>
            <p className="text-3xl text-primary">{verifiedPsychologists}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Suscripción activa</p>
            <p className="text-3xl text-primary">{activeSubscriptions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Lista de Psicólogos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Cargando psicólogos...</span>
            </div>
          ) : psychologists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No hay psicólogos registrados aún
              </p>
              <p className="text-sm text-muted-foreground">
                Cuando un psicólogo cree su cuenta, aparecerá automáticamente en esta vista.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Psicólogo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Consultorios</TableHead>
                  <TableHead>Suscripción</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {psychologists.map((psychologist) => (
                  <TableRow key={psychologist.id} className="hover:bg-accent/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={psychologist.foto_perfil} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {psychologist.nombre[0]}{psychologist.apellido[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-foreground font-medium">
                            {psychologist.nombre} {psychologist.apellido}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {psychologist.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {psychologist.telefono || "N/A"}
                    </TableCell>
                    <TableCell className="min-w-[260px]">
                      {psychologist.consultorios.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">
                              {psychologist.consultorios.find((office) => office.es_principal)?.nombre ||
                                psychologist.consultorios[0].nombre}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {psychologist.consultorios.length} consultorio(s) registrado(s)
                          </p>
                          {psychologist.consultorios.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{psychologist.consultorios.length - 2} consultorio(s) más
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin consultorios registrados</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[190px]">
                      {psychologist.suscripcion_activa ? (
                        <div className="space-y-1">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                            {psychologist.suscripcion_activa.plan_nombre}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {formatMoney(psychologist.suscripcion_activa.precio_mensual)} / mes
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin suscripción activa</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {psychologist.cedula_profesional || "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <Badge
                          className={getStatusClass(psychologist.estado, psychologist.activo)}
                        >
                          {psychologist.estado}
                        </Badge>
                        {psychologist.verificado && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            Verificado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setSelectedPsychologist(psychologist)}
                          >
                            <Eye className="h-4 w-4" />
                            Ver más
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
