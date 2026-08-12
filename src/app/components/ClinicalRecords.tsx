import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Plus,
  Save,
  Search,
  UserRound,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

interface ClinicalRecordsProps {
  currentPsychologistId?: string;
}

interface PatientRow {
  id: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  creado_por_psicologo_id?: string | null;
}

interface AppointmentRow {
  id: string;
  paciente_id: string;
  inicia_at: string;
  estado: string;
  motivo_consulta?: string | null;
}

interface NoteRow {
  id: string;
  cita_id: string;
  paciente_id: string;
  titulo?: string | null;
  tipo: "nota_sesion" | "observacion" | "supervision";
  fecha_clinica: string;
  contenido: string;
  observaciones?: string | null;
  transcripcion_supervision?: string | null;
  created_at: string;
  pacientes?: PatientRow | null;
  citas?: AppointmentRow | null;
}

const emptyForm = {
  paciente_id: "",
  cita_id: "",
  tipo: "nota_sesion",
  fecha_clinica: new Date().toISOString().slice(0, 10),
  titulo: "",
  contenido: "",
  observaciones: "",
  transcripcion_supervision: "",
};

function patientName(patient?: PatientRow | null) {
  if (!patient) return "Paciente sin nombre";
  return `${patient.nombre || ""} ${patient.apellido || ""}`.trim() || "Paciente sin nombre";
}

function formatClinicalDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatAppointment(appointment?: AppointmentRow | null) {
  if (!appointment) return "Sin cita vinculada";
  const date = new Date(appointment.inicia_at);
  const formattedDate = date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formattedDate} · ${formattedTime} · ${appointment.estado}`;
}

function typeLabel(type: NoteRow["tipo"] | string) {
  if (type === "supervision") return "Supervisión";
  if (type === "observacion") return "Observación";
  return "Nota de sesión";
}

function typeBadgeClass(type: NoteRow["tipo"] | string) {
  if (type === "supervision") return "bg-[#7E57C2]/10 text-[#7E57C2] border-[#7E57C2]/20";
  if (type === "observacion") return "bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/20";
  return "bg-primary/10 text-primary border-primary/20";
}

function escapeHtml(value?: string | null) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

function fileSafeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function letterheadHtml(note: NoteRow) {
  const patient = patientName(note.pacientes);
  const title = note.titulo || note.citas?.motivo_consulta || "Entrada clínica";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 22mm 18mm; }
    body { color: #202124; font-family: Arial, sans-serif; line-height: 1.55; }
    .header { border-bottom: 3px solid #26A69A; display: flex; justify-content: space-between; padding-bottom: 14px; }
    .brand { color: #1D4F4A; font-size: 24px; font-weight: 700; }
    .subtitle { color: #5f6368; font-size: 12px; margin-top: 3px; }
    .meta { color: #5f6368; font-size: 12px; text-align: right; }
    h1 { font-size: 22px; margin: 28px 0 8px; }
    .badge { border: 1px solid #26A69A; color: #1D4F4A; display: inline-block; font-size: 12px; padding: 3px 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin: 20px 0; }
    .label { color: #5f6368; font-size: 11px; text-transform: uppercase; }
    .value { font-size: 14px; margin-top: 2px; }
    .section { margin-top: 22px; }
    .section h2 { border-bottom: 1px solid #d9e2e0; color: #1D4F4A; font-size: 14px; padding-bottom: 5px; }
    .text { font-size: 14px; white-space: normal; }
    .footer { border-top: 1px solid #d9e2e0; color: #7a7f84; font-size: 11px; margin-top: 42px; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">MindCare</div>
      <div class="subtitle">Expediente clínico confidencial</div>
    </div>
    <div class="meta">
      Fecha de emisión<br>${new Date().toLocaleDateString("es-MX")}
    </div>
  </div>

  <h1>${escapeHtml(title)}</h1>
  <span class="badge">${escapeHtml(typeLabel(note.tipo))}</span>

  <div class="grid">
    <div><div class="label">Paciente</div><div class="value">${escapeHtml(patient)}</div></div>
    <div><div class="label">Fecha clínica</div><div class="value">${escapeHtml(formatClinicalDate(note.fecha_clinica))}</div></div>
    <div><div class="label">Cita</div><div class="value">${escapeHtml(formatAppointment(note.citas))}</div></div>
    <div><div class="label">Documento</div><div class="value">${escapeHtml(note.id)}</div></div>
  </div>

  <div class="section">
    <h2>Resumen clínico</h2>
    <div class="text">${escapeHtml(note.contenido)}</div>
  </div>

  ${note.observaciones ? `<div class="section"><h2>Observaciones</h2><div class="text">${escapeHtml(note.observaciones)}</div></div>` : ""}
  ${note.transcripcion_supervision ? `<div class="section"><h2>Texto para supervisión</h2><div class="text">${escapeHtml(note.transcripcion_supervision)}</div></div>` : ""}

  <div class="footer">
    Documento generado desde MindCare. Información confidencial de uso clínico profesional.
  </div>
</body>
</html>`;
}

