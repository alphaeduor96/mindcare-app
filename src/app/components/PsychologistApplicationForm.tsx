import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
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
import { X, ArrowLeft, CheckCircle2, Upload, Award, GraduationCap, Heart, DollarSign, Users, Clock } from "lucide-react";

interface PsychologistApplicationFormProps {
  onBack: () => void;
  onGoToControlLanding: () => void;
}

export function PsychologistApplicationForm({ onBack, onGoToControlLanding }: PsychologistApplicationFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    email: "",
    phone: "",
    approach: "",
    subspecialties: [] as string[],
    license: "",
    experience: "",
    education: "",
    certifications: "",
    availability: "full-time",
    preferredRate: "",
    bio: "",
    motivation: "",
    references: "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (
      !formData.fullName ||
      !formData.birthDate ||
      !formData.email ||
      !formData.phone ||
      !formData.approach ||
      formData.subspecialties.length === 0 ||
      !formData.license ||
      !formData.education
    ) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    console.log("Aplicación recibida:", formData);
    toast.success("¡Aplicación enviada exitosamente! Te contactaremos pronto.");

    // Reset form
    setFormData({
      fullName: "",
      birthDate: "",
      email: "",
      phone: "",
      approach: "",
      subspecialties: [],
      license: "",
      experience: "",
      education: "",
      certifications: "",
      availability: "full-time",
      preferredRate: "",
      bio: "",
      motivation: "",
      references: "",
      address: {
        street: "",
        number: "",
        colony: "",
        city: "Guadalajara",
        state: "Jalisco",
        zipCode: "",
      },
    });

    // Go back after successful submission
    setTimeout(() => onBack(), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FFFE] to-white py-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 gap-2 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7E57C2] to-[#9575CD] flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl text-foreground mb-3">
              Únete a Nuestra Red de Psicólogos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Forma parte de una red exclusiva de profesionales de la salud mental.
              Solo el 8% de aplicantes son aceptados.
            </p>
          </div>
        </div>

        {/* Benefits and Info Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <Badge className="mb-6 bg-[#7E57C2]/10 text-[#7E57C2] px-4 py-2">
              💼 Red Profesional
            </Badge>
            <h2 className="text-3xl text-foreground mb-4">
              Beneficios de Unirte a la Red
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Como psicólogo afiliado accedes a beneficios exclusivos que impulsarán tu práctica profesional.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-[#7E57C2]/20 bg-white hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[#66BB6A]/10 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-7 h-7 text-[#66BB6A]" />
                </div>
                <h3 className="text-lg text-foreground mb-2">
                  Sistema 100% Gratis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Acceso completo sin costo: agenda, pacientes, pagos y reportes ilimitados
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#7E57C2]/20 bg-white hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[#FF9800]/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-[#FF9800]" />
                </div>
                <h3 className="text-lg text-foreground mb-2">
                  Referidos Constantes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Recibe pacientes de 500+ empresas afiliadas a nuestra red
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#7E57C2]/20 bg-white hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[#7E57C2]/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-7 h-7 text-[#7E57C2]" />
                </div>
                <h3 className="text-lg text-foreground mb-2">
                  Perfil Público
                </h3>
                <p className="text-sm text-muted-foreground">
                  Aparece en nuestro directorio con reseñas y calificaciones verificadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Affiliation Card */}
          <Card className="border-2 border-[#7E57C2] bg-gradient-to-br from-white to-[#7E57C2]/5 relative overflow-hidden shadow-2xl mb-8">
            <div className="absolute top-0 right-0 bg-[#7E57C2] text-white px-6 py-2">
              ⭐ 100% Gratis
            </div>
            <CardContent className="p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="mb-6">
                    <h4 className="text-3xl text-foreground mb-3">
                      MindCare Afiliado
                    </h4>
                    <p className="text-muted-foreground mb-4">
                      Para psicólogos dentro de nuestra red profesional
                    </p>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-6xl text-[#7E57C2]">$0</span>
                      <span className="text-muted-foreground">MXN/mes</span>
                    </div>
                    <Badge className="bg-[#66BB6A]/10 text-[#66BB6A]">
                      Gratis para Siempre
                    </Badge>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        <strong>Sistema completo gratis:</strong> calendario, pacientes, pagos, reportes
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        <strong>Citas y pacientes ilimitados</strong> sin restricciones
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        <strong>Referidos empresariales constantes</strong> de 500+ empresas
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        <strong>Perfil público</strong> en directorio con reseñas verificadas
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        <strong>Soporte prioritario</strong> del equipo MindCare
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        <strong>Acceso a consultorios premium</strong> en toda la ZMG
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <div className="bg-accent/50 rounded-lg p-6 mb-6">
                      <h5 className="text-foreground mb-3">
                        Requisitos de Selección
                      </h5>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7E57C2]" />
                          Cédula profesional vigente
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7E57C2]" />
                          Especialización verificada (no generalistas)
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7E57C2]" />
                          Mínimo 2 años de experiencia
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7E57C2]" />
                          Consultorio en ZMG o 100% en línea
                        </li>
                      </ul>
                      <Badge variant="secondary" className="mt-4 bg-[#7E57C2]/10 text-[#7E57C2]">
                        Solo 8% aceptados
                      </Badge>
                    </div>

                    <div className="bg-white rounded-lg p-6 border-2 border-dashed border-[#7E57C2]/20">
                      <p className="text-sm text-muted-foreground mb-3">
                        ¿No cumples los requisitos o prefieres algo más flexible?
                      </p>
                      <Button
                        type="button"
                        onClick={onGoToControlLanding}
                        variant="outline"
                        className="w-full border-[#7E57C2] text-[#7E57C2] hover:bg-[#7E57C2]/5 gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Conocer MindCare Control
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Sistema de gestión pago por uso desde $0
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Application Form */}
        <Card className="border-border">
          <CardHeader>
            <h2 className="text-2xl text-foreground">Formulario de Aplicación</h2>
            <CardDescription>
              Por favor completa toda la información solicitada. Los campos marcados con * son obligatorios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg text-foreground border-b border-border pb-2">
                  Información Personal
                </h3>
                
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="+52 33 1234 5678"
                      className="bg-input-background"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Información Profesional */}
              <div className="space-y-4">
                <h3 className="text-lg text-foreground border-b border-border pb-2">
                  Información Profesional
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="experience">
                      Años de Experiencia <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="experience"
                      type="number"
                      placeholder="Años"
                      min="0"
                      className="bg-input-background"
                      value={formData.experience}
                      onChange={(e) =>
                        setFormData({ ...formData, experience: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">
                    Formación Académica <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="education"
                    placeholder="Universidad, títulos, posgrados, diplomados..."
                    className="bg-input-background min-h-[100px]"
                    value={formData.education}
                    onChange={(e) =>
                      setFormData({ ...formData, education: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certificaciones y Cursos Especializados</Label>
                  <Textarea
                    id="certifications"
                    placeholder="Certificaciones adicionales, cursos especializados, talleres..."
                    className="bg-input-background min-h-[80px]"
                    value={formData.certifications}
                    onChange={(e) =>
                      setFormData({ ...formData, certifications: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Enfoque y Especialidades */}
              <div className="space-y-4">
                <h3 className="text-lg text-foreground border-b border-border pb-2">
                  Enfoque y Especialidades
                </h3>

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

                <div className="space-y-3">
                  <Label>
                    Subespecialidades <span className="text-destructive">*</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (Selecciona al menos una)
                    </span>
                  </Label>
                  
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

                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-3 bg-input-background rounded-lg border border-border">
                    {subspecialties.map((subspecialty) => (
                      <div key={subspecialty.value} className="flex items-start gap-2">
                        <Checkbox
                          id={`app-${subspecialty.value}`}
                          checked={formData.subspecialties.includes(subspecialty.value)}
                          onCheckedChange={() => toggleSubspecialty(subspecialty.value)}
                        />
                        <label
                          htmlFor={`app-${subspecialty.value}`}
                          className="text-sm cursor-pointer leading-tight"
                        >
                          {subspecialty.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disponibilidad */}
              <div className="space-y-4">
                <h3 className="text-lg text-foreground border-b border-border pb-2">
                  Disponibilidad y Tarifa
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availability">Disponibilidad Horaria</Label>
                    <Select
                      value={formData.availability}
                      onValueChange={(value) =>
                        setFormData({ ...formData, availability: value })
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
                    <Label htmlFor="preferredRate">Tarifa Preferida por Sesión (MXN)</Label>
                    <Input
                      id="preferredRate"
                      type="number"
                      placeholder="$800"
                      className="bg-input-background"
                      value={formData.preferredRate}
                      onChange={(e) =>
                        setFormData({ ...formData, preferredRate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Domicilio del Consultorio */}
              <div className="space-y-4">
                <h3 className="text-lg text-foreground border-b border-border pb-2">
                  Ubicación del Consultorio
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Calle</Label>
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
                    <Label htmlFor="number">Número</Label>
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
                    <Label htmlFor="colony">Colonia</Label>
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
                    <Label htmlFor="zipCode">Código Postal</Label>
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
                    <Label htmlFor="city">Ciudad</Label>
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
                    <Label htmlFor="state">Estado</Label>
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

              {/* Información Adicional */}
              <div className="space-y-4">
                <h3 className="text-lg text-foreground border-b border-border pb-2">
                  Información Adicional
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografía Profesional</Label>
                  <Textarea
                    id="bio"
                    placeholder="Breve descripción de tu práctica profesional, enfoque terapéutico, especialidades..."
                    className="bg-input-background min-h-[120px]"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivation">
                    ¿Por qué quieres unirte a MindCare?
                  </Label>
                  <Textarea
                    id="motivation"
                    placeholder="Cuéntanos qué te motiva a formar parte de nuestra red..."
                    className="bg-input-background min-h-[100px]"
                    value={formData.motivation}
                    onChange={(e) =>
                      setFormData({ ...formData, motivation: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="references">Referencias Profesionales</Label>
                  <Textarea
                    id="references"
                    placeholder="Nombre, cargo y contacto de 2-3 referencias profesionales (opcional)"
                    className="bg-input-background min-h-[80px]"
                    value={formData.references}
                    onChange={(e) =>
                      setFormData({ ...formData, references: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#7E57C2] text-white hover:bg-[#7E57C2]/90 gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Enviar Aplicación
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Revisaremos tu aplicación en un plazo de 5-7 días hábiles.
            <br />
            Te contactaremos por email para los siguientes pasos del proceso de selección.
          </p>
        </div>
      </div>
    </div>
  );
}
