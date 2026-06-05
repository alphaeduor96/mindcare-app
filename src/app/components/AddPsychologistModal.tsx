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
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";
import { supabaseFunction } from "../../services/api";

interface AddPsychologistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function AddPsychologistModal({
  isOpen,
  onClose,
  onCreated,
}: AddPsychologistModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    approach: "",
    subspecialties: [] as string[],
    email: "",
    phone: "",
    license: "",
    experience: "",
    schedule: "full-time",
    hourlyRate: "",
    bio: "",
    address: {
      street: "",
      number: "",
      colony: "",
      city: "Guadalajara",
      state: "Jalisco",
      zipCode: "",
    },
  });

  // Enfoques principales de psicología
  const approaches = [
    { value: "psychoanalysis", label: "Psicoanálisis" },
    { value: "cognitive", label: "Cognitivo-Conductual" },
    { value: "gestalt", label: "Gestalt" },
    { value: "systemic", label: "Sistémico" },
  ];

  // Subespecialidades
  const subspecialties = [
    { value: "anxiety", label: "Ansiedad y Estrés" },
    { value: "depression", label: "Depresión" },
    { value: "mood-disorders", label: "Trastornos del Estado de Ánimo" },
    { value: "trauma", label: "Trauma y TEPT" },
    { value: "couple-therapy", label: "Terapia de Pareja" },
    { value: "family-therapy", label: "Terapia Familiar" },
    { value: "child-adolescent", label: "Psicología Infantil y Adolescentes" },
    { value: "addictions", label: "Adicciones" },
    { value: "eating-disorders", label: "Trastornos Alimentarios" },
    { value: "grief", label: "Duelo y Pérdida" },
    { value: "self-esteem", label: "Autoestima y Desarrollo Personal" },
    { value: "personality-disorders", label: "Trastornos de Personalidad" },
    { value: "ocd", label: "TOC (Trastorno Obsesivo Compulsivo)" },
    { value: "phobias", label: "Fobias" },
    { value: "burnout", label: "Estrés Laboral y Burnout" },
    { value: "vocational", label: "Orientación Vocacional" },
    { value: "sleep-disorders", label: "Problemas de Sueño" },
    { value: "sexuality", label: "Sexualidad" },
    { value: "violence", label: "Violencia y Abuso" },
    { value: "neuropsychology", label: "Neuropsicología" },
  ];

  const toggleSubspecialty = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      subspecialties: prev.subspecialties.includes(value)
        ? prev.subspecialties.filter((s) => s !== value)
        : [...prev.subspecialties, value],
    }));
  };

  const removeSubspecialty = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      subspecialties: prev.subspecialties.filter((s) => s !== value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.birthDate ||
      !formData.email ||
      !formData.phone ||
      !formData.approach ||
      formData.subspecialties.length === 0
    ) {
      toast.error("Por favor complete los campos requeridos (incluyendo al menos una subespecialidad)");
      return;
    }

    if (!formData.license) {
      toast.error("La cédula profesional es requerida");
      return;
    }

    try {
      setSaving(true);
      const modalidades = [];
      if (formData.schedule === "full-time" || formData.schedule === "part-time") {
        modalidades.push("presencial", "virtual");
      } else {
        modalidades.push("presencial");
      }

      const result = await supabaseFunction<{
        user: { email: string };
        password: string;
      }>("admin-create-psychologist", {
        method: "POST",
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          license: formData.license,
          approach: formData.approach,
          subspecialties: formData.subspecialties,
          bio: formData.bio,
          experience: formData.experience,
          hourlyRate: formData.hourlyRate,
          modalidades,
          membresia: "red_afiliado",
        }),
      });

      toast.success(
        <div className="space-y-2">
          <p className="font-semibold">Psicólogo registrado exitosamente</p>
          <div className="text-sm mt-2 p-2 bg-background rounded border">
            <p className="font-medium">Credenciales de acceso:</p>
            <p><strong>Email:</strong> {result.user.email}</p>
            <p><strong>Contraseña:</strong> {result.password}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Comparte estas credenciales con el psicólogo
          </p>
        </div>,
        { duration: 10000 } // Mostrar por 10 segundos
      );

      const credentials = `Email: ${result.user.email}\nContraseña: ${result.password}`;
      try {
        await navigator.clipboard.writeText(credentials);
        toast.info("Credenciales copiadas al portapapeles", { duration: 3000 });
      } catch (clipboardError) {
        console.log("Clipboard access denied, credentials shown in toast instead");
      }

      setFormData({
        fullName: "",
        birthDate: "",
        approach: "",
        subspecialties: [],
        email: "",
        phone: "",
        license: "",
        experience: "",
        schedule: "full-time",
        hourlyRate: "",
        bio: "",
        address: {
          street: "",
          number: "",
          colony: "",
          city: "Guadalajara",
          state: "Jalisco",
          zipCode: "",
        },
      });

      onCreated?.();
      onClose();
    } catch (error: any) {
      console.error("Error creating psychologist:", error);
      toast.error(error.message || "Error al registrar psicólogo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Psicólogo</DialogTitle>
          <DialogDescription>
            Complete la información del profesional
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre Completo y Fecha de Nacimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Nombre Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Nombre y apellidos completos"
                className="bg-input-background"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">
                Fecha de Nacimiento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="birthDate"
                type="date"
                className="bg-input-background"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Enfoque Principal */}
          <div className="space-y-2">
            <Label htmlFor="approach">
              Enfoque Terapéutico Principal <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.approach}
              onValueChange={(value) =>
                setFormData({ ...formData, approach: value })
              }
            >
              <SelectTrigger className="bg-input-background">
                <SelectValue placeholder="Seleccionar enfoque" />
              </SelectTrigger>
              <SelectContent>
                {approaches.map((approach) => (
                  <SelectItem key={approach.value} value={approach.value}>
                    {approach.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subespecialidades */}
          <div className="space-y-3">
            <Label>
              Subespecialidades <span className="text-destructive">*</span>
              <span className="text-sm text-muted-foreground ml-2">
                (Selecciona al menos una)
              </span>
            </Label>
            
            {/* Selected subspecialties badges */}
            {formData.subspecialties.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-accent/30 rounded-lg">
                {formData.subspecialties.map((value) => {
                  const subspecialty = subspecialties.find((s) => s.value === value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="pl-3 pr-2 py-1 gap-1"
                    >
                      {subspecialty?.label}
                      <button
                        type="button"
                        onClick={() => removeSubspecialty(value)}
                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Subspecialties grid */}
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-3 bg-input-background rounded-lg border border-border">
              {subspecialties.map((subspecialty) => (
                <div key={subspecialty.value} className="flex items-start gap-2">
                  <Checkbox
                    id={subspecialty.value}
                    checked={formData.subspecialties.includes(subspecialty.value)}
                    onCheckedChange={() => toggleSubspecialty(subspecialty.value)}
                  />
                  <label
                    htmlFor={subspecialty.value}
                    className="text-sm cursor-pointer leading-tight"
                  >
                    {subspecialty.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="bg-input-background"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
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

          {/* License & Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license">
                Cédula Profesional <span className="text-destructive">*</span>
              </Label>
              <Input
                id="license"
                placeholder="Número de cédula"
                className="bg-input-background"
                value={formData.license}
                onChange={(e) =>
                  setFormData({ ...formData, license: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Años de Experiencia</Label>
              <Input
                id="experience"
                type="number"
                placeholder="Años"
                className="bg-input-background"
                value={formData.experience}
                onChange={(e) =>
                  setFormData({ ...formData, experience: e.target.value })
                }
              />
            </div>
          </div>

          {/* Schedule & Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule">Disponibilidad</Label>
              <Select
                value={formData.schedule}
                onValueChange={(value) =>
                  setFormData({ ...formData, schedule: value })
                }
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Tiempo Completo</SelectItem>
                  <SelectItem value="part-time">Medio Tiempo</SelectItem>
                  <SelectItem value="weekends">Fines de Semana</SelectItem>
                  <SelectItem value="evenings">Tardes/Noches</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Tarifa por Sesión</Label>
              <Input
                id="hourlyRate"
                type="number"
                placeholder="$0.00"
                className="bg-input-background"
                value={formData.hourlyRate}
                onChange={(e) =>
                  setFormData({ ...formData, hourlyRate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Domicilio */}
          <div className="space-y-3">
            <Label className="text-base">Domicilio del Consultorio</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm">Calle</Label>
                <Input
                  id="street"
                  placeholder="Nombre de la calle"
                  className="bg-input-background"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number" className="text-sm">Número</Label>
                <Input
                  id="number"
                  placeholder="Núm. ext/int"
                  className="bg-input-background"
                  value={formData.address.number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, number: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colony" className="text-sm">Colonia</Label>
                <Input
                  id="colony"
                  placeholder="Colonia"
                  className="bg-input-background"
                  value={formData.address.colony}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, colony: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-sm">Código Postal</Label>
                <Input
                  id="zipCode"
                  placeholder="44100"
                  className="bg-input-background"
                  value={formData.address.zipCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, zipCode: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm">Ciudad</Label>
                <Input
                  id="city"
                  className="bg-input-background"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm">Estado</Label>
                <Input
                  id="state"
                  className="bg-input-background"
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biografía / Descripción</Label>
            <Textarea
              id="bio"
              placeholder="Breve descripción del profesional, formación académica, enfoque terapéutico..."
              className="bg-input-background min-h-[100px]"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
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
              {saving ? "Creando usuario..." : "Guardar Psicólogo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
