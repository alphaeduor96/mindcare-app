import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
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

export function ClinicalRecords({ currentPsychologistId }: ClinicalRecordsProps) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [patientSearch, setPatientSearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
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
    setSelectedPatientId(patientId);
    setSelectedNoteId("");
    setDocumentSearch("");
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

      <div className="grid grid-cols-1 xl:grid-cols-[300px_360px_1fr] gap-5">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Buscar paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder="Nombre o correo"
              />
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Cargando pacientes...</div>
              ) : filteredPatients.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No hay pacientes para mostrar.</div>
              ) : (
                filteredPatients.map((patient) => {
                  const count = notes.filter((note) => note.paciente_id === patient.id).length;
                  const isSelected = patient.id === selectedPatientId;

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      className={`w-full rounded-md border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent"
                      }`}
                      onClick={() => handleSelectPatient(patient.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">{patientName(patient)}</p>
                          <p className="truncate text-xs text-muted-foreground">{patient.email || "Sin correo"}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {count}
                        </Badge>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <div className="space-y-3">
              <div>
                <CardTitle className="text-base">Histórico</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedPatient ? patientName(selectedPatient) : "Selecciona un paciente"}
                </p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={documentSearch}
                  onChange={(event) => setDocumentSearch(event.target.value)}
                  placeholder="Buscar en histórico"
                  disabled={!selectedPatientId}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
              {!selectedPatientId ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Selecciona un paciente.</div>
              ) : visibleNotes.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Este paciente aún no tiene documentos clínicos.
                </div>
              ) : (
                visibleNotes.map((note) => {
                  const isSelected = selectedNote?.id === note.id;
                  const title = note.titulo || note.citas?.motivo_consulta || "Entrada clínica";

                  return (
                    <button
                      key={note.id}
                      type="button"
                      className={`w-full rounded-md border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent"
                      }`}
                      onClick={() => setSelectedNoteId(note.id)}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="outline" className={typeBadgeClass(note.tipo)}>
                          {typeLabel(note.tipo)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(`${note.fecha_clinica}T00:00:00`).toLocaleDateString("es-MX")}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-foreground">{title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note.contenido}</p>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-primary" />
                  Documento
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Vista ampliada del expediente seleccionado
                </p>
              </div>
              {selectedNote && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadPdf(selectedNote)}>
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadWord(selectedNote)}>
                    <Download className="w-4 h-4" />
                    Word
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedNote ? (
              <div className="flex min-h-[540px] items-center justify-center rounded-md border border-dashed border-border text-center text-sm text-muted-foreground">
                Selecciona un documento del histórico para verlo completo.
              </div>
            ) : (
              <article className="min-h-[620px] rounded-md border border-border bg-white p-6 text-slate-900 shadow-sm">
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

                <div className="mt-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={typeBadgeClass(selectedNote.tipo)}>
                      {typeLabel(selectedNote.tipo)}
                    </Badge>
                    <span className="text-sm text-slate-500">{formatClinicalDate(selectedNote.fecha_clinica)}</span>
                  </div>

                  <h2 className="text-2xl font-semibold">
                    {selectedNote.titulo || selectedNote.citas?.motivo_consulta || "Entrada clínica"}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md bg-slate-50 p-4 text-sm">
                    <div>
                      <p className="text-xs uppercase text-slate-500">Paciente</p>
                      <p className="mt-1">{patientName(selectedNote.pacientes)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-500">Cita</p>
                      <p className="mt-1">{formatAppointment(selectedNote.citas)}</p>
                    </div>
                  </div>

                  <section className="space-y-2">
                    <h3 className="border-b border-slate-200 pb-1 text-sm font-semibold text-[#1D4F4A]">Resumen clínico</h3>
                    <p className="whitespace-pre-wrap text-sm leading-6">{selectedNote.contenido}</p>
                  </section>

                  {selectedNote.observaciones && (
                    <section className="space-y-2">
                      <h3 className="border-b border-slate-200 pb-1 text-sm font-semibold text-[#1D4F4A]">Observaciones</h3>
                      <p className="whitespace-pre-wrap text-sm leading-6">{selectedNote.observaciones}</p>
                    </section>
                  )}

                  {selectedNote.transcripcion_supervision && (
                    <section className="space-y-2">
                      <h3 className="border-b border-slate-200 pb-1 text-sm font-semibold text-[#1D4F4A]">Texto para supervisión</h3>
                      <p className="whitespace-pre-wrap text-sm leading-6">{selectedNote.transcripcion_supervision}</p>
                    </section>
                  )}
                </div>
              </article>
            )}
          </CardContent>
        </Card>
      </div>

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
