import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { Checkbox } from "./ui/checkbox";
import { supabaseRest } from "../../services/api";

export interface OfficeRow {
  id: string;
  nombre: string;
  direccion: string;
  colonia?: string | null;
  municipio: string;
  estado_region: string;
  codigo_postal?: string | null;
  telefono?: string | null;
  descripcion?: string | null;
  amenidades: string[];
  estado: "activo" | "inactivo" | "pendiente" | "suspendido";
  created_at: string;
}

interface AddOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  office?: OfficeRow | null;
  onSaved?: () => void;
}

const emptyForm = {
  nombre: "",
  direccion: "",
  colonia: "",
  municipio: "Guadalajara",
  estado_region: "Jalisco",
  codigo_postal: "",
  telefono: "",
  descripcion: "",
  amenidades: [] as string[],
  estado: "activo" as OfficeRow["estado"],
};

const amenityOptions = [
  { id: "escritorio", label: "Escritorio" },
  { id: "sofa_divan", label: "Sofá/Diván" },
  { id: "sillas", label: "Sillas" },
  { id: "pizarra", label: "Pizarra" },
  { id: "computadora", label: "Computadora" },
  { id: "aire_acondicionado", label: "Aire acondicionado" },
  { id: "wifi", label: "WiFi" },
  { id: "estacionamiento", label: "Estacionamiento" },
];

function officeToForm(office?: OfficeRow | null) {
  if (!office) return emptyForm;

  return {
    nombre: office.nombre || "",
    direccion: office.direccion || "",
    colonia: office.colonia || "",
    municipio: office.municipio || "Guadalajara",
    estado_region: office.estado_region || "Jalisco",
    codigo_postal: office.codigo_postal || "",
    telefono: office.telefono || "",
    descripcion: office.descripcion || "",
    amenidades: office.amenidades || [],
    estado: office.estado || "activo",
  };
}

export function AddOfficeModal({ isOpen, onClose, office, onSaved }: AddOfficeModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(office);

  useEffect(() => {
    if (isOpen) setFormData(officeToForm(office));
  }, [isOpen, office]);

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFormData((current) => ({
      ...current,
      amenidades: checked
        ? [...current.amenidades, amenityId]
        : current.amenidades.filter((id) => id !== amenityId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.direccion.trim() || !formData.municipio.trim()) {
      toast.error("Por favor complete los campos requeridos");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        direccion: formData.direccion.trim(),
        colonia: formData.colonia.trim() || null,
        municipio: formData.municipio.trim(),
        estado_region: formData.estado_region.trim() || "Jalisco",
        codigo_postal: formData.codigo_postal.trim() || null,
        telefono: formData.telefono.trim() || null,
        descripcion: formData.descripcion.trim() || null,
        amenidades: formData.amenidades,
        estado: formData.estado,
      };

      await supabaseRest(
        isEditing ? `/consultorios?id=eq.${office?.id}` : "/consultorios",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        }
      );

      toast.success(isEditing ? "Consultorio actualizado" : "Consultorio registrado");
      onSaved?.();
      onClose();
    } catch (error) {
      console.error("Save office error:", error);
      toast.error("No se pudo guardar el consultorio en la base de datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Consultorio" : "Registrar Nuevo Consultorio"}</DialogTitle>
          <DialogDescription>Complete la información del consultorio</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Consultorio Providencia"
              className="bg-input-background"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={saving}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">
              Dirección <span className="text-destructive">*</span>
            </Label>
            <Input
              id="direccion"
              placeholder="Calle, número interior/exterior"
              className="bg-input-background"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              disabled={saving}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="colonia">Colonia</Label>
              <Input
                id="colonia"
                placeholder="Colonia"
                className="bg-input-background"
                value={formData.colonia}
                onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipio">
                Municipio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="municipio"
                placeholder="Guadalajara"
                className="bg-input-background"
                value={formData.municipio}
                onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_postal">Código Postal</Label>
              <Input
                id="codigo_postal"
                placeholder="44100"
                className="bg-input-background"
                value={formData.codigo_postal}
                onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estado_region">Estado</Label>
              <Input
                id="estado_region"
                placeholder="Jalisco"
                className="bg-input-background"
                value={formData.estado_region}
                onChange={(e) => setFormData({ ...formData, estado_region: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+52 33 0000 0000"
                className="bg-input-background"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amenidades</Label>
            <div className="grid grid-cols-2 gap-3 p-4 border border-border rounded-lg bg-input-background">
              {amenityOptions.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`amenity-${option.id}`}
                    checked={formData.amenidades.includes(option.id)}
                    onCheckedChange={(checked) => handleAmenityChange(option.id, checked as boolean)}
                    disabled={saving}
                  />
                  <Label htmlFor={`amenity-${option.id}`} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value: OfficeRow["estado"]) => setFormData({ ...formData, estado: value })}
              disabled={saving}
            >
              <SelectTrigger className="bg-input-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción / Notas</Label>
            <Textarea
              id="descripcion"
              placeholder="Indicaciones de acceso, referencias o detalles del espacio..."
              className="bg-input-background min-h-[80px]"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar Consultorio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
