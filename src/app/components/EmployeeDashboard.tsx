import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
} from "lucide-react";

const upcomingSessions = [
  {
    id: 1,
    psychologist: "Dr. Carlos Ruiz",
    date: "Mañana",
    time: "10:00 AM",
    type: "Terapia Cognitivo-Conductual",
    location: "Centro",
  },
  {
    id: 2,
    psychologist: "Dra. María López",
    date: "Viernes",
    time: "3:00 PM",
    type: "Sesión de Seguimiento",
    location: "Norte",
  },
];

const recentSessions = [
  {
    id: 1,
    psychologist: "Dr. Carlos Ruiz",
    date: "12 Jun 2025",
    rating: 5,
    notes: "Excelente sesión, gran avance en manejo de ansiedad",
  },
];

export function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-foreground mb-1">Bienvenido, Carlos</h1>
        <p className="text-muted-foreground">
          Gestiona tu bienestar mental con nuestros profesionales
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Sesiones Disponibles
                </p>
                <p className="text-3xl text-[#81C784]">2</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#81C784]/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#81C784]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Sesiones Completadas
                </p>
                <p className="text-3xl text-primary">2</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Próxima Cita</p>
                <p className="text-xl text-foreground">Mañana</p>
                <p className="text-sm text-muted-foreground">10:00 AM</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#4DD0E1]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#4DD0E1]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button className="h-auto py-4 md:py-6 flex-col gap-2 md:gap-3 bg-primary text-primary-foreground hover:bg-primary/90">
              <Calendar className="w-6 h-6 md:w-8 md:h-8" />
              <div className="text-center">
                <p className="text-sm md:text-base">Buscar Psicólogos</p>
                <p className="text-xs opacity-80">
                  Encuentra el profesional ideal
                </p>
              </div>
            </Button>
            <Button className="h-auto py-4 md:py-6 flex-col gap-2 md:gap-3" variant="outline">
              <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" />
              <div className="text-center">
                <p className="text-sm md:text-base">Mis Citas</p>
                <p className="text-xs text-muted-foreground">
                  Ver citas programadas
                </p>
              </div>
            </Button>
            <Button className="h-auto py-4 md:py-6 flex-col gap-2 md:gap-3" variant="outline">
              <Star className="w-6 h-6 md:w-8 md:h-8" />
              <div className="text-center">
                <p className="text-sm md:text-base">Historial</p>
                <p className="text-xs text-muted-foreground">
                  Ver sesiones anteriores
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Próximas Sesiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="text-foreground mb-1">{session.psychologist}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {session.type}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {session.date} - {session.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {session.location}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Detalles
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive">
                    Cancelar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Sesiones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-foreground mb-1">
                      {session.psychologist}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {session.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < session.rating
                            ? "fill-[#FFB74D] text-[#FFB74D]"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{session.notes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
