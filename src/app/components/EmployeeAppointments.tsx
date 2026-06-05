import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Star,
  MessageSquare,
  Phone,
  Video,
  FileText,
} from "lucide-react";
import { PsychologistProfile } from "./PsychologistProfile";

const upcomingAppointments = [
  {
    id: 1,
    psychologist: {
      id: 1,
      name: "Dr. Carlos Ruiz",
      specialty: "Terapia Cognitivo-Conductual",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop",
      rating: 4.9,
      reviews: 127,
      zone: "Centro",
      address: "Av. Insurgentes Sur 1234, Col. Del Valle",
    },
    date: "2025-10-16",
    time: "10:00 AM",
    duration: 60,
    type: "Sesión Individual",
    modality: "Presencial",
    status: "confirmed",
    notes: "Primera sesión - evaluación inicial",
  },
  {
    id: 2,
    psychologist: {
      id: 2,
      name: "Dra. María López",
      specialty: "Psicología Infantil",
      avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop",
      rating: 4.8,
      reviews: 98,
      zone: "Norte",
      address: "Av. Revolución 567, Lomas",
    },
    date: "2025-10-18",
    time: "3:00 PM",
    duration: 45,
    type: "Sesión de Seguimiento",
    modality: "Virtual",
    status: "confirmed",
    notes: "",
  },
];

const pastAppointments = [
  {
    id: 3,
    psychologist: {
      id: 1,
      name: "Dr. Carlos Ruiz",
      specialty: "Terapia Cognitivo-Conductual",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop",
      rating: 4.9,
      reviews: 127,
      zone: "Centro",
      address: "Av. Insurgentes Sur 1234, Col. Del Valle",
    },
    date: "2025-10-12",
    time: "10:00 AM",
    duration: 60,
    type: "Sesión Individual",
    modality: "Presencial",
    status: "completed",
    myRating: 5,
    myReview: "Excelente profesional, me ayudó mucho con mis técnicas de respiración.",
  },
  {
    id: 4,
    psychologist: {
      id: 1,
      name: "Dr. Carlos Ruiz",
      specialty: "Terapia Cognitivo-Conductual",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop",
      rating: 4.9,
      reviews: 127,
      zone: "Centro",
      address: "Av. Insurgentes Sur 1234, Col. Del Valle",
    },
    date: "2025-10-08",
    time: "10:00 AM",
    duration: 60,
    type: "Sesión Individual",
    modality: "Presencial",
    status: "completed",
    myRating: 5,
    myReview: "Gran avance en manejo de ansiedad. Muy recomendado.",
  },
];

export function EmployeeAppointments() {
  const [selectedPsychologist, setSelectedPsychologist] = useState<any>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleViewProfile = (psychologist: any) => {
    setSelectedPsychologist(psychologist);
    setProfileModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1">Mis Citas</h1>
        <p className="text-muted-foreground">
          Gestiona tus sesiones de terapia
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Próximas Citas</p>
                <p className="text-3xl text-foreground">2</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Sesiones Completadas</p>
                <p className="text-3xl text-foreground">2</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#81C784]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#81C784]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Sesiones Disponibles</p>
                <p className="text-3xl text-[#4DD0E1]">2</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#4DD0E1]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#4DD0E1]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="past">Historial</TabsTrigger>
        </TabsList>

        {/* Upcoming Appointments */}
        <TabsContent value="upcoming" className="space-y-3 md:space-y-4">
          {upcomingAppointments.map((appointment) => (
            <Card key={appointment.id} className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Psychologist Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-16 h-16 cursor-pointer" onClick={() => handleViewProfile(appointment.psychologist)}>
                      <AvatarImage src={appointment.psychologist.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {appointment.psychologist.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 
                            className="text-foreground mb-1 cursor-pointer hover:text-primary"
                            onClick={() => handleViewProfile(appointment.psychologist)}
                          >
                            {appointment.psychologist.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {appointment.psychologist.specialty}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-[#FFB74D] text-[#FFB74D]" />
                              <span className="text-sm text-foreground">{appointment.psychologist.rating}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {appointment.status === "confirmed" ? "Confirmada" : "Pendiente"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {new Date(appointment.date).toLocaleDateString("es-ES", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {appointment.time} ({appointment.duration} min)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {appointment.modality === "Presencial" ? (
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Video className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-foreground">{appointment.modality}</span>
                        </div>
                        {appointment.modality === "Presencial" && (
                          <div className="flex items-start gap-2 text-sm md:col-span-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground">
                              {appointment.psychologist.address}
                            </span>
                          </div>
                        )}
                      </div>

                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-accent/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <strong>Notas:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2 md:w-[140px]">
                    {appointment.modality === "Virtual" && (
                      <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                        <Video className="w-4 h-4" />
                        Unirse
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1 gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Mensaje
                    </Button>
                    <Button variant="outline" className="flex-1 text-destructive gap-2">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Past Appointments */}
        <TabsContent value="past" className="space-y-4">
          {pastAppointments.map((appointment) => (
            <Card key={appointment.id} className="border-border">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-16 h-16 cursor-pointer" onClick={() => handleViewProfile(appointment.psychologist)}>
                      <AvatarImage src={appointment.psychologist.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {appointment.psychologist.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 
                        className="text-foreground mb-1 cursor-pointer hover:text-primary"
                        onClick={() => handleViewProfile(appointment.psychologist)}
                      >
                        {appointment.psychologist.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {appointment.psychologist.specialty}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {new Date(appointment.date).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{appointment.time}</span>
                        </div>
                        <Badge className="bg-[#81C784] text-white">Completada</Badge>
                      </div>

                      {/* My Review */}
                      {appointment.myRating && (
                        <div className="mt-3 p-4 bg-accent/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground">Tu calificación:</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < appointment.myRating
                                      ? "fill-[#FFB74D] text-[#FFB74D]"
                                      : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-foreground">{appointment.myReview}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 md:w-[140px]">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleViewProfile(appointment.psychologist)}
                    >
                      Ver Perfil
                    </Button>
                    <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                      Reagendar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Psychologist Profile Modal */}
      {selectedPsychologist && (
        <PsychologistProfile
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedPsychologist(null);
          }}
          psychologist={selectedPsychologist}
        />
      )}
    </div>
  );
}
