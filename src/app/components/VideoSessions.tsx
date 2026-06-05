import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  PlugZap,
  Plus,
  ShieldCheck,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { resolvePsychologistProfileId, supabaseFunction, supabaseRest } from "../../services/api";

interface VideoSessionsProps {
  currentPsychologistId?: string;
}

interface PatientRow {
  id: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
}

interface AppointmentRow {
  id: string;
  paciente_id: string;
  inicia_at: string;
  termina_at: string;
  estado: string;
  motivo_consulta?: string | null;
  pacientes?: PatientRow | null;
}

interface VideoSessionRow {
  id: string;
  psicologo_id: string;
  paciente_id: string;
  cita_id: string;
  sala_token: string;
  codigo_acceso: string;
  duracion_minutos: number;
  inicia_at: string;
  expira_at: string;
  estado: string;
  proveedor: string;
  join_url?: string | null;
  start_url?: string | null;
  provider_meeting_id?: string | null;
  created_at: string;
  pacientes?: PatientRow | null;
  citas?: AppointmentRow | null;
}

interface VideoIntegrationRow {
  proveedor: "zoom" | "google_meet";
  cuenta_email?: string | null;
  estado: string;
  updated_at?: string | null;
}

const emptyForm = {
  paciente_id: "",
  cita_id: "",
  proveedor: "mindcare_webrtc",
  duracion_minutos: "50",
  codigo_acceso: "",
};

function patientName(patient?: PatientRow | null) {
  if (!patient) return "Paciente sin nombre";
  return `${patient.nombre || ""} ${patient.apellido || ""}`.trim() || "Paciente sin nombre";
}

function appointmentLabel(appointment?: AppointmentRow | null) {
  if (!appointment) return "Sin cita";
  const date = new Date(appointment.inicia_at);
  return `${date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} · ${date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  })} · ${appointment.estado}`;
}

function generateAccessCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function videoLink(token: string) {
  return `${window.location.origin}/?video_session=${token}`;
}

function providerLabel(provider: string) {
  if (provider === "zoom") return "Zoom";
  if (provider === "google_meet") return "Google Meet";
  return "MindCare";
}

function statusClass(status: string) {
  if (status === "activa") return "bg-[#66BB6A]/10 text-[#66BB6A] border-[#66BB6A]/20";
  if (status === "finalizada") return "bg-muted text-muted-foreground border-border";
  if (status === "cancelada" || status === "expirada") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-primary/10 text-primary border-primary/20";
}

