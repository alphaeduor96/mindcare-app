import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Languages,
  List,
  Mail,
  Map,
  MapPin,
  MessageCircle,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Video,
} from "lucide-react";
import { supabaseRest } from "../../services/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import mindcareIsotype from "../../assets/mindcare-isotype.png";

interface DirectoryPsychologist {
  id: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  foto_perfil_url?: string | null;
  cedula_profesional?: string | null;
  especialidades?: string[] | null;
  enfoque_principal?: string | null;
  biografia?: string | null;
  anos_experiencia?: number | null;
  tarifa_privada_centavos?: number | null;
  duracion_sesion_minutos?: number | null;
  modalidades?: string[] | null;
  verificado?: boolean | null;
  calificacion_promedio?: number | null;
  total_resenas?: number | null;
  plan_codigo?: "basico" | "intermedio" | "pro" | "afiliado" | null;
  plan_nombre?: string | null;
  consultorio_colonia?: string | null;
  consultorio_municipio?: string | null;
  consultorio_estado?: string | null;
  consultorio_latitud?: number | null;
  consultorio_longitud?: number | null;
  consultorio_fotos_urls?: string[] | null;
  servicios?: DirectoryService[] | null;
}

interface DirectoryService {
  nombre: string;
  descripcion?: string | null;
  duracion_minutos?: number | null;
  precio_centavos?: number | null;
  modalidad?: "presencial" | "virtual" | "ambas" | null;
}

interface PsychologistDirectoryProps {
  publicMode?: boolean;
  onBack?: () => void;
  onShowAuth?: () => void;
}

const planRank: Record<string, number> = { pro: 0, intermedio: 1, afiliado: 1, basico: 2 };
const PAGE_SIZE = 12;
const directorySelect = "id,nombre,apellido,email,telefono,foto_perfil_url,cedula_profesional,especialidades,enfoque_principal,biografia,anos_experiencia,tarifa_privada_centavos,duracion_sesion_minutos,modalidades,verificado,calificacion_promedio,total_resenas,plan_codigo,plan_nombre,consultorio_colonia,consultorio_municipio,consultorio_estado,consultorio_latitud,consultorio_longitud,consultorio_fotos_urls,servicios";
const popularCities = ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá"];
const popularStates = ["Jalisco"];
const popularSpecialties = [
  "Ansiedad",
  "Depresión",
  "Estrés",
  "Pareja",
  "Familia",
  "Autoestima",
  "Duelo",
  "Trauma",
  "Adolescentes",
  "Infantil",
];
const therapyTypes = ["Cognitivo conductual", "Humanista", "Sistémica", "EMDR", "Mindfulness", "Terapia breve"];
const concernTopics = ["Ansiedad", "Estrés laboral", "Duelo", "Relaciones", "Autoestima", "Crianza", "Crisis", "Trauma"];
const guadalajaraReference = { lat: 20.6736, lng: -103.344 };
const defaultMapBounds = {
  north: 20.77,
  south: 20.57,
  east: -103.25,
  west: -103.45,
};

