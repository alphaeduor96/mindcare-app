import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Mail, Phone, Edit, Eye, FileText, Building2, Briefcase } from "lucide-react";
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
import { AddPatientModal } from "./AddPatientModal";
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

interface PatientsListProps {
  currentPsychologistId?: string;
  psychologists: Array<{ id: string; name: string }>;
}

 interface PatientRow {
  id: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  fuente: "privado" | "red_mindcare";
  estado: "activo" | "inactivo" | "pendiente" | "suspendido";
  created_at: string;
  empleados?: {
    numero_empleado?: string | null;
  } | null;
}

interface PatientItem {
  id: string;
  name: string;
  age: string;
  email: string;
  phone: string;
  psychologist: string;
  lastVisit?: string;
  totalSessions: number;
  status: "active" | "inactive";
  avatar: string;
  source: "private" | "network";
  company?: string;
  employeeId?: string;
  createdAt: string;
}

interface PatientAppointmentRow {
  paciente_id: string;
  inicia_at: string;
  estado: string;
}

function calculateAge(date?: string | null) {
  if (!date) return "Sin edad";
  const birthDate = new Date(date);
  if (Number.isNaN(birthDate.getTime())) return "Sin edad";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return `${age} años`;
}

function fullName(patient: PatientRow) {
  return `${patient.nombre || ""} ${patient.apellido || ""}`.trim() || "Paciente sin nombre";
}

function mapPatient(
  patient: PatientRow,
  psychologistName: string,
  appointments: PatientAppointmentRow[]
): PatientItem {
  const patientAppointments = appointments.filter((appointment) => appointment.paciente_id === patient.id);
  const sortedAppointments = [...patientAppointments].sort(
    (a, b) => new Date(b.inicia_at).getTime() - new Date(a.inicia_at).getTime()
  );
  const lastVisit = sortedAppointments.find((appointment) => new Date(appointment.inicia_at) <= new Date())?.inicia_at;

  return {
    id: patient.id,
    name: fullName(patient),
    age: calculateAge(patient.fecha_nacimiento),
    email: patient.email || "Sin email",
    phone: patient.telefono || "Sin teléfono",
    psychologist: psychologistName,
    lastVisit,
    totalSessions: patientAppointments.filter((appointment) => appointment.estado === "completada").length,
    status: patient.estado === "activo" ? "active" : "inactive",
    avatar: "",
    source: patient.fuente === "red_mindcare" ? "network" : "private",
    employeeId: patient.empleados?.numero_empleado || undefined,
    createdAt: patient.created_at,
  };
}

export function PatientsList({ currentPsychologistId, psychologists }: PatientsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const psychologistName =
    psychologists.find((psychologist) => psychologist.id === currentPsychologistId)?.name || "Psicólogo";

  useEffect(() => {
    let active = true;

    async function loadPatients() {
      setLoading(true);
      setError("");

      try {
        const profileId = await resolvePsychologistProfileId(currentPsychologistId);

        if (!profileId) {
          setPatients([]);
          return;
        }

        const appointments = await supabaseRest<PatientAppointmentRow[]>(
          `/citas?psicologo_id=eq.${profileId}&select=paciente_id,inicia_at,estado&order=inicia_at.desc`
        );
        const patientIds = Array.from(new Set(appointments.map((appointment) => appointment.paciente_id)));
        const orFilters = [`creado_por_psicologo_id.eq.${profileId}`];
        if (patientIds.length > 0) {
          orFilters.push(`id.in.(${patientIds.join(",")})`);
        }

        const rows = await supabaseRest<PatientRow[]>(
          `/pacientes?or=(${orFilters.join(",")})&select=id,nombre,apellido,email,telefono,fecha_nacimiento,fuente,estado,created_at,empleados(numero_empleado)&order=created_at.desc`
        );

        if (!active) return;
        setPatients(rows.map((patient) => mapPatient(patient, psychologistName, appointments)));
      } catch (loadError) {
        if (!active) return;
        console.error("Patients load error:", loadError);
        setError("No se pudieron cargar los pacientes desde la base de datos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPatients();

    return () => {
      active = false;
    };
  }, [currentPsychologistId, psychologistName, reloadKey]);

  const filteredPatients = patients;
  const monthlyNewPatients = useMemo(() => {
    const now = new Date();
    return filteredPatients.filter((patient) => {
      const createdAt = new Date(patient.createdAt);
      return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
    }).length;
  }, [filteredPatients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestión de pacientes registrados
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total</p>
            <p className="text-3xl text-foreground">{loading ? "..." : filteredPatients.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Activos</p>
            <p className="text-3xl text-[#81C784]">
              {loading ? "..." : filteredPatients.filter((patient) => patient.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Nuevos (mes)</p>
            <p className="text-3xl text-primary">{loading ? "..." : monthlyNewPatients}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Sesiones</p>
            <p className="text-3xl text-[#4DD0E1]">
              {loading
                ? "..."
                : filteredPatients.reduce((total, patient) => total + patient.totalSessions, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Psicólogo Asignado</TableHead>
                <TableHead className="text-center">Última Visita</TableHead>
                <TableHead className="text-center">Sesiones</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Cargando pacientes...
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay pacientes registrados para este psicólogo.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={patient.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-foreground">{patient.name}</p>
                          {patient.source === "network" && (
                            <Badge className="bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/20 text-xs">
                              <Building2 className="w-3 h-3 mr-1" />
                              Red
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {patient.age}
                          {patient.source === "network" && patient.company && (
                            <span className="ml-2">• {patient.company}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {patient.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {patient.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.psychologist}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {patient.lastVisit
                      ? new Date(patient.lastVisit).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Sin visitas"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{patient.totalSessions}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        patient.status === "active"
                          ? "bg-[#81C784] text-white"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {patient.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Ver historial">
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Ver detalles">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Editar">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        psychologists={psychologists}
        defaultPsychologist={currentPsychologistId}
        onCreated={() => setReloadKey((key) => key + 1)}
      />
    </div>
  );
}
