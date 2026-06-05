import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Search,
  MapPin,
  Star,
  Calendar,
  DollarSign,
  Heart,
  LayoutGrid,
  List,
  Phone,
  Mail,
} from "lucide-react";
import { PsychologistFullProfile } from "./PsychologistFullProfile";
import { BookAppointmentModal } from "./BookAppointmentModal";

const psychologists = [
  {
    id: 1,
    name: "Dr. Carlos Ruiz",
    specialty: "Terapia Cognitivo-Conductual",
    zone: "Centro",
    rating: 4.9,
    reviews: 127,
    baseRate: 800,
    nextAvailable: "Mañana 10:00 AM",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop",
    description: "Especialista en ansiedad, depresión y trastornos del estado de ánimo.",
    lat: 19.432608,
    lng: -99.133209,
  },
  {
    id: 2,
    name: "Dra. María López",
    specialty: "Psicología Infantil",
    zone: "Norte",
    rating: 4.8,
    reviews: 98,
    baseRate: 850,
    nextAvailable: "Hoy 3:00 PM",
    avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop",
    description: "Enfoque en desarrollo infantil y problemas de conducta.",
    lat: 19.485608,
    lng: -99.133209,
  },
  {
    id: 3,
    name: "Dr. Juan Torres",
    specialty: "Terapia de Pareja",
    zone: "Sur",
    rating: 4.7,
    reviews: 85,
    baseRate: 750,
    nextAvailable: "Lunes 11:00 AM",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop",
    description: "Especialista en conflictos de pareja y terapia familiar.",
    lat: 19.365608,
    lng: -99.133209,
  },
  {
    id: 4,
    name: "Dra. Laura Martínez",
    specialty: "Terapia Familiar",
    zone: "Centro",
    rating: 4.9,
    reviews: 142,
    baseRate: 900,
    nextAvailable: "Mañana 2:00 PM",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    description: "Experta en dinámicas familiares y comunicación.",
    lat: 19.428608,
    lng: -99.145209,
  },
  {
    id: 5,
    name: "Dr. Roberto Sánchez",
    specialty: "Neuropsicología",
    zone: "Oriente",
    rating: 4.8,
    reviews: 76,
    baseRate: 950,
    nextAvailable: "Martes 9:00 AM",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&h=100&fit=crop",
    description: "Evaluación neuropsicológica y rehabilitación cognitiva.",
    lat: 19.432608,
    lng: -99.100209,
  },
];

interface PsychologistDirectoryProps {
  onViewProfile?: (psychologistId: number) => void;
}