export function VideoSessions({ currentPsychologistId }: VideoSessionsProps) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [sessions, setSessions] = useState<VideoSessionRow[]>([]);
  const [integrations, setIntegrations] = useState<VideoIntegrationRow[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel("mindcare-video-integrations");
      channel.onmessage = (event) => {
        if (event.data?.status === "success") {
          toast.success("Cuenta de videollamada conectada.");
          setConnectingProvider("");
          setReloadKey((key) => key + 1);
        }
        if (event.data?.status === "error") {
          toast.error(event.data?.message || "No se pudo conectar la cuenta.");
          setConnectingProvider("");
        }
      };
    } catch (error) {
      console.warn("Video integrations channel unavailable:", error);
    }

    return () => channel?.close();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadVideoSessions() {
      setLoading(true);
      setError("");

      try {
        const resolvedProfileId = await resolvePsychologistProfileId(currentPsychologistId);
        if (!resolvedProfileId) {
          setProfileId(null);
          setAppointments([]);
          setSessions([]);
          return;
        }

        setProfileId(resolvedProfileId);

        const since = new Date();
        since.setDate(since.getDate() - 15);
        const until = new Date();
        until.setDate(until.getDate() + 45);

        const [appointmentRows, sessionRows, integrationRows] = await Promise.all([
          supabaseRest<AppointmentRow[]>(
            `/citas?psicologo_id=eq.${resolvedProfileId}&inicia_at=gte.${since.toISOString()}&inicia_at=lt.${until.toISOString()}&estado=in.(solicitada,agendada,confirmada,completada)&select=id,paciente_id,inicia_at,termina_at,estado,motivo_consulta,pacientes(id,nombre,apellido,email,telefono)&order=inicia_at.asc`
          ),
          supabaseRest<VideoSessionRow[]>(
            `/videollamada_sesiones?psicologo_id=eq.${resolvedProfileId}&select=id,psicologo_id,paciente_id,cita_id,sala_token,codigo_acceso,duracion_minutos,inicia_at,expira_at,estado,proveedor,join_url,start_url,provider_meeting_id,created_at,pacientes(id,nombre,apellido,email,telefono),citas(id,paciente_id,inicia_at,termina_at,estado,motivo_consulta)&order=inicia_at.desc`
          ),
          supabaseRest<VideoIntegrationRow[]>(
            `/video_integraciones?psicologo_id=eq.${resolvedProfileId}&select=proveedor,cuenta_email,estado,updated_at&order=proveedor.asc`
          ),
        ]);

        if (!active) return;
        setAppointments(appointmentRows);
        setSessions(sessionRows);
        setIntegrations(integrationRows);
      } catch (loadError) {
        if (!active) return;
        console.error("Video sessions load error:", loadError);
        setError("No se pudieron cargar las videollamadas desde la base de datos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVideoSessions();

    return () => {
      active = false;
    };
  }, [currentPsychologistId, reloadKey]);

  const patients = useMemo(() => {
    const byId = new Map<string, PatientRow>();
    appointments.forEach((appointment) => {
      if (appointment.pacientes) byId.set(appointment.pacientes.id, appointment.pacientes);
    });
    return Array.from(byId.values()).sort((a, b) => patientName(a).localeCompare(patientName(b)));
  }, [appointments]);

  const selectedPatientAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.paciente_id === formData.paciente_id),
    [appointments, formData.paciente_id]
  );

  const openCreateDialog = () => {
    const firstPatientId = patients[0]?.id || "";
    setFormData({
      ...emptyForm,
      paciente_id: firstPatientId,
      cita_id: "",
      codigo_acceso: generateAccessCode(),
    });
    setDialogOpen(true);
  };

  const isProviderConnected = (provider: string) => {
    if (provider === "mindcare_webrtc") return true;
    return integrations.some((integration) => integration.proveedor === provider && integration.estado === "activa");
  };

  const connectProvider = async (provider: "zoom" | "google_meet") => {
    if (!profileId) {
      toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
      return;
    }

    setConnectingProvider(provider);

    try {
      const result = await supabaseFunction<{ url: string }>("video-oauth-start", {
        method: "POST",
        body: JSON.stringify({
          proveedor: provider,
          psicologo_id: profileId,
          app_url: window.location.origin,
        }),
      });

      const popup = window.open(
        result.url,
        `mindcare-video-${provider}`,
        "popup=yes,width=620,height=760,menubar=no,toolbar=no,location=no,status=no"
      );

      if (!popup) {
        setConnectingProvider("");
        toast.error("El navegador bloqueó la ventana de conexión.");
      }
    } catch (connectError: any) {
      console.error("Video provider connect error:", connectError);
      setConnectingProvider("");
      toast.error(`No se pudo iniciar la conexión. ${connectError?.message || ""}`);
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("No se pudo copiar al portapapeles.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!profileId || !formData.paciente_id || !formData.cita_id) {
      toast.error("Selecciona paciente y cita.");
      return;
    }

    if (!isProviderConnected(formData.proveedor)) {
      toast.error(`Conecta tu cuenta de ${providerLabel(formData.proveedor)} antes de generar esta videollamada.`);
      return;
    }

    const selectedAppointment = appointments.find((appointment) => appointment.id === formData.cita_id);
    if (!selectedAppointment) {
      toast.error("No se encontró la cita seleccionada.");
      return;
    }

    setSaving(true);

    try {
      await supabaseFunction("create-video-session", {
        method: "POST",
        body: JSON.stringify({
          proveedor: formData.proveedor,
          psicologo_id: profileId,
          paciente_id: formData.paciente_id,
          cita_id: formData.cita_id,
          codigo_acceso: formData.codigo_acceso || generateAccessCode(),
          duracion_minutos: Number(formData.duracion_minutos || 50),
          app_url: window.location.origin,
        }),
      });

      toast.success(`Videollamada ${providerLabel(formData.proveedor)} generada.`);
      setDialogOpen(false);
      setReloadKey((key) => key + 1);
    } catch (saveError: any) {
      console.error("Video session save error:", saveError);
      toast.error(`No se pudo generar la videollamada. ${saveError?.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-foreground mb-2">Videollamadas</h1>
          <p className="text-muted-foreground">
            Genera sesiones virtuales privadas con link, contraseña y duración definida.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreateDialog} disabled={loading || patients.length === 0}>
          <Plus className="w-4 h-4" />
          Generar videollamada
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Sesiones creadas</p>
            <p className="text-3xl text-foreground">{loading ? "..." : sessions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Programadas</p>
            <p className="text-3xl text-primary">
              {loading ? "..." : sessions.filter((session) => session.estado === "programada").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Pacientes con cita</p>
            <p className="text-3xl text-[#4DB6AC]">{loading ? "..." : patients.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-2">Cuentas externas</p>
            <p className="text-3xl text-foreground">{loading ? "..." : integrations.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PlugZap className="w-5 h-5 text-primary" />
            Integraciones de videollamada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { provider: "mindcare_webrtc", title: "MindCare propio", description: "Sala interna con link y contraseña." },
              { provider: "zoom", title: "Zoom", description: "Crea reuniones en la cuenta Zoom conectada." },
              { provider: "google_meet", title: "Google Meet", description: "Crea eventos con enlace Meet desde Google Calendar." },
            ].map((item) => {
              const integration = integrations.find((row) => row.proveedor === item.provider);
              const connected = item.provider === "mindcare_webrtc" || integration?.estado === "activa";

              return (
                <Card key={item.provider} className="border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant="outline" className={connected ? "bg-[#66BB6A]/10 text-[#66BB6A] border-[#66BB6A]/20" : ""}>
                        {connected ? "Conectado" : "Sin conectar"}
                      </Badge>
                    </div>
                    <p className="min-h-4 text-xs text-muted-foreground">
                      {integration?.cuenta_email || (item.provider === "mindcare_webrtc" ? "Disponible por defecto" : "Conecta una cuenta para crear links.")}
                    </p>
                    {item.provider !== "mindcare_webrtc" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={connectingProvider === item.provider}
                        onClick={() => connectProvider(item.provider as "zoom" | "google_meet")}
                      >
                        {connectingProvider === item.provider ? "Conectando..." : connected ? "Reconectar" : "Conectar"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="w-5 h-5 text-primary" />
            Sesiones virtuales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Cargando videollamadas...</div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aún no hay videollamadas generadas.
            </div>
          ) : (
            sessions.map((session) => {
              const link = session.join_url || videoLink(session.sala_token);
              return (
                <Card key={session.id} className="border-border bg-muted/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={statusClass(session.estado)}>
                            {session.estado}
                          </Badge>
                          <Badge variant="outline">
                            {providerLabel(session.proveedor)}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <CalendarDays className="w-4 h-4" />
                            {appointmentLabel(session.citas)}
                          </span>
                        </div>
                        <h3 className="text-foreground">{patientName(session.pacientes)}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>{session.duracion_minutos} minutos</span>
                          <span>Expira: {new Date(session.expira_at).toLocaleString("es-MX")}</span>
                          <span className="inline-flex items-center gap-1">
                            <KeyRound className="w-4 h-4" />
                            {session.codigo_acceso}
                          </span>
                        </div>
                        <div className="flex max-w-3xl items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                          <Link2 className="w-4 h-4 shrink-0 text-muted-foreground" />
                          <span className="truncate text-muted-foreground">{link}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => copyText(link, "Link")}>
                          <Copy className="w-4 h-4" />
                          Copiar link
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => copyText(session.codigo_acceso, "Contraseña")}>
                          <KeyRound className="w-4 h-4" />
                          Copiar contraseña
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(link, "_blank")}>
                          <ExternalLink className="w-4 h-4" />
                          Abrir sala
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-foreground">Base lista para sala propia</p>
              <p className="text-xs text-muted-foreground">
                El flujo ya genera link privado y contraseña. El siguiente paso técnico será crear tokens de video en backend y conectar la sala WebRTC dentro de este mismo panel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Generar videollamada</DialogTitle>
            <DialogDescription>
              Selecciona paciente, cita y duración de la sesión virtual.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select
                value={formData.proveedor}
                onValueChange={(value) => setFormData((current) => ({ ...current, proveedor: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mindcare_webrtc">MindCare propio</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="google_meet">Google Meet</SelectItem>
                </SelectContent>
              </Select>
              {!isProviderConnected(formData.proveedor) && (
                <p className="text-xs text-destructive">
                  Conecta tu cuenta de {providerLabel(formData.proveedor)} antes de crear esta videollamada.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select
                value={formData.paciente_id}
                onValueChange={(value) => setFormData((current) => ({ ...current, paciente_id: value, cita_id: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patientName(patient)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cita</Label>
              <Select
                value={formData.cita_id}
                onValueChange={(value) => setFormData((current) => ({ ...current, cita_id: value }))}
                disabled={!formData.paciente_id || selectedPatientAppointments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.paciente_id ? "Selecciona cita" : "Primero selecciona paciente"} />
                </SelectTrigger>
                <SelectContent>
                  {selectedPatientAppointments.map((appointment) => (
                    <SelectItem key={appointment.id} value={appointment.id}>
                      {appointmentLabel(appointment)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duración en minutos</Label>
                <Input
                  type="number"
                  min="5"
                  max="240"
                  value={formData.duracion_minutos}
                  onChange={(event) => setFormData((current) => ({ ...current, duracion_minutos: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.codigo_acceso}
                    onChange={(event) => setFormData((current) => ({ ...current, codigo_acceso: event.target.value.toUpperCase() }))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData((current) => ({ ...current, codigo_acceso: generateAccessCode() }))}
                  >
                    Generar
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2" disabled={saving}>
                <Video className="w-4 h-4" />
                {saving ? "Generando..." : "Crear sesión"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
