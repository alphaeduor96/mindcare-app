import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import {
  Star,
  MapPin,
  Calendar,
  Award,
  GraduationCap,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Globe,
  Heart,
  MessageSquare,
} from "lucide-react";

interface PsychologistProfileProps {
  isOpen: boolean;
  onClose: () => void;
  psychologist: any;
}

const reviews = [
  {
    id: 1,
    author: "Ana M.",
    rating: 5,
    date: "10 Jun 2025",
    comment: "Excelente profesional, muy empático y me ha ayudado muchísimo con mi ansiedad. Sus técnicas de respiración son muy efectivas.",
    helpful: 24,
  },
  {
    id: 2,
    author: "Carlos R.",
    rating: 5,
    date: "5 Jun 2025",
    comment: "El Dr. Ruiz es excepcional. Me siento muy cómodo en las sesiones y he notado grandes avances en mi manejo del estrés.",
    helpful: 18,
  },
  {
    id: 3,
    author: "María L.",
    rating: 4,
    date: "28 May 2025",
    comment: "Muy buen psicólogo, profesional y puntual. El consultorio es cómodo y accesible.",
    helpful: 12,
  },
  {
    id: 4,
    author: "Luis H.",
    rating: 5,
    date: "20 May 2025",
    comment: "Recomendado 100%. Sus técnicas cognitivo-conductuales son muy prácticas y me han ayudado en mi día a día.",
    helpful: 15,
  },
];

const certifications = [
  "Cédula Profesional: 12345678",
  "Certificación en Terapia Cognitivo-Conductual (AMTC)",
  "Diplomado en Manejo de Ansiedad y Estrés",
  "Certificación Internacional en Mindfulness",
];

const specialties = [
  "Terapia Cognitivo-Conductual",
  "Manejo de Ansiedad",
  "Depresión",
  "Estrés Laboral",
  "Trastornos del Estado de Ánimo",
];

export function PsychologistProfile({
  isOpen,
  onClose,
  psychologist,
}: PsychologistProfileProps) {
  if (!psychologist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perfil del Profesional</DialogTitle>
          <DialogDescription>
            Información completa y reseñas verificadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={psychologist.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {psychologist.name.split(" ").map((n: string) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-foreground mb-1">{psychologist.name}</h2>
                  <p className="text-muted-foreground mb-3">
                    {psychologist.specialty}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(psychologist.rating)
                            ? "fill-[#FFB74D] text-[#FFB74D]"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg text-foreground">{psychologist.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({psychologist.reviews} reseñas)
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {psychologist.zone}
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Desde</p>
                    <p className="text-foreground">$800/sesión</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Disponible</p>
                    <p className="text-foreground">Mañana 10:00</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Experiencia</p>
                    <p className="text-foreground">12 años</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">Acerca de</TabsTrigger>
              <TabsTrigger value="reviews">Reseñas ({reviews.length})</TabsTrigger>
              <TabsTrigger value="location">Ubicación</TabsTrigger>
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6 mt-4">
              {/* Bio */}
              <div>
                <h3 className="text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Sobre mí
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Psicólogo clínico con más de 12 años de experiencia en el tratamiento
                  de trastornos de ansiedad, depresión y problemas relacionados con el
                  estrés. Mi enfoque se basa en la Terapia Cognitivo-Conductual (TCC),
                  combinada con técnicas de mindfulness y relajación. Me apasiona ayudar
                  a mis pacientes a desarrollar herramientas prácticas para mejorar su
                  calidad de vida.
                </p>
              </div>

              {/* Specialties */}
              <div>
                <h3 className="text-foreground mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Áreas de Especialización
                </h3>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Education & Certifications */}
              <div>
                <h3 className="text-foreground mb-3 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Formación y Certificaciones
                </h3>
                <div className="space-y-2">
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <p className="text-foreground mb-1">
                        Licenciatura en Psicología
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Universidad Nacional Autónoma de México (UNAM)
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <p className="text-foreground mb-1">
                        Maestría en Psicología Clínica
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Universidad Iberoamericana
                      </p>
                    </CardContent>
                  </Card>
                  <div className="mt-4 space-y-2">
                    {certifications.map((cert, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <p className="text-sm text-muted-foreground">{cert}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-foreground mb-3">Contacto</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">+52 55 1234 5678</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">carlos.ruiz@mindcare.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">www.drcarlosruiz.com</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4 mt-4">
              {/* Rating Summary */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-5xl text-foreground mb-2">
                        {psychologist.rating}
                      </p>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(psychologist.rating)
                                ? "fill-[#FFB74D] text-[#FFB74D]"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {psychologist.reviews} reseñas
                      </p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-12">
                            {stars} ⭐
                          </span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#FFB74D]"
                              style={{
                                width: `${stars === 5 ? 85 : stars === 4 ? 12 : 3}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12">
                            {stars === 5 ? "85%" : stars === 4 ? "12%" : "3%"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-foreground mb-1">{review.author}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "fill-[#FFB74D] text-[#FFB74D]"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {review.date}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Verificado
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{review.comment}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Button variant="ghost" size="sm" className="h-auto p-0">
                          👍 Útil ({review.helpful})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-4 mt-4">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="text-foreground mb-4">Ubicación del Consultorio</h3>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-foreground mb-1">Consultorio Principal</p>
                        <p className="text-muted-foreground">
                          {psychologist.address || "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-foreground mb-1">Horario de Atención</p>
                        <p className="text-muted-foreground">
                          Lunes a Viernes: 9:00 AM - 7:00 PM
                        </p>
                        <p className="text-muted-foreground">Sábados: 10:00 AM - 2:00 PM</p>
                      </div>
                    </div>
                  </div>

                  {/* Map Placeholder */}
                  <div className="w-full h-[300px] bg-accent/30 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB]">
                      <div
                        className="absolute w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg"
                        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
                      >
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
                      <p className="text-sm text-foreground">{psychologist.zone}</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-accent/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Accesibilidad:</strong> Estacionamiento disponible, acceso para
                      personas con discapacidad, transporte público cercano (Metro
                      Insurgentes).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA */}
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendar Cita
            </Button>
            <Button variant="outline" size="lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              Enviar Mensaje
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
