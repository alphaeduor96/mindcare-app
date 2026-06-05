import { useState } from "react";
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
  ArrowLeft,
  Video,
  User,
} from "lucide-react";
import { BookAppointmentModal } from "./BookAppointmentModal";

interface PsychologistFullProfileProps {
  psychologist: any;
  onBack: () => void;
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

export function PsychologistFullProfile({
  psychologist,
  onBack,
}: PsychologistFullProfileProps) {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2">
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Volver al directorio</span>
        <span className="sm:hidden">Volver</span>
      </Button>

      {/* Hero Section */}
      <Card className="border-border">
        <CardContent className="p-4 md:p-8">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 mx-auto lg:mx-0">
              <AvatarImage src={psychologist.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl md:text-4xl">
                {psychologist.name.split(" ").map((n: string) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="flex-1">
                  <h1 className="text-foreground mb-2 text-xl md:text-2xl">{psychologist.name}</h1>
                  <p className="text-base md:text-xl text-muted-foreground mb-3 md:mb-4">
                    {psychologist.specialty}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Heart className="w-6 h-6" />
                </Button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.floor(psychologist.rating)
                            ? "fill-[#FFB74D] text-[#FFB74D]"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-2xl text-foreground">{psychologist.rating}</span>
                  <span className="text-muted-foreground">
                    ({psychologist.reviews} reseñas)
                  </span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                  <span>{psychologist.zone}</span>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tarifa</p>
                    <p className="text-lg text-foreground">${psychologist.baseRate}/sesión</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#81C784]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-[#81C784]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Disponible</p>
                    <p className="text-lg text-foreground">{psychologist.nextAvailable}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#4DD0E1]/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-[#4DD0E1]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Experiencia</p>
                    <p className="text-lg text-foreground">12 años</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto"
                  onClick={() => setBookingModalOpen(true)}
                >
                  <Calendar className="w-5 h-5" />
                  Agendar Cita
                </Button>
                <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                  <MessageSquare className="w-5 h-5" />
                  <span className="hidden sm:inline">Enviar Mensaje</span>
                  <span className="sm:hidden">Mensaje</span>
                </Button>
                <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                  <Video className="w-5 h-5" />
                  <span className="hidden sm:inline">Sesión Virtual</span>
                  <span className="sm:hidden">Virtual</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="about" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="about" className="text-xs sm:text-sm">Acerca de</TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Reseñas ({reviews.length})</span>
            <span className="sm:hidden">Reseñas</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="text-xs sm:text-sm">Ubicación</TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-4 md:space-y-6">
          <Card className="border-border">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-foreground mb-4 flex items-center gap-2">
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
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Áreas de Especialización
              </h3>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-primary/10 text-primary px-4 py-2"
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="text-foreground mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Formación y Certificaciones
              </h3>
              <div className="space-y-4">
                <Card className="border-border bg-accent/30">
                  <CardContent className="p-4">
                    <p className="text-foreground mb-1">
                      Licenciatura en Psicología
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Universidad Nacional Autónoma de México (UNAM)
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-accent/30">
                  <CardContent className="p-4">
                    <p className="text-foreground mb-1">
                      Maestría en Psicología Clínica
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Universidad Iberoamericana
                    </p>
                  </CardContent>
                </Card>
                <div className="space-y-3 pt-2">
                  {certifications.map((cert, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <p className="text-muted-foreground">{cert}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="text-foreground mb-4">Información de Contacto</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">+52 55 1234 5678</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">carlos.ruiz@mindcare.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">www.drcarlosruiz.com</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card className="border-border">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="text-center">
                  <p className="text-6xl text-foreground mb-3">
                    {psychologist.rating}
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.floor(psychologist.rating)
                            ? "fill-[#FFB74D] text-[#FFB74D]"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    Basado en {psychologist.reviews} reseñas
                  </p>
                </div>
                <div className="flex-1 w-full space-y-3">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-16">
                        {stars} estrellas
                      </span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FFB74D]"
                          style={{
                            width: `${stars === 5 ? 85 : stars === 4 ? 12 : 3}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {stars === 5 ? "85%" : stars === 4 ? "12%" : "3%"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {reviews.map((review) => (
              <Card key={review.id} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-foreground mb-1">{review.author}</p>
                        <div className="flex items-center gap-3">
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
                          <span className="text-sm text-muted-foreground">
                            {review.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-[#81C784]/10 text-[#81C784]">
                      ✓ Verificado
                    </Badge>
                  </div>
                  <p className="text-foreground mb-4 leading-relaxed">{review.comment}</p>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    👍 Útil ({review.helpful})
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-6">
          <Card className="border-border">
            <CardContent className="p-6">
              <h3 className="text-foreground mb-6">Ubicación del Consultorio</h3>
              <div className="space-y-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground mb-2">Consultorio Principal</p>
                    <p className="text-muted-foreground">
                      Av. Insurgentes Sur 1234, Col. Del Valle, CDMX
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#81C784]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-[#81C784]" />
                  </div>
                  <div>
                    <p className="text-foreground mb-2">Horario de Atención</p>
                    <p className="text-muted-foreground">
                      Lunes a Viernes: 9:00 AM - 7:00 PM
                    </p>
                    <p className="text-muted-foreground">Sábados: 10:00 AM - 2:00 PM</p>
                  </div>
                </div>
              </div>

              <div className="w-full h-[400px] bg-accent/30 rounded-xl flex items-center justify-center relative overflow-hidden mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB]">
                  <div
                    className="absolute w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl"
                    style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
                  >
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 bg-white p-4 rounded-lg shadow-lg">
                  <p className="text-foreground">{psychologist.zone}</p>
                  <p className="text-sm text-muted-foreground">Ciudad de México</p>
                </div>
              </div>

              <Card className="border-border bg-accent/30">
                <CardContent className="p-4">
                  <p className="text-sm text-foreground mb-2">
                    <strong>Accesibilidad y Transporte:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Estacionamiento disponible</li>
                    <li>Acceso para personas con discapacidad</li>
                    <li>Metro Insurgentes (Línea 1) - 5 min caminando</li>
                    <li>Múltiples rutas de camión disponibles</li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Modal */}
      <BookAppointmentModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        psychologist={psychologist}
      />
    </div>
  );
}