export function PsychologistDirectory({ onViewProfile }: PsychologistDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [showMap, setShowMap] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPsychologist, setSelectedPsychologist] = useState<any>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const filteredPsychologists = psychologists.filter((psy) => {
    const matchesSearch = psy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psy.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === "all" || psy.zone === selectedZone;
    const matchesSpecialty = selectedSpecialty === "all" || psy.specialty.includes(selectedSpecialty);
    
    return matchesSearch && matchesZone && matchesSpecialty;
  });

  const handleViewProfile = (psychologist: any) => {
    if (onViewProfile) {
      onViewProfile(psychologist.id);
    }
  };

  const handleBookAppointment = (psychologist: any) => {
    setSelectedPsychologist(psychologist);
    setBookingModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1">Directorio de Psicólogos</h1>
        <p className="text-muted-foreground">
          Encuentra al profesional perfecto para ti
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o especialidad..."
                className="pl-10 bg-input-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-full md:w-[180px] bg-input-background">
                <SelectValue placeholder="Zona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                <SelectItem value="Centro">Centro</SelectItem>
                <SelectItem value="Norte">Norte</SelectItem>
                <SelectItem value="Sur">Sur</SelectItem>
                <SelectItem value="Oriente">Oriente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-full md:w-[200px] bg-input-background">
                <SelectValue placeholder="Especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Cognitivo">Cognitivo-Conductual</SelectItem>
                <SelectItem value="Infantil">Psicología Infantil</SelectItem>
                <SelectItem value="Pareja">Terapia de Pareja</SelectItem>
                <SelectItem value="Familiar">Terapia Familiar</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button
                variant={showMap ? "default" : "outline"}
                onClick={() => setShowMap(!showMap)}
                className="gap-2 flex-1 sm:flex-none"
                size="sm"
              >
                <MapPin className="w-4 h-4" />
                <span className="sm:inline">{showMap ? "Lista" : "Mapa"}</span>
              </Button>
              
              {!showMap && (
                <div className="flex border border-border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none h-9 w-9"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none h-9 w-9"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map View */}
      {showMap && (
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="w-full h-[400px] bg-accent/30 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Simple map representation */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB]">
                {filteredPsychologists.map((psy) => (
                  <div
                    key={psy.id}
                    className="absolute w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
                    style={{
                      left: `${((psy.lng + 99.2) / 0.2) * 100}%`,
                      top: `${((19.5 - psy.lat) / 0.2) * 100}%`,
                    }}
                    title={psy.name}
                  >
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                ))}
              </div>
              <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg">
                <p className="text-sm text-muted-foreground">
                  {filteredPsychologists.length} psicólogos en la zona
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!showMap && viewMode === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {filteredPsychologists.map((psychologist) => (
            <Card 
              key={psychologist.id} 
              className="border-border hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20 ring-2 ring-primary/20">
                      <AvatarImage src={psychologist.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {psychologist.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="text-foreground mb-1 truncate group-hover:text-primary transition-colors"
                            onClick={() => handleViewProfile(psychologist)}
                          >
                            {psychologist.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                            {psychologist.specialty}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          <Heart className="w-5 h-5" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-[#FFB74D] text-[#FFB74D]" />
                          <span className="text-sm text-foreground">{psychologist.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({psychologist.reviews})
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {psychologist.zone}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {psychologist.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#66BB6A] text-white">
                        ${psychologist.baseRate}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {psychologist.nextAvailable}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm"
                      onClick={() => handleBookAppointment(psychologist)}
                    >
                      Agendar
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline" 
                      className="flex-1 text-xs sm:text-sm"
                      onClick={() => handleViewProfile(psychologist)}
                    >
                      Ver Perfil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!showMap && viewMode === "list" && (
        <div className="space-y-4">
          {filteredPsychologists.map((psychologist) => (
            <Card 
              key={psychologist.id} 
              className="border-border hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24 ring-2 ring-primary/20">
                    <AvatarImage src={psychologist.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {psychologist.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 
                          className="text-xl text-foreground mb-1 group-hover:text-primary transition-colors cursor-pointer"
                          onClick={() => handleViewProfile(psychologist)}
                        >
                          {psychologist.name}
                        </h3>
                        <p className="text-muted-foreground mb-3">
                          {psychologist.specialty}
                        </p>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-5 h-5 fill-[#FFB74D] text-[#FFB74D]" />
                              <span className="text-lg text-foreground">{psychologist.rating}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ({psychologist.reviews} reseñas)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{psychologist.zone}</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {psychologist.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <Badge className="bg-[#66BB6A] text-white">
                              ${psychologist.baseRate}/sesión
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {psychologist.nextAvailable}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Heart className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-[140px]">
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => handleBookAppointment(psychologist)}
                    >
                      Agendar Cita
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleViewProfile(psychologist)}
                    >
                      Ver Perfil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredPsychologists.length === 0 && !showMap && (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron psicólogos con los filtros seleccionados
            </p>
          </CardContent>
        </Card>
      )}

      {/* Booking Modal */}
      {selectedPsychologist && (
        <BookAppointmentModal
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedPsychologist(null);
          }}
          psychologist={selectedPsychologist}
        />
      )}
    </div>
  );
}
