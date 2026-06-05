import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Edit, Trash2, Building2, MapPin, Phone } from "lucide-react";
import { Badge } from "./ui/badge";
import { AddOfficeModal, type OfficeRow } from "./AddOfficeModal";
import { supabaseRest } from "../../services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";

const statusConfig = {
  activo: { label: "Activo", color: "bg-[#81C784] text-white" },
  pendiente: { label: "Pendiente", color: "bg-[#FFB74D] text-white" },
  inactivo: { label: "Inactivo", color: "bg-muted text-muted-foreground" },
  suspendido: { label: "Suspendido", color: "bg-destructive text-destructive-foreground" },
};

function formatAmenity(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function OfficesList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [offices, setOffices] = useState<OfficeRow[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<OfficeRow | null>(null);
  const [deleteOffice, setDeleteOffice] = useState<OfficeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingDelete, setSavingDelete] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadOffices() {
      setLoading(true);
      setError("");

      try {
        const rows = await supabaseRest<OfficeRow[]>(
          "/consultorios?select=id,nombre,direccion,colonia,municipio,estado_region,codigo_postal,telefono,descripcion,amenidades,estado,created_at&order=created_at.desc"
        );

        if (active) setOffices(rows);
      } catch (loadError: any) {
        if (!active) return;
        console.error("Offices load error:", loadError);
        setError(`No se pudieron cargar los consultorios desde la base de datos. ${loadError?.message || ""}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOffices();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const stats = useMemo(
    () => ({
      total: offices.length,
      active: offices.filter((office) => office.estado === "activo").length,
      inactive: offices.filter((office) => office.estado !== "activo").length,
    }),
    [offices]
  );

  const handleCreate = () => {
    setSelectedOffice(null);
    setIsModalOpen(true);
  };

  const handleEdit = (office: OfficeRow) => {
    setSelectedOffice(office);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteOffice) return;
    setSavingDelete(true);

    try {
      await supabaseRest(`/consultorios?id=eq.${deleteOffice.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ estado: "inactivo" }),
      });

      toast.success("Consultorio desactivado");
      setReloadKey((key) => key + 1);
      setDeleteOffice(null);
    } catch (deleteError) {
      console.error("Delete office error:", deleteError);
      toast.error("No se pudo desactivar el consultorio.");
    } finally {
      setSavingDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Consultorios</h1>
          <p className="text-muted-foreground">Gestión de consultorios desde la base de datos</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          onClick={handleCreate}
        >
          <Plus className="w-4 h-4" />
          Nuevo Consultorio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total</p>
            <p className="text-3xl text-foreground">{loading ? "..." : stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Activos</p>
            <p className="text-3xl text-[#81C784]">{loading ? "..." : stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Inactivos / Suspendidos</p>
            <p className="text-3xl text-[#FFB74D]">{loading ? "..." : stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            Cargando consultorios...
          </CardContent>
        </Card>
      ) : offices.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            No hay consultorios registrados.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offices.map((office) => {
            const status = statusConfig[office.estado] || statusConfig.inactivo;

            return (
              <Card key={office.id} className="border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{office.nombre}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate">
                          {office.municipio}, {office.estado_region}
                        </p>
                      </div>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      {office.direccion}
                      {office.colonia ? `, ${office.colonia}` : ""}
                      {office.codigo_postal ? `, CP ${office.codigo_postal}` : ""}
                    </span>
                  </div>

                  {office.telefono && (
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{office.telefono}</span>
                    </div>
                  )}

                  {office.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{office.descripcion}</p>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Amenidades:</p>
                    <div className="flex flex-wrap gap-1">
                      {office.amenidades.length > 0 ? (
                        office.amenidades.map((item) => (
                          <Badge key={item} variant="secondary" className="text-xs">
                            {formatAmenity(item)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin amenidades registradas</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(office)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteOffice(office)}
                      disabled={office.estado === "inactivo"}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddOfficeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        office={selectedOffice}
        onSaved={() => setReloadKey((key) => key + 1)}
      />

      <AlertDialog open={Boolean(deleteOffice)} onOpenChange={(open) => !open && setDeleteOffice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar consultorio</AlertDialogTitle>
            <AlertDialogDescription>
              El consultorio dejará de aparecer como activo, pero se conservará para historial de citas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={savingDelete}>
              {savingDelete ? "Desactivando..." : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
