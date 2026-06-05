import { useState } from "react";
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
import { resolvePsychologistProfileId, supabaseRest } from "../../services/api";

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  psychologists: Array<{ id: string; name: string }>;
  defaultPsychologist?: string;
  onCreated?: () => void;
}

export function AddPatientModal({
  isOpen,
  onClose,
  psychologists,
  defaultPsychologist,
  onCreated,
}: AddPatientModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    email: "",
    phone: "",
    psychologist: defaultPsychologist || "",
    address: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      age: "",
      email: "",
      phone: "",
      psychologist: defaultPsychologist || "",
      address: "",
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      toast.error("Por favor complete los campos requeridos");
      return;
    }

    setSaving(true);

    try {
      const selectedPsychologist = formData.psychologist || defaultPsychologist;
      const psychologistProfileId = await resolvePsychologistProfileId(selectedPsychologist);

      if (!psychologistProfileId) {
        toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
        return;
      }

      await supabaseRest(
        "/pacientes",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            creado_por_psicologo_id: psychologistProfileId,
            fuente: "privado",
            nombre: formData.firstName.trim(),
            apellido: formData.lastName.trim(),
            email: formData.email.trim() || null,
            telefono: formData.phone.trim(),
            estado: "activo",
            metadata: {
              edad: formData.age ? Number(formData.age) : null,
              direccion: formData.address.trim() || null,
              notas: formData.notes.trim() || null,
            },
          }),
        }
      );

      toast.success("Paciente registrado exitosamente");
      resetForm();
      onCreated?.();
      onClose();
    } catch (error) {
      console.error("Create patient error:", error);
      toast.error("No se pudo registrar el paciente en la base de datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Paciente</DialogTitle>
          <DialogDescription>
            Complete la información del paciente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="Nombre"
                className="bg-input-background"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Apellido <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Apellido"
                className="bg-input-background"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age">Edad</Label>
            <Input
              id="age"
              type="number"
              placeholder="Edad"
              className="bg-input-background"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="bg-input-background"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+52 55 1234 5678"
                className="bg-input-background"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Psychologist */}
          <div className="space-y-2">
            <Label htmlFor="psychologist">Psicólogo Asignado</Label>
            <Select
              value={formData.psychologist}
              onValueChange={(value) =>
                setFormData({ ...formData, psychologist: value })
              }
              disabled={!!defaultPsychologist || saving}
            >
              <SelectTrigger className="bg-input-background">
                <SelectValue placeholder="Seleccionar psicólogo" />
              </SelectTrigger>
              <SelectContent>
                {psychologists.map((psychologist) => (
                  <SelectItem key={psychologist.id} value={psychologist.id}>
                    {psychologist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Dirección completa"
              className="bg-input-background"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Información adicional relevante..."
              className="bg-input-background min-h-[100px]"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
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
              {saving ? "Guardando..." : "Guardar Paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
