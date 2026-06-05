import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Mail, Phone, Edit, Trash2, LogIn, Loader2 } from "lucide-react";
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
import { AddPsychologistModal } from "./AddPsychologistModal";
import { toast } from "sonner";
import { supabaseRest } from "../../services/api";

interface PsychologistsListProps {
  onLoginAsPsychologist?: (psychologist: any) => void;
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
  };
}

export function PsychologistsList({ onLoginAsPsychologist, isAdmin = true }: PsychologistsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
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
      setPsychologists(data.map(mapPsychologist));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Psicólogos</h1>
          <p className="text-muted-foreground">
            Gestión de profesionales registrados
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nuevo Psicólogo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primer Psicólogo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Psicólogo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Especialidades</TableHead>
                  <TableHead className="text-center">Tarifa</TableHead>
                  <TableHead className="text-center">Modalidad</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {psychologist.cedula_profesional || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {psychologist.especialidades?.slice(0, 2).map((esp, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {esp}
                          </Badge>
                        ))}
                        {psychologist.especialidades?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{psychologist.especialidades.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-[#66BB6A] text-white">
                        ${psychologist.tarifa_sesion || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        {psychologist.modalidades?.includes("presencial") && (
                          <Badge variant="secondary" className="text-xs">
                            Presencial
                          </Badge>
                        )}
                        {psychologist.modalidades?.includes("virtual") && (
                          <Badge variant="secondary" className="text-xs">
                            Virtual
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <Badge
                          className={
                            psychologist.activo
                              ? "bg-[#81C784] text-white"
                              : psychologist.estado === "pendiente"
                                ? "bg-[#FFB74D] text-white"
                              : "bg-muted text-muted-foreground"
                          }
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
                        {isAdmin && onLoginAsPsychologist && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary"
                            onClick={() => onLoginAsPsychologist(psychologist)}
                          >
                            <LogIn className="w-4 h-4 mr-1" />
                            Ver como
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
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

      {isAdmin && (
        <AddPsychologistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreated={fetchPsychologists}
        />
      )}
    </div>
  );
}