function fullName(psychologist: DirectoryPsychologist) {
  return `${psychologist.nombre || ""} ${psychologist.apellido || ""}`.trim() || "Psicólogo MindCare";
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function currency(cents?: number | null) {
  if (!cents) return "Tarifa por confirmar";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(cents / 100);
}

function publicServices(psychologist: DirectoryPsychologist) {
  if (psychologist.servicios?.length) return psychologist.servicios;

  return [{
    nombre: "Sesión terapéutica",
    descripcion: "Consulta profesional",
    duracion_minutos: psychologist.duracion_sesion_minutos || 50,
    precio_centavos: psychologist.tarifa_privada_centavos || null,
    modalidad: "ambas" as const,
  }];
}

function readableServiceModality(modality?: DirectoryService["modalidad"]) {
  if (modality === "virtual") return "En línea";
  if (modality === "presencial") return "Presencial";
  return "Presencial / En línea";
}

function planBadge(plan?: string | null) {
  if (plan === "pro") return { label: "Premium", className: "bg-[#0B5558] text-white", icon: Sparkles };
  if (plan === "intermedio" || plan === "afiliado") return { label: "Recomendado", className: "bg-primary text-primary-foreground", icon: Award };
  return { label: "Normal", className: "bg-muted text-muted-foreground", icon: ShieldCheck };
}

function whatsappUrl(psychologist: DirectoryPsychologist) {
  const phone = (psychologist.telefono || "").replace(/\D/g, "");
  const text = encodeURIComponent(`Hola, vi tu perfil en el directorio de MindCare y me gustaría pedir información para una consulta.`);
  return phone ? `https://wa.me/${phone.startsWith("52") ? phone : `52${phone}`}?text=${text}` : "";
}

function emailUrl(psychologist: DirectoryPsychologist) {
  const subject = encodeURIComponent("Consulta desde directorio MindCare");
  const body = encodeURIComponent("Hola, vi tu perfil en MindCare y me gustaría recibir información para una consulta.");
  return psychologist.email ? `mailto:${psychologist.email}?subject=${subject}&body=${body}` : "";
}

function readableModalities(modalities?: string[] | null) {
  const values = modalities?.length ? modalities : ["presencial"];
  return values.map((value) => value === "virtual" ? "En línea" : "Presencial").join(" y ");
}

function approximateLocation(psychologist: DirectoryPsychologist) {
  const parts = [
    psychologist.consultorio_colonia,
    psychologist.consultorio_municipio,
    psychologist.consultorio_estado,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "Ubicación aproximada por confirmar";
}

function mapUrl(psychologist: DirectoryPsychologist) {
  const lat = Number(psychologist.consultorio_latitud);
  const lng = Number(psychologist.consultorio_longitud);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const markerLat = hasCoords ? lat : guadalajaraReference.lat;
  const markerLng = hasCoords ? lng : guadalajaraReference.lng;
  const delta = hasCoords ? 0.018 : 0.035;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${markerLng - delta}%2C${markerLat - delta}%2C${markerLng + delta}%2C${markerLat + delta}&layer=mapnik&marker=${markerLat}%2C${markerLng}`;
}

function directoryMapUrl(psychologists: DirectoryPsychologist[]) {
  const coords = psychologists
    .map((psychologist) => ({
      lat: Number(psychologist.consultorio_latitud),
      lng: Number(psychologist.consultorio_longitud),
    }))
    .filter((coord) => Number.isFinite(coord.lat) && Number.isFinite(coord.lng));

  if (coords.length === 0) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${defaultMapBounds.west}%2C${defaultMapBounds.south}%2C${defaultMapBounds.east}%2C${defaultMapBounds.north}&layer=mapnik`;
  }

  const north = Math.max(...coords.map((coord) => coord.lat), defaultMapBounds.north);
  const south = Math.min(...coords.map((coord) => coord.lat), defaultMapBounds.south);
  const east = Math.max(...coords.map((coord) => coord.lng), defaultMapBounds.east);
  const west = Math.min(...coords.map((coord) => coord.lng), defaultMapBounds.west);
  const latPadding = Math.max((north - south) * 0.18, 0.018);
  const lngPadding = Math.max((east - west) * 0.18, 0.018);

  return `https://www.openstreetmap.org/export/embed.html?bbox=${west - lngPadding}%2C${south - latPadding}%2C${east + lngPadding}%2C${north + latPadding}&layer=mapnik`;
}

function psychologistMapPoint(psychologist: DirectoryPsychologist, index: number, total: number) {
  const lat = Number(psychologist.consultorio_latitud);
  const lng = Number(psychologist.consultorio_longitud);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const fallbackAngle = (index / Math.max(1, total)) * Math.PI * 2;
  const pointLat = hasCoords ? lat : guadalajaraReference.lat + Math.sin(fallbackAngle) * 0.035;
  const pointLng = hasCoords ? lng : guadalajaraReference.lng + Math.cos(fallbackAngle) * 0.045;
  const left = ((pointLng - defaultMapBounds.west) / (defaultMapBounds.east - defaultMapBounds.west)) * 100;
  const top = ((defaultMapBounds.north - pointLat) / (defaultMapBounds.north - defaultMapBounds.south)) * 100;

  return {
    left: `${Math.min(94, Math.max(6, left))}%`,
    top: `${Math.min(92, Math.max(8, top))}%`,
    hasCoords,
  };
}

function PsychologistPublicProfile({
  psychologist,
  onBack,
}: {
  psychologist: DirectoryPsychologist;
  onBack: () => void;
}) {
  const name = fullName(psychologist);
  const badge = planBadge(psychologist.plan_codigo);
  const BadgeIcon = badge.icon;
  const whatsapp = whatsappUrl(psychologist);
  const mail = emailUrl(psychologist);
  const rating = Number(psychologist.calificacion_promedio || 0);
  const specialties = psychologist.especialidades?.length ? psychologist.especialidades : ["Ansiedad", "Estrés", "Autoestima"];
  const methods = [psychologist.enfoque_principal, ...specialties.slice(0, 3)].filter(Boolean);
  const officePhotos = psychologist.consultorio_fotos_urls || [];
  const primaryService = publicServices(psychologist)[0];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2">
        <ArrowLeft className="w-4 h-4" />
        Volver al directorio
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-6">
          <Card className="border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-[#062F32] via-[#0B5558] to-primary p-6 md:p-8 text-white">
                <div className="flex flex-col md:flex-row gap-6">
                  <Avatar className="w-36 h-36 ring-4 ring-white/20 shadow-2xl">
                    <AvatarImage src={psychologist.foto_perfil_url || undefined} />
                    <AvatarFallback className="bg-white text-primary text-4xl">{initials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={badge.className}>
                        <BadgeIcon className="w-3 h-3 mr-1" />
                        {badge.label}
                      </Badge>
                      {psychologist.verificado && (
                        <Badge className="bg-white/15 text-white border-white/20">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verificado por MindCare
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl md:text-4xl tracking-tight mb-2">{name}</h1>
                    <p className="text-white/80 text-lg mb-4">
                      {psychologist.enfoque_principal || psychologist.especialidades?.[0] || "Psicólogo profesional"}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/85">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-[#FFB74D] text-[#FFB74D]" />
                        {rating > 0 ? rating.toFixed(1) : "Nuevo"} · {psychologist.total_resenas || 0} reseñas verificadas
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {psychologist.anos_experiencia || "Experiencia"} años
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        {readableModalities(psychologist.modalidades)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {approximateLocation(psychologist)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl text-foreground mb-2">Consultorio</h2>
              <p className="text-muted-foreground mb-5">
                Fotos del espacio donde se atiende consulta presencial. Si el profesional atiende en línea, esta sección puede mostrar su marca o espacio de trabajo.
              </p>
              {officePhotos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {officePhotos.slice(0, 6).map((photo, index) => (
                    <div key={`${photo}-${index}`} className={index === 0 ? "md:col-span-2 md:row-span-2" : ""}>
                      <img
                        src={photo}
                        alt={`Consultorio de ${name}`}
                        className="h-full min-h-[170px] w-full rounded-2xl object-cover border border-border"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {["Sala de espera", "Consultorio", "Espacio terapéutico"].map((label, index) => (
                    <div
                      key={label}
                      className={index === 0
                        ? "md:col-span-2 min-h-[250px] rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 flex flex-col justify-end"
                        : "min-h-[170px] rounded-2xl border border-dashed border-border bg-muted/40 p-5 flex flex-col justify-end"}
                    >
                      <p className="text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">Foto por publicar</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 md:p-8 space-y-5">
              <h2 className="text-2xl text-foreground">Sobre mí</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  {psychologist.biografia || "Acompaño procesos terapéuticos desde un espacio profesional, cálido y confidencial. Mi objetivo es ayudarte a entender lo que estás viviendo, construir herramientas y avanzar con mayor claridad."}
                </p>
                <p>
                  Si estás atravesando ansiedad, estrés, conflictos personales, cambios importantes o quieres iniciar un proceso de autoconocimiento, puedes contactarme para resolver dudas y revisar si mi enfoque conecta con lo que necesitas.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 md:p-8">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-primary">Servicios</p>
                  <h2 className="text-2xl text-foreground">Opciones de atención</h2>
                </div>
                <p className="text-sm text-muted-foreground">{readableModalities(psychologist.modalidades)}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {publicServices(psychologist).map((service, index) => (
                  <div key={`${service.nombre}-${index}`} className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg text-foreground">{service.nombre}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {service.descripcion || "Consulta profesional personalizada."}
                        </p>
                      </div>
                      <div className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                        {currency(service.precio_centavos)}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-background px-3 py-1">{service.duracion_minutos || 50} min</span>
                      <span className="rounded-full bg-background px-3 py-1">{readableServiceModality(service.modalidad)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-2xl text-foreground mb-4">Cualificaciones</h2>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-foreground">{psychologist.verificado ? "Perfil verificado por MindCare" : "Perfil registrado en MindCare"}</p>
                      <p className="text-sm text-muted-foreground">Validación de cuenta, contacto y datos profesionales.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <GraduationCap className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-foreground">Cédula profesional</p>
                      <p className="text-sm text-muted-foreground">{psychologist.cedula_profesional || "Pendiente de publicar"}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Award className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-foreground">Experiencia profesional</p>
                      <p className="text-sm text-muted-foreground">{psychologist.anos_experiencia ? `${psychologist.anos_experiencia} años de experiencia` : "Por actualizar"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-2xl text-foreground mb-4">Especialidades y experiencia</h2>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <Badge key={specialty} variant="outline" className="bg-card py-1.5">{specialty}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg text-foreground mb-3">Métodos de tratamiento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(methods.length ? methods : ["Psicoterapia individual", "Acompañamiento emocional"]).map((method) => (
                    <div key={method} className="flex items-center gap-2 rounded-xl border border-border p-3">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">{method}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl text-foreground mb-5">Sobre el paciente</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border p-4">
                  <UserRound className="w-5 h-5 text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Edad</p>
                  <p className="text-foreground">Adultos, adolescentes o parejas según evaluación</p>
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <Languages className="w-5 h-5 text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Idiomas</p>
                  <p className="text-foreground">Español</p>
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <MapPin className="w-5 h-5 text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p className="text-foreground">{approximateLocation(psychologist)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 md:p-8 pb-4">
                <h2 className="text-2xl text-foreground mb-2">Ubicación aproximada</h2>
                <p className="text-muted-foreground">
                  Por privacidad mostramos solo colonia, ciudad y estado. El pin es aproximado; si no hay coordenadas, se muestra una referencia en Guadalajara.
                </p>
              </div>
              <div className="px-6 md:px-8 pb-6">
                <div className="rounded-2xl border border-border overflow-hidden bg-muted/40">
                  <iframe
                    title={`Mapa aproximado de ${name}`}
                    src={mapUrl(psychologist)}
                    className="w-full h-[320px]"
                    loading="lazy"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {approximateLocation(psychologist)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl text-foreground mb-4">Reseñas verificadas</h2>
              {(psychologist.total_resenas || 0) > 0 ? (
                <div className="rounded-2xl bg-muted/40 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 fill-[#FFB74D] text-[#FFB74D]" />
                    <p className="text-xl text-foreground">{rating.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">basado en {psychologist.total_resenas} reseñas verificadas</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Las reseñas detalladas se mostrarán aquí conforme se publiquen desde pacientes verificados.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Este perfil todavía no tiene reseñas públicas verificadas.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 space-y-4">
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-6 space-y-5">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Da el primer paso</p>
                <h2 className="text-2xl text-foreground">Contacta a {psychologist.nombre}</h2>
              </div>
              <div className="space-y-2">
                <Button asChild disabled={!whatsapp} className="w-full gap-2">
                  <a href={whatsapp || undefined} target="_blank" rel="noreferrer">
                    <MessageCircle className="w-4 h-4" />
                    Enviar WhatsApp
                  </a>
                </Button>
                <Button asChild disabled={!mail} variant="outline" className="w-full gap-2">
                  <a href={mail || undefined}>
                    <Mail className="w-4 h-4" />
                    Enviar correo
                  </a>
                </Button>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
                <p className="text-foreground">Resumen rápido</p>
                <p>{currency(primaryService.precio_centavos)} · {primaryService.duracion_minutos || 50} min</p>
                <p>{readableModalities(psychologist.modalidades)}</p>
                <p>{approximateLocation(psychologist)}</p>
                <p>{psychologist.email || "Correo no publicado"}</p>
                <p>{psychologist.telefono || "Teléfono no publicado"}</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export function PsychologistDirectory({ publicMode = false, onBack, onShowAuth }: PsychologistDirectoryProps) {
  const [psychologists, setPsychologists] = useState<DirectoryPsychologist[]>([]);
  const [selectedPsychologist, setSelectedPsychologist] = useState<DirectoryPsychologist | null>(null);
  const [selectedMapPsychologist, setSelectedMapPsychologist] = useState<DirectoryPsychologist | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedModality, setSelectedModality] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedTherapyType, setSelectedTherapyType] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buildDirectoryPath = (nextPage: number) => {
    const params = new URLSearchParams();
    const arrayContains = (value: string) => `cs.{"${value.replace(/"/g, "")}"}`;
    params.set("select", directorySelect);
    params.set("limit", String(PAGE_SIZE + 1));
    params.set("offset", String((nextPage - 1) * PAGE_SIZE));
    params.set("order", "calificacion_promedio.desc");

    const query = searchTerm.trim();
    if (query) {
      const safeQuery = query.replace(/[(),]/g, " ");
      params.set("or", `(nombre.ilike.*${safeQuery}*,apellido.ilike.*${safeQuery}*,enfoque_principal.ilike.*${safeQuery}*,biografia.ilike.*${safeQuery}*,consultorio_colonia.ilike.*${safeQuery}*)`);
    }
    if (selectedState !== "all") params.set("consultorio_estado", `eq.${selectedState}`);
    if (selectedCity !== "all") params.set("consultorio_municipio", `eq.${selectedCity}`);
    if (selectedSpecialty !== "all") params.append("especialidades", arrayContains(selectedSpecialty));
    if (selectedTopic !== "all") params.append("especialidades", arrayContains(selectedTopic));
    if (selectedModality !== "all") params.set("modalidades", arrayContains(selectedModality));
    if (minPrice) params.set("tarifa_privada_centavos", `gte.${Number(minPrice) * 100}`);
    if (maxPrice) params.append("tarifa_privada_centavos", `lte.${Number(maxPrice) * 100}`);

    return `/v_psicologos_directorio?${params.toString()}`;
  };

  const loadDirectory = async (nextPage = 1) => {
    let active = true;
    setLoading(true);
    setError("");
    try {
      const data = await supabaseRest<DirectoryPsychologist[]>(buildDirectoryPath(nextPage));
      if (!active) return;
      setHasNextPage(data.length > PAGE_SIZE);
      setPsychologists(data.slice(0, PAGE_SIZE));
      setSelectedMapPsychologist(data[0] || null);
    } catch (loadError: any) {
      if (!active) return;
      console.error("Directory load error:", loadError);
      setError(`No se pudo cargar el directorio público. ${loadError?.message || "Revisa que la migración del directorio esté aplicada en Supabase."}`);
    } finally {
      if (active) setLoading(false);
    }
    return () => {
      active = false;
    };
  };

  const runSearch = (nextPage = 1) => {
    setHasSearched(true);
    setPage(nextPage);
    loadDirectory(nextPage);
  };

  useEffect(() => {
    if (hasSearched) runSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedCity, selectedSpecialty, selectedModality, selectedTopic, selectedTherapyType, selectedGender]);

  useEffect(() => {
    if (!hasSearched) return;
    const timeout = window.setTimeout(() => runSearch(1), 450);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, minPrice, maxPrice]);

  const specialties = useMemo(() => {
    const loaded = psychologists.flatMap((psychologist) => psychologist.especialidades || []);
    return Array.from(new Set([...popularSpecialties, ...loaded].filter(Boolean))).sort();
  }, [psychologists]);

  const filteredPsychologists = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return psychologists
      .filter((psychologist) => {
        const searchable = [
          fullName(psychologist),
          psychologist.enfoque_principal || "",
          psychologist.biografia || "",
          approximateLocation(psychologist),
          ...(psychologist.especialidades || []),
        ].join(" ").toLowerCase();
        const matchesSearch = !query || searchable.includes(query);
        const matchesSpecialty = selectedSpecialty === "all" || psychologist.especialidades?.includes(selectedSpecialty);
        const matchesModality = selectedModality === "all" || psychologist.modalidades?.includes(selectedModality);
        const matchesTherapyType = selectedTherapyType === "all" || searchable.includes(selectedTherapyType.toLowerCase());
        return matchesSearch && matchesSpecialty && matchesModality && matchesTherapyType;
      })
      .sort((a, b) => {
        const rankDiff = (planRank[a.plan_codigo || "basico"] ?? 9) - (planRank[b.plan_codigo || "basico"] ?? 9);
        if (rankDiff !== 0) return rankDiff;
        return Number(b.calificacion_promedio || 0) - Number(a.calificacion_promedio || 0);
      });
  }, [psychologists, searchTerm, selectedSpecialty, selectedModality, selectedTherapyType]);

  useEffect(() => {
    setSelectedMapPsychologist(filteredPsychologists[0] || null);
  }, [filteredPsychologists]);

  if (selectedPsychologist) {
    return (
      <div className={publicMode ? "min-h-screen bg-gradient-to-b from-[#F8FFFE] via-white to-[#E0F7FA]" : "space-y-6"}>
        {publicMode && (
          <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-border">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <button className="flex items-center gap-3 text-left" onClick={onBack}>
                <img src={mindcareIsotype} alt="MindCare" className="h-11 w-11 object-contain" />
                <div>
                  <p className="text-lg text-foreground leading-none">MindCare</p>
                  <p className="text-xs text-muted-foreground">Directorio de psicólogos</p>
                </div>
              </button>
              <Button variant="outline" onClick={onShowAuth}>Soy psicólogo</Button>
            </div>
          </header>
        )}
        <main className={publicMode ? "max-w-7xl mx-auto px-6 py-10" : ""}>
          <PsychologistPublicProfile psychologist={selectedPsychologist} onBack={() => setSelectedPsychologist(null)} />
        </main>
      </div>
    );
  }

  return (
    <div className={publicMode ? "min-h-screen bg-gradient-to-b from-[#F8FFFE] via-white to-[#E0F7FA]" : "space-y-6"}>
      {publicMode && (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button className="flex items-center gap-3 text-left" onClick={onBack}>
              <img src={mindcareIsotype} alt="MindCare" className="h-11 w-11 object-contain" />
              <div>
                <p className="text-lg text-foreground leading-none">MindCare</p>
                <p className="text-xs text-muted-foreground">Directorio de psicólogos</p>
              </div>
            </button>
            <Button variant="outline" onClick={onShowAuth}>Soy psicólogo</Button>
          </div>
        </header>
      )}

      <main className={publicMode ? "max-w-7xl mx-auto px-6 py-10 space-y-8" : "space-y-6"}>
        {!hasSearched ? (
          <div className="min-h-[70vh] grid place-items-center">
            <div className="w-full max-w-5xl space-y-8">
              <div className="text-center space-y-4">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Directorio MindCare
                </Badge>
                <h1 className="text-4xl md:text-6xl text-foreground tracking-tight">
                  Encuentra apoyo psicológico cerca de ti
                </h1>
                <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
                  Busca por ciudad, especialidad o motivo de consulta. Cargaremos solo los perfiles más relevantes para que explores sin saturarte.
                </p>
              </div>

              <Card className="border-primary/20 bg-white/90 shadow-xl">
                <CardContent className="p-5 md:p-7 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="Ansiedad, pareja, duelo, estrés laboral..."
                        className="h-14 pl-12 bg-input-background text-base"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") runSearch(1);
                        }}
                      />
                    </div>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="h-14 bg-input-background">
                        <SelectValue placeholder="Ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {popularCities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button className="h-14 px-7 gap-2" onClick={() => runSearch(1)}>
                      <Search className="w-4 h-4" />
                      Buscar
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {concernTopics.slice(0, 6).map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        className="rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                        onClick={() => {
                          setSelectedTopic(topic);
                          setSearchTerm(topic);
                          setHasSearched(true);
                          setPage(1);
                        }}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border bg-white/70">
                  <CardContent className="p-5">
                    <Sparkles className="w-5 h-5 text-primary mb-3" />
                    <p className="text-foreground">Premium primero</p>
                    <p className="text-sm text-muted-foreground">Perfiles con mayor visibilidad aparecen antes en lista y mapa.</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-white/70">
                  <CardContent className="p-5">
                    <ShieldCheck className="w-5 h-5 text-primary mb-3" />
                    <p className="text-foreground">Reseñas verificadas</p>
                    <p className="text-sm text-muted-foreground">Señales claras de confianza para comparar profesionales.</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-white/70">
                  <CardContent className="p-5">
                    <MapPin className="w-5 h-5 text-primary mb-3" />
                    <p className="text-foreground">Explora por zona</p>
                    <p className="text-sm text-muted-foreground">Cambia a mapa para ver pines cercanos y abrir perfiles rápidos.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            {onBack && !publicMode && (
              <Button variant="ghost" onClick={onBack} className="gap-2 mb-4 -ml-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            )}
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              Reseñas verificadas MindCare
            </Badge>
            <h1 className="text-3xl md:text-5xl text-foreground tracking-tight mb-3">
              Encuentra un psicólogo profesional para iniciar tu proceso
            </h1>
            <p className="text-muted-foreground md:text-lg">
              Perfiles públicos de psicólogos registrados en MindCare. Contacta directo por WhatsApp o correo,
              sin crear cuenta.
            </p>
          </div>
          <Card className="border-primary/20 bg-primary/5 lg:min-w-[280px]">
            <CardContent className="p-5">
              <p className="text-3xl text-foreground">{loading ? "..." : filteredPsychologists.length}</p>
              <p className="text-sm text-muted-foreground">profesionales disponibles</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_170px_170px_190px_auto] gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, especialidad o motivo de consulta..."
                  className="pl-10 bg-input-background"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="bg-input-background">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {popularStates.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="bg-input-background">
                  <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {popularCities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="bg-input-background">
                  <SelectValue placeholder="Especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedModality} onValueChange={setSelectedModality}>
                <SelectTrigger className="bg-input-background">
                  <SelectValue placeholder="Modalidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="virtual">En línea</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/30 p-1">
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                  Lista
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    viewMode === "map" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                  onClick={() => setViewMode("map")}
                >
                  <Map className="w-4 h-4" />
                  Mapa
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                className="gap-2"
                onClick={() => setShowAdvancedFilters((current) => !current)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros avanzados
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedState("all");
                  setSelectedCity("all");
                  setSelectedSpecialty("all");
                  setSelectedModality("all");
                  setSelectedTopic("all");
                  setSelectedTherapyType("all");
                  setSelectedGender("all");
                  setMinPrice("");
                  setMaxPrice("");
                  window.setTimeout(() => runSearch(1), 0);
                }}
              >
                Limpiar filtros
              </Button>
            </div>
            {showAdvancedFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 rounded-2xl border border-border bg-muted/20 p-4">
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Tema a tratar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {concernTopics.map((topic) => (
                      <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTherapyType} onValueChange={setSelectedTherapyType}>
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Tipo de terapia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {therapyTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedGender} onValueChange={setSelectedGender} disabled>
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="mujer">Mujer</SelectItem>
                    <SelectItem value="hombre">Hombre</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  placeholder="Precio mínimo"
                  className="bg-input-background"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Precio máximo"
                  className="bg-input-background"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((item) => <Card key={item} className="h-64 animate-pulse bg-muted/40" />)}
          </div>
        ) : filteredPsychologists.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center text-muted-foreground">
              No encontramos psicólogos con esos filtros.
            </CardContent>
          </Card>
        ) : viewMode === "map" ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-[68vh] min-h-[540px] bg-muted">
                  <iframe
                    title="Mapa del directorio MindCare"
                    src={directoryMapUrl(filteredPsychologists)}
                    className="absolute inset-0 h-full w-full border-0 opacity-90 pointer-events-none"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-primary/5" />
                  {filteredPsychologists.map((psychologist, index) => {
                    const point = psychologistMapPoint(psychologist, index, filteredPsychologists.length);
                    const badge = planBadge(psychologist.plan_codigo);
                    const isSelected = selectedMapPsychologist?.id === psychologist.id;
                    return (
                      <button
                        key={psychologist.id}
                        type="button"
                        className={`absolute -translate-x-1/2 -translate-y-full transition-all ${
                          isSelected ? "z-30 scale-110" : "z-20 hover:scale-105"
                        }`}
                        style={{ left: point.left, top: point.top }}
                        onClick={() => setSelectedMapPsychologist(psychologist)}
                        aria-label={`Ver perfil rápido de ${fullName(psychologist)}`}
                      >
                        <span className={`grid h-11 w-11 place-items-center rounded-full shadow-lg ring-4 ${
                          isSelected
                            ? "bg-[#0B5558] text-white ring-[#4DB6AC]/30"
                            : "bg-primary text-primary-foreground ring-white/80"
                        }`}>
                          <MapPin className="w-5 h-5" />
                        </span>
                        {psychologist.plan_codigo === "pro" && (
                          <span className="absolute -right-1 -top-2 rounded-full bg-[#FFB74D] px-1.5 py-0.5 text-[10px] text-[#3E2A00] shadow">
                            {badge.label}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {selectedMapPsychologist && (
                    <div className="absolute left-4 right-4 bottom-4 z-40 mx-auto max-w-xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 ring-2 ring-primary/15">
                          <AvatarImage src={selectedMapPsychologist.foto_perfil_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {initials(fullName(selectedMapPsychologist))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge className={planBadge(selectedMapPsychologist.plan_codigo).className}>
                              {planBadge(selectedMapPsychologist.plan_codigo).label}
                            </Badge>
                            {selectedMapPsychologist.verificado && (
                              <Badge variant="outline" className="text-[#00695C] border-[#80CBC4]">Verificado</Badge>
                            )}
                          </div>
                          <h3 className="truncate text-lg text-foreground">{fullName(selectedMapPsychologist)}</h3>
                          <p className="line-clamp-1 text-sm text-muted-foreground">
                            {selectedMapPsychologist.enfoque_principal || selectedMapPsychologist.especialidades?.[0] || "Psicólogo MindCare"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-[#FFB74D] text-[#FFB74D]" />
                              {Number(selectedMapPsychologist.calificacion_promedio || 0) > 0
                                ? Number(selectedMapPsychologist.calificacion_promedio).toFixed(1)
                                : "Nuevo"}
                            </span>
                            <span>{currency(publicServices(selectedMapPsychologist)[0]?.precio_centavos)}</span>
                            <span>{approximateLocation(selectedMapPsychologist)}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setSelectedPsychologist(selectedMapPsychologist)}
                        >
                          Ver más
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Mapa de profesionales</p>
                  <p className="text-2xl text-foreground">{filteredPsychologists.length} perfiles en tu zona</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selecciona un pin para ver un resumen rápido y abrir el perfil completo.
                  </p>
                </CardContent>
              </Card>
              {filteredPsychologists.slice(0, 6).map((psychologist) => (
                <button
                  key={psychologist.id}
                  type="button"
                  className={`w-full rounded-2xl border p-4 text-left transition hover:border-primary/50 ${
                    selectedMapPsychologist?.id === psychologist.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                  onClick={() => setSelectedMapPsychologist(psychologist)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={psychologist.foto_perfil_url || undefined} />
                      <AvatarFallback className="bg-muted">{initials(fullName(psychologist))}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-foreground">{fullName(psychologist)}</p>
                      <p className="truncate text-sm text-muted-foreground">{approximateLocation(psychologist)}</p>
                    </div>
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredPsychologists.map((psychologist) => {
              const name = fullName(psychologist);
              const badge = planBadge(psychologist.plan_codigo);
              const BadgeIcon = badge.icon;
              const whatsapp = whatsappUrl(psychologist);
              const mail = emailUrl(psychologist);
              const rating = Number(psychologist.calificacion_promedio || 0);
              const isPremium = psychologist.plan_codigo === "pro";
              return (
                <Card
                  key={psychologist.id}
                  className={`relative overflow-hidden transition-all cursor-pointer hover:shadow-xl ${
                    isPremium
                      ? "border-2 border-[#0B5558]/45 bg-gradient-to-br from-white via-white to-[#E0F7FA]/60 shadow-lg shadow-primary/10"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedPsychologist(psychologist)}
                >
                  {isPremium && (
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0B5558] via-primary to-[#80CBC4]" />
                  )}
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-20 h-20 ring-2 ring-primary/15">
                        <AvatarImage src={psychologist.foto_perfil_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={badge.className}>
                            <BadgeIcon className="w-3 h-3 mr-1" />
                            {badge.label}
                          </Badge>
                          {psychologist.verificado && (
                            <Badge variant="outline" className="text-[#00695C] border-[#80CBC4]">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-xl text-foreground truncate">{name}</h2>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {psychologist.enfoque_principal || psychologist.especialidades?.[0] || "Psicología clínica"}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-foreground">
                            <Star className="w-4 h-4 fill-[#FFB74D] text-[#FFB74D]" />
                            {rating > 0 ? rating.toFixed(1) : "Nuevo"}
                          </span>
                          <span className="text-muted-foreground">{psychologist.total_resenas || 0} reseñas verificadas</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {psychologist.biografia || "Perfil profesional registrado en MindCare. Contacta para conocer disponibilidad, enfoque terapéutico y modalidad de atención."}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {(psychologist.especialidades || []).slice(0, 4).map((specialty) => (
                        <Badge key={specialty} variant="outline" className="bg-card">{specialty}</Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                      {publicServices(psychologist).slice(0, 2).map((service, index) => (
                        <div key={`${service.nombre}-${index}`} className="rounded-xl bg-muted/40 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">{readableServiceModality(service.modalidad)}</p>
                              <p className="text-foreground">{service.nombre}</p>
                            </div>
                            <p className="shrink-0 text-foreground">{currency(service.precio_centavos)}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{service.duracion_minutos || 50} min</p>
                        </div>
                      ))}
                      <div className="rounded-xl bg-muted/40 p-3 col-span-2 md:col-span-1">
                        <p className="text-xs text-muted-foreground">Ubicación</p>
                        <p className="text-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {approximateLocation(psychologist)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <Button asChild disabled={!whatsapp} className="flex-1 gap-2" onClick={(event) => event.stopPropagation()}>
                        <a href={whatsapp || undefined} target="_blank" rel="noreferrer">
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      </Button>
                      <Button asChild disabled={!mail} variant="outline" className="flex-1 gap-2" onClick={(event) => event.stopPropagation()}>
                        <a href={mail || undefined}>
                          <Mail className="w-4 h-4" />
                          Correo
                        </a>
                      </Button>
                      <Button variant="ghost" className="flex-1" onClick={() => setSelectedPsychologist(psychologist)}>
                        Ver perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {!loading && filteredPsychologists.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Página {page} · mostrando hasta {PAGE_SIZE} perfiles
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
                disabled={page === 1 || loading}
                onClick={() => runSearch(Math.max(1, page - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!hasNextPage || loading}
                onClick={() => runSearch(page + 1)}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}