function downloadBlob(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function textPreview(value?: string | null, maxLength = 180) {
  const normalized = (value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Sin contenido capturado.";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function ParagraphText({ value }: { value?: string | null }) {
  const paragraphs = (value || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return <p className="text-sm text-slate-500">Sin contenido.</p>;
  }

  return (
    <div className="space-y-4 text-[15px] leading-7 text-slate-800">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

interface ReadableSectionProps {
  id: string;
  title: string;
  value?: string | null;
  expanded: boolean;
  onToggle: (id: string) => void;
}

function ReadableSection({ id, title, value, expanded, onToggle }: ReadableSectionProps) {
  return (
    <section id={id} className="rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left"
        onClick={() => onToggle(id)}
      >
        <div>
          <h3 className="text-sm font-semibold text-[#1D4F4A]">{title}</h3>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
        )}
      </button>

      {expanded ? (
        <div className="px-4 py-4">
          <ParagraphText value={value} />
        </div>
      ) : (
        <button
          type="button"
          className="block w-full px-4 py-4 text-left text-sm leading-6 text-slate-600 hover:bg-slate-50"
          onClick={() => onToggle(id)}
        >
          {textPreview(value)}
        </button>
      )}
    </section>
  );
}

export function ClinicalRecords({ currentPsychologistId }: ClinicalRecordsProps) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [documentSearch, setDocumentSearch] = useState("");
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contenido: true,
    observaciones: false,
    supervision: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      setLoading(true);
      setError("");

      try {
        const resolvedProfileId = await resolvePsychologistProfileId(currentPsychologistId);
        if (!resolvedProfileId) {
          setProfileId(null);
          setPatients([]);
          setAppointments([]);
          setNotes([]);
          return;
        }

        setProfileId(resolvedProfileId);

        const appointmentRows = await supabaseRest<AppointmentRow[]>(
          `/citas?psicologo_id=eq.${resolvedProfileId}&select=id,paciente_id,inicia_at,estado,motivo_consulta&order=inicia_at.desc`
        );

        const patientIds = Array.from(new Set(appointmentRows.map((appointment) => appointment.paciente_id)));
        const patientFilters = [`creado_por_psicologo_id.eq.${resolvedProfileId}`];
        if (patientIds.length > 0) patientFilters.push(`id.in.(${patientIds.join(",")})`);

        const [patientRows, noteRows] = await Promise.all([
          supabaseRest<PatientRow[]>(
            `/pacientes?or=(${patientFilters.join(",")})&select=id,nombre,apellido,email,creado_por_psicologo_id&order=nombre.asc`
          ),
          supabaseRest<NoteRow[]>(
            `/notas_sesion?psicologo_id=eq.${resolvedProfileId}&select=id,cita_id,paciente_id,titulo,tipo,fecha_clinica,contenido,observaciones,transcripcion_supervision,created_at,pacientes(id,nombre,apellido,email),citas(id,paciente_id,inicia_at,estado,motivo_consulta)&order=fecha_clinica.desc,created_at.desc`
          ),
        ]);

        if (!active) return;
        setPatients(patientRows);
        setAppointments(appointmentRows);
        setNotes(noteRows);

        if (!selectedPatientId && patientRows[0]?.id) {
          setSelectedPatientId(patientRows[0].id);
        }
      } catch (loadError) {
        if (!active) return;
        console.error("Clinical records load error:", loadError);
        setError("No se pudieron cargar los expedientes desde la base de datos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecords();

    return () => {
      active = false;
    };
  }, [currentPsychologistId, reloadKey]);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) || null;

  const selectedPatientAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.paciente_id === formData.paciente_id),
    [appointments, formData.paciente_id]
  );

  const filteredPatients = useMemo(() => {
    const normalized = patientSearch.trim().toLowerCase();
    if (!normalized) return patients;
    return patients.filter((patient) =>
      [patientName(patient), patient.email].join(" ").toLowerCase().includes(normalized)
    );
  }, [patientSearch, patients]);

  const patientNotes = useMemo(
    () => notes.filter((note) => note.paciente_id === selectedPatientId),
    [notes, selectedPatientId]
  );

  const visibleNotes = useMemo(() => {
    const normalized = documentSearch.trim().toLowerCase();
    if (!normalized) return patientNotes;

    return patientNotes.filter((note) =>
      [
        note.titulo,
        note.contenido,
        note.observaciones,
        note.transcripcion_supervision,
        note.citas?.motivo_consulta,
        typeLabel(note.tipo),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [documentSearch, patientNotes]);

  const selectedNote = notes.find((note) => note.id === selectedNoteId)
    || visibleNotes[0]
    || patientNotes[0]
    || null;
  const lastNote = patientNotes[0] || null;
  const selectedNoteTitle = selectedNote?.titulo || selectedNote?.citas?.motivo_consulta || "Entrada clínica";

  useEffect(() => {
    if (!selectedPatientId && patients[0]?.id) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  useEffect(() => {
    if (selectedNote && selectedNote.id !== selectedNoteId) {
      setSelectedNoteId(selectedNote.id);
    }

    if (!selectedNote && selectedNoteId) {
      setSelectedNoteId("");
    }
  }, [selectedNote, selectedNoteId]);

  const handleSelectPatient = (patientId: string) => {
    const patient = patients.find((item) => item.id === patientId);
    setSelectedPatientId(patientId);
    setPatientSearch(patient ? patientName(patient) : "");
    setPatientPickerOpen(false);
    setSelectedNoteId("");
    setDocumentSearch("");
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  const openNewEntry = () => {
    const patientId = selectedPatientId || patients[0]?.id || "";
    setFormData({
      ...emptyForm,
      paciente_id: patientId,
      fecha_clinica: new Date().toISOString().slice(0, 10),
    });
    setEntryDialogOpen(true);
  };

  const handlePatientChange = (patientId: string) => {
    setFormData((current) => ({
      ...current,
      paciente_id: patientId,
      cita_id: "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!profileId) {
      toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
      return;
    }

    if (!formData.paciente_id || !formData.cita_id || !formData.contenido.trim()) {
      toast.error("Selecciona paciente, cita y escribe el resumen clínico.");
      return;
    }

    setSaving(true);

    try {
      await supabaseRest("/notas_sesion?on_conflict=cita_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          cita_id: formData.cita_id,
          psicologo_id: profileId,
          paciente_id: formData.paciente_id,
          tipo: formData.tipo,
          fecha_clinica: formData.fecha_clinica,
          titulo: formData.titulo.trim() || null,
          contenido: formData.contenido.trim(),
          observaciones: formData.observaciones.trim() || null,
          transcripcion_supervision: formData.transcripcion_supervision.trim() || null,
        }),
      });

      toast.success("Entrada de expediente guardada.");
      setSelectedPatientId(formData.paciente_id);
      setEntryDialogOpen(false);
      setFormData({
        ...emptyForm,
        paciente_id: formData.paciente_id,
        fecha_clinica: new Date().toISOString().slice(0, 10),
      });
      setReloadKey((key) => key + 1);
    } catch (saveError: any) {
      console.error("Clinical record save error:", saveError);
      toast.error(`No se pudo guardar el expediente. ${saveError?.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  const downloadWord = (note: NoteRow) => {
    const patient = patientName(note.pacientes);
    const title = note.titulo || note.citas?.motivo_consulta || "expediente";
    downloadBlob(
      letterheadHtml(note),
      `${fileSafeName(patient)}-${fileSafeName(title)}.doc`,
      "application/msword;charset=utf-8"
    );
  };

  const downloadPdf = (note: NoteRow) => {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      toast.error("El navegador bloqueó la ventana de impresión.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(letterheadHtml(note));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-foreground mb-2">Expedientes</h1>
          <p className="text-muted-foreground">
            Busca un paciente, revisa su histórico clínico y exporta documentos membretados.
          </p>
        </div>
        <Button className="gap-2" onClick={openNewEntry} disabled={loading || patients.length === 0}>
          <Plus className="w-4 h-4" />
          Nueva entrada
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="border-border">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="relative">
              <Label>Paciente</Label>
              <div className="relative mt-2">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-12 rounded-2xl bg-input-background pl-11"
                  value={patientSearch}
                  onFocus={() => setPatientPickerOpen(true)}
                  onBlur={() => window.setTimeout(() => setPatientPickerOpen(false), 120)}
                  onChange={(event) => {
                    setPatientSearch(event.target.value);
                    setPatientPickerOpen(true);
                  }}
                  placeholder={
                    loading
                      ? "Cargando pacientes..."
                      : selectedPatient
                        ? patientName(selectedPatient)
                        : "Busca y selecciona un paciente"
                  }
                  disabled={loading}
                />
                {patientPickerOpen && !loading && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-80 overflow-y-auto rounded-2xl border border-border bg-popover p-2 shadow-xl">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent ${
                            patient.id === selectedPatientId ? "bg-primary/10" : ""
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectPatient(patient.id)}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-foreground">{patientName(patient)}</p>
                            <p className="truncate text-xs text-muted-foreground">{patient.email || "Sin correo registrado"}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-muted-foreground">
                        No encontramos pacientes con esa búsqueda.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-5">
          {selectedPatient ? (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl text-foreground">{patientName(selectedPatient)}</h2>
                  <p className="text-sm text-muted-foreground">{selectedPatient.email || "Sin correo registrado"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Documentos</p>
                  <p className="text-lg text-foreground">{patientNotes.length}</p>
                </div>
                <div className="rounded-md border border-border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Citas</p>
                  <p className="text-lg text-foreground">
                    {appointments.filter((appointment) => appointment.paciente_id === selectedPatient.id).length}
                  </p>
                </div>
                <div className="rounded-md border border-border px-3 py-2 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Última entrada</p>
                  <p className="truncate text-sm text-foreground">
                    {lastNote ? formatClinicalDate(lastNote.fecha_clinica) : "Sin entradas"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Selecciona un paciente para revisar su expediente.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Documentos del expediente</CardTitle>
              <p className="text-sm text-muted-foreground">
                Abre cualquier documento para leerlo completo y descargarlo.
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={documentSearch}
                onChange={(event) => setDocumentSearch(event.target.value)}
                placeholder="Buscar documento"
                disabled={!selectedPatientId}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedPatientId ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Selecciona un paciente.</div>
          ) : visibleNotes.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Este paciente aún no tiene documentos clínicos.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {visibleNotes.map((note) => {
                const title = note.titulo || note.citas?.motivo_consulta || "Entrada clínica";
                return (
                  <button
                    key={note.id}
                    type="button"
                    className="grid w-full gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/60 md:grid-cols-[160px_1fr_auto] md:items-center"
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setDocumentDialogOpen(true);
                    }}
                  >
                    <div>
                      <p className="text-sm text-foreground">{formatClinicalDate(note.fecha_clinica)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatAppointment(note.citas)}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={typeBadgeClass(note.tipo)}>
                          {typeLabel(note.tipo)}
                        </Badge>
                      </div>
                      <p className="text-base text-foreground">{title}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {textPreview(note.contenido, 240)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 md:justify-end">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-primary">Abrir</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedNoteTitle}</DialogTitle>
            <DialogDescription>
              {selectedNote
                ? `${patientName(selectedNote.pacientes)} · ${formatClinicalDate(selectedNote.fecha_clinica)}`
                : "Documento clínico"}
            </DialogDescription>
          </DialogHeader>

          {selectedNote && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={typeBadgeClass(selectedNote.tipo)}>
                    {typeLabel(selectedNote.tipo)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadPdf(selectedNote)}>
                    <Download className="w-4 h-4" />
                    Descargar PDF
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadWord(selectedNote)}>
                    <Download className="w-4 h-4" />
                    Descargar Word
                  </Button>
                </div>
              </div>

              <article className="rounded-md border border-border bg-slate-50 p-4 text-slate-900 shadow-sm">
                <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-6 border-b-4 border-[#26A69A] pb-4">
                    <div>
                      <p className="text-2xl font-semibold text-[#1D4F4A]">MindCare</p>
                      <p className="text-xs text-slate-500">Expediente clínico confidencial</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      Fecha de emisión<br />
                      {new Date().toLocaleDateString("es-MX")}
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <h2 className="text-2xl font-semibold">{selectedNoteTitle}</h2>

                    <div className="grid grid-cols-1 gap-4 rounded-md bg-slate-50 p-4 text-sm md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase text-slate-500">Paciente</p>
                        <p className="mt-1">{patientName(selectedNote.pacientes)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-500">Cita</p>
                        <p className="mt-1">{formatAppointment(selectedNote.citas)}</p>
                      </div>
                    </div>

                    <section>
                      <h3 className="mb-3 text-sm font-semibold text-[#1D4F4A]">Resumen clínico</h3>
                      <ParagraphText value={selectedNote.contenido} />
                    </section>

                    {selectedNote.observaciones && (
                      <section>
                        <h3 className="mb-3 text-sm font-semibold text-[#1D4F4A]">Observaciones</h3>
                        <ParagraphText value={selectedNote.observaciones} />
                      </section>
                    )}

                    {selectedNote.transcripcion_supervision && (
                      <section>
                        <h3 className="mb-3 text-sm font-semibold text-[#1D4F4A]">Texto para supervisión</h3>
                        <ParagraphText value={selectedNote.transcripcion_supervision} />
                      </section>
                    )}
                  </div>
                </div>
              </article>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva entrada de expediente</DialogTitle>
            <DialogDescription>
              Selecciona el paciente y la cita para guardar la entrada clínica.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={formData.paciente_id} onValueChange={handlePatientChange} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Cargando pacientes..." : "Selecciona un paciente"} />
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
                  <SelectValue
                    placeholder={
                      formData.paciente_id
                        ? "Selecciona una cita"
                        : "Primero selecciona paciente"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {selectedPatientAppointments.map((appointment) => (
                    <SelectItem key={appointment.id} value={appointment.id}>
                      {formatAppointment(appointment)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.paciente_id && selectedPatientAppointments.length === 0 && (
                <p className="text-xs text-muted-foreground">Este paciente todavía no tiene citas registradas.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData((current) => ({ ...current, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nota_sesion">Nota de sesión</SelectItem>
                    <SelectItem value="observacion">Observación</SelectItem>
                    <SelectItem value="supervision">Supervisión</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha clínica</Label>
                <Input
                  type="date"
                  value={formData.fecha_clinica}
                  onChange={(event) => setFormData((current) => ({ ...current, fecha_clinica: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.titulo}
                onChange={(event) => setFormData((current) => ({ ...current, titulo: event.target.value }))}
                placeholder="Ej. Seguimiento de ansiedad"
              />
            </div>

            <div className="space-y-2">
              <Label>Resumen clínico</Label>
              <Textarea
                className="min-h-28"
                value={formData.contenido}
                onChange={(event) => setFormData((current) => ({ ...current, contenido: event.target.value }))}
                placeholder="Motivo trabajado, intervención, evolución, acuerdos o tareas."
              />
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                className="min-h-24"
                value={formData.observaciones}
                onChange={(event) => setFormData((current) => ({ ...current, observaciones: event.target.value }))}
                placeholder="Datos relevantes para el seguimiento clínico."
              />
            </div>

            <div className="space-y-2">
              <Label>Texto para supervisión</Label>
              <Textarea
                className="min-h-32"
                value={formData.transcripcion_supervision}
                onChange={(event) => setFormData((current) => ({ ...current, transcripcion_supervision: event.target.value }))}
                placeholder="Transcripción, fragmento de sesión o material anonimizado para supervisar."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEntryDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2" disabled={saving || loading}>
                <Save className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar entrada"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
