import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  TrendingUp,
  Users,
  Heart,
  Shield,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  Building2,
  MapPin,
  Award,
  Video,
  GraduationCap,
} from "lucide-react";

interface LandingPageProps {
  onEnterApp: () => void;
  onApplyAsPsychologist: () => void;
  onGoToControlLanding: () => void;
}

const benefits = [
  {
    icon: TrendingUp,
    title: "Incrementa la Productividad",
    description: "35% de reducción en ausentismo y 28% de mejora en productividad laboral.",
    color: "bg-[#66BB6A]",
  },
  {
    icon: Users,
    title: "Retén el Talento",
    description: "Reduce hasta 22% la rotación de personal con programas de bienestar integral.",
    color: "bg-[#42A5F5]",
  },
  {
    icon: Heart,
    title: "Empleados Más Felices",
    description: "4.8/5 de satisfacción promedio. Empleados más comprometidos y motivados.",
    color: "bg-[#FF9800]",
  },
  {
    icon: Shield,
    title: "Cumple Normativas",
    description: "Cumplimiento con NOM-035 y mejora tu reputación como empleador responsable.",
    color: "bg-[#7E57C2]",
  },
  {
    icon: DollarSign,
    title: "100% Deducible de ISR",
    description: "Todas las prestaciones de salud mental son completamente deducibles de impuestos.",
    color: "bg-[#81C784]",
  },
  {
    icon: Clock,
    title: "Implementación Rápida",
    description: "Tu equipo con acceso a psicólogos certificados en menos de 48 horas.",
    color: "bg-[#4DB6AC]",
  },
];

const stats = [
  { value: "500+", label: "Empresas Confían en Nosotros" },
  { value: "42", label: "Psicólogos Especializados" },
  { value: "25+", label: "Consultorios en GDL" },
  { value: "4.8/5", label: "Satisfacción Promedio" },
];

const testimonials = [
  {
    company: "TechCorp Solutions",
    logo: "🚀",
    testimonial: "Implementar este programa fue la mejor decisión. Nuestros empleados reportan 85% menos estrés y la productividad aumentó notablemente.",
    author: "María González",
    position: "Directora de RH",
    rating: 5,
  },
  {
    company: "Innovate Industries",
    logo: "💡",
    testimonial: "La inversión se recuperó en 6 meses. Menos faltas, más compromiso y un equipo genuinamente feliz. Además, la deducción fiscal es un gran plus.",
    author: "Carlos Ramírez",
    position: "CEO",
    rating: 5,
  },
  {
    company: "Global Logistics",
    logo: "🌍",
    testimonial: "La opción presencial en Guadalajara y en línea nos permitió cubrir a todo nuestro equipo, tanto local como remoto. Excelente red de consultorios.",
    author: "Ana Torres",
    position: "VP de Talento",
    rating: 5,
  },
];

const pricingTiers = [
  {
    range: "10-50",
    name: "Pequeñas Empresas",
    pricePerEmployee: "450",
    savings: "Base",
    features: [
      "Psicólogos especializados verificados",
      "Presencial en GDL o 100% en línea",
      "25+ consultorios en ZMG",
      "Dashboard de uso",
      "Soporte por email",
      "4 sesiones/empleado/año",
    ],
  },
  {
    range: "51-200",
    name: "Medianas Empresas",
    pricePerEmployee: "380",
    savings: "Ahorro 16%",
    features: [
      "Todo lo del plan anterior",
      "Elección de consultorio preferido",
      "Reportes de bienestar",
      "Análisis por departamento",
      "Soporte prioritario",
      "Consultor asignado",
    ],
    popular: true,
  },
  {
    range: "201+",
    name: "Grandes Corporativos",
    pricePerEmployee: "290",
    savings: "Ahorro 36%",
    features: [
      "Todo lo del plan anterior",
      "Consultor dedicado exclusivo",
      "Workshops presenciales en GDL",
      "Reportes ejecutivos mensuales",
      "Acceso prioritario a consultorios",
      "Sesiones adicionales disponibles",
    ],
  },
];

export function LandingPage({ onEnterApp, onApplyAsPsychologist, onGoToControlLanding }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FFFE] to-white">
      {/* Header/Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#26A69A] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl text-foreground">MindCare</h1>
              <p className="text-xs text-muted-foreground">Salud Mental Empresarial</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onApplyAsPsychologist}
              className="border-[#7E57C2] text-[#7E57C2] hover:bg-[#7E57C2]/5 gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Únete a la Red
            </Button>
            <Button
              onClick={onEnterApp}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              Ingresar al Panel
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1590649880765-91b1956b8276?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMG9mZmljZSUyMHRlYW0lMjBjb2xsYWJvcmF0aW9ufGVufDF8fHx8MTc2MTEwODEwMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Equipo feliz colaborando"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-primary/20" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <Badge className="mb-6 bg-primary/10 text-primary px-4 py-2 shadow-sm">
              🏆 Programa de Bienestar #1 en México
            </Badge>
            <h1 className="text-5xl md:text-6xl text-foreground mb-6 leading-tight drop-shadow-sm">
              Empleados Felices,
              <br />
              <span className="bg-gradient-to-r from-primary to-[#66BB6A] bg-clip-text text-transparent">
                Empresas Exitosas
              </span>
            </h1>
            <p className="text-xl text-foreground/90 mb-8 leading-relaxed drop-shadow-sm">
              Red exclusiva de psicólogos especializados en Guadalajara.
              <br />
              Sesiones presenciales en +25 consultorios o 100% en línea.
            </p>
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-foreground/80 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Presencial en GDL</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2 text-foreground/80 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <Video className="w-5 h-5 text-primary" />
                <span>Sesiones en Línea</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={onEnterApp}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 gap-2 shadow-lg hover:shadow-xl transition-shadow"
              >
                Comenzar Ahora
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md">
                Solicitar Demo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <Card key={index} className="border-border bg-white/95 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <p className="text-4xl text-primary mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Guarantee Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/5 to-[#66BB6A]/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-primary/10 text-primary px-4 py-2">
              ✨ Nuestra Garantía de Calidad
            </Badge>
            <h2 className="text-4xl text-foreground mb-4">
              Solo Psicólogos de Élite
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A diferencia de otras plataformas, cada psicólogo en nuestra red ha pasado
              por un riguroso proceso de selección y verificación.
            </p>
            <Button
              onClick={onApplyAsPsychologist}
              variant="outline"
              className="mt-6 border-[#7E57C2] text-[#7E57C2] hover:bg-[#7E57C2]/5 gap-2"
            >
              <GraduationCap className="w-5 h-5" />
              ¿Eres Psicólogo? Aplica Aquí
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 border-primary/20 bg-white hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl text-foreground mb-3">100% Certificados</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Todos nuestros psicólogos cuentan con cédula profesional vigente y
                  certificaciones especializadas verificadas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-white hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#66BB6A]/10 flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="w-8 h-8 text-[#66BB6A]" />
                </div>
                <h3 className="text-xl text-foreground mb-3">Especialistas Únicamente</h3>
                <p className="text-muted-foreground leading-relaxed">
                  No hay psicólogos generales. Cada profesional tiene áreas de
                  especialización definidas y experiencia comprobable.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-white hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#4DB6AC]/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-[#4DB6AC]" />
                </div>
                <h3 className="text-xl text-foreground mb-3">Proceso Riguroso</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Solo el 8% de los aplicantes son aceptados. Evaluamos experiencia,
                  referencias y habilidades clínicas.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-white">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl text-foreground mb-4">
                    Red de Consultorios en Guadalajara
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Más de 25 ubicaciones estratégicas en toda la Zona Metropolitana
                    de Guadalajara para que tus empleados encuentren un consultorio
                    cerca de casa o trabajo.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-foreground">Zona Centro</p>
                        <p className="text-xs text-muted-foreground">8 consultorios</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-foreground">Zapopan</p>
                        <p className="text-xs text-muted-foreground">7 consultorios</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-foreground">Tlaquepaque</p>
                        <p className="text-xs text-muted-foreground">5 consultorios</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-foreground">Tonalá</p>
                        <p className="text-xs text-muted-foreground">5 consultorios</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-[400px] h-[300px] bg-accent/30 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0">
                    <img 
                      src="https://images.unsplash.com/photo-1717700300409-9cfe51e29671?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXhpY28lMjBtYXAlMjBtb2Rlcm4lMjBpbGx1c3RyYXRpb258ZW58MXx8fHwxNzYwNDc5NTEwfDA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Mapa de México - Zona Guadalajara"
                      className="w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-[#66BB6A]/30" />
                    {/* Pines de ubicaciones de consultorios en Guadalajara */}
                    <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-full animate-bounce" style={{ left: "35%", top: "45%", animationDelay: "0s", animationDuration: "2s" }}>
                      <MapPin className="w-10 h-10 text-primary drop-shadow-2xl fill-white" />
                    </div>
                    <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-full animate-bounce" style={{ left: "52%", top: "38%", animationDelay: "0.2s", animationDuration: "2s" }}>
                      <MapPin className="w-10 h-10 text-primary drop-shadow-2xl fill-white" />
                    </div>
                    <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-full animate-bounce" style={{ left: "48%", top: "55%", animationDelay: "0.4s", animationDuration: "2s" }}>
                      <MapPin className="w-10 h-10 text-primary drop-shadow-2xl fill-white" />
                    </div>
                    <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-full animate-bounce" style={{ left: "60%", top: "50%", animationDelay: "0.6s", animationDuration: "2s" }}>
                      <MapPin className="w-10 h-10 text-primary drop-shadow-2xl fill-white" />
                    </div>
                    <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-full animate-bounce" style={{ left: "42%", top: "48%", animationDelay: "0.8s", animationDuration: "2s" }}>
                      <MapPin className="w-10 h-10 text-primary drop-shadow-2xl fill-white" />
                    </div>
                    <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-full animate-bounce" style={{ left: "55%", top: "42%", animationDelay: "1s", animationDuration: "2s" }}>
                      <MapPin className="w-10 h-10 text-primary drop-shadow-2xl fill-white" />
                    </div>
                    <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-full animate-bounce" style={{ left: "38%", top: "58%", animationDelay: "1.2s", animationDuration: "2s" }}>
                      <MapPin className="w-10 h-10 text-primary drop-shadow-2xl fill-white" />
                    </div>
                    <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-full animate-bounce" style={{ left: "65%", top: "45%", animationDelay: "1.4s", animationDuration: "2s" }}>
                      <MapPin className="w-10 h-10 text-primary drop-shadow-2xl fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6 bg-white p-4 rounded-lg shadow-lg">
                    <p className="text-foreground">25+ Ubicaciones</p>
                    <p className="text-sm text-muted-foreground">ZMG, Jalisco</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Office Gallery Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-primary/10 text-primary px-4 py-2">
              🏥 Consultorios de Alta Calidad
            </Badge>
            <h2 className="text-4xl text-foreground mb-4">
              Espacios Amplios, Modernos y Profesionales
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Más de 25 consultorios cuidadosamente seleccionados en toda la ZMG.
              Espacios diseñados para tu privacidad, comodidad y bienestar.
            </p>
          </div>

          {/* Grid de 6 fotos - 2 grandes, 4 medianas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Foto grande 1 - ocupa 2 columnas */}
            <Card className="overflow-hidden border-border bg-white hover:shadow-xl transition-all group md:col-span-2">
              <div className="relative h-80 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1700142360825-d21edc53c8db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0aGVyYXB5JTIwcm9vbXxlbnwxfHx8fDE3NjA0MzgxMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Consultorio Moderno y Espacioso"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-lg opacity-95">Consultorio Moderno y Espacioso</p>
                  <p className="text-sm opacity-80">Zona Zapopan - 45m²</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs">Luz Natural</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs">Insonorizado</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Foto mediana 1 */}
            <Card className="overflow-hidden border-border bg-white hover:shadow-xl transition-all group">
              <div className="relative h-80 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1754294437684-7898b3701ac7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwc3ljaG9sb2d5JTIwdGhlcmFweSUyMG9mZmljZXxlbnwxfHx8fDE3NjA0ODg1MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Sala de Terapia Profesional"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-base opacity-95">Sala de Terapia Profesional</p>
                  <p className="text-xs opacity-80">Zona Centro</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Foto mediana 2 */}
            <Card className="overflow-hidden border-border bg-white hover:shadow-xl transition-all group">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1752650732081-8f61e81813ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Vuc2VsaW5nJTIwb2ZmaWNlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwNDg4NTA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Consultorio de Terapia Psicológica"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm opacity-95">Consultorio de Terapia</p>
                  <p className="text-xs opacity-80">Zona Providencia</p>
                </div>
              </div>
            </Card>

            {/* Foto grande 2 - ocupa 2 columnas */}
            <Card className="overflow-hidden border-border bg-white hover:shadow-xl transition-all group md:col-span-2">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1719903466697-ee9437c8572f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwc3ljaG9sb2dpc3QlMjBjb25zdWx0YXRpb24lMjByb29tfGVufDF8fHx8MTc2MDQ4ODUwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Sala de Consulta Psicológica"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <p className="text-lg opacity-95">Sala de Consulta Psicológica</p>
                  <p className="text-sm opacity-80">Zona Chapalita - Ambiente relajante y acogedor</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Fotos adicionales */}
            <Card className="overflow-hidden border-border bg-white hover:shadow-xl transition-all group">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1754294437684-7898b3701ac7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVyYXB5JTIwd2FpdGluZyUyMHJvb218ZW58MXx8fHwxNzYwNDg4NTA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Sala de Espera Psicológica"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-base opacity-95">Sala de Espera Profesional</p>
                  <p className="text-xs opacity-80">Zona Tlaquepaque</p>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-border bg-white hover:shadow-xl transition-all group">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1754294437684-7898b3701ac7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW50YWwlMjBoZWFsdGglMjBjbGluaWN8ZW58MXx8fHwxNzYwNDg4NTA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Clínica de Salud Mental"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-base opacity-95">Clínica de Salud Mental</p>
                  <p className="text-xs opacity-80">Zona Andares</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-accent/20 rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
              <h4 className="text-foreground mb-2">Privacidad Total</h4>
              <p className="text-sm text-muted-foreground">
                Salas insonorizadas y acceso discreto
              </p>
            </div>
            <div className="text-center p-6 bg-accent/20 rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
              <h4 className="text-foreground mb-2">Ubicaciones Estratégicas</h4>
              <p className="text-sm text-muted-foreground">
                Cerca de casa o trabajo en toda la ZMG
              </p>
            </div>
            <div className="text-center p-6 bg-accent/20 rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
              <h4 className="text-foreground mb-2">Ambientes Relajantes</h4>
              <p className="text-sm text-muted-foreground">
                Diseñados para tu comodidad y bienestar
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-foreground mb-4">
              ¿Por Qué Invertir en Salud Mental?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Los beneficios van más allá del bienestar. Es una inversión inteligente
              con retorno medible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-border bg-white hover:shadow-xl transition-all hover:scale-[1.02]">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-xl ${benefit.color}/10 flex items-center justify-center mb-6`}>
                      <Icon className={`w-7 h-7 text-${benefit.color.replace('bg-', '')}`} style={{ color: benefit.color.includes('#') ? benefit.color : undefined }} />
                    </div>
                    <h3 className="text-xl text-foreground mb-3">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-foreground mb-4">
              Empresas que ya Transformaron su Cultura
            </h2>
            <p className="text-xl text-muted-foreground">
              Descubre cómo otras organizaciones están viendo resultados reales
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border bg-white hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                      {testimonial.logo}
                    </div>
                    <div>
                      <p className="text-foreground">{testimonial.company}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#FFB74D] text-[#FFB74D]" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.testimonial}"
                  </p>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-foreground">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.position}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 px-6 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-[#FF9800]/10 text-[#FF9800] px-4 py-2">
              💰 Precios Escalonados
            </Badge>
            <h2 className="text-4xl text-foreground mb-4">
              Más Empleados = Menor Costo por Persona
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Planes diseñados para crecer contigo. Entre más empleados, mejor el precio unitario.
            </p>
          </div>

          {/* Pricing Table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={`border-2 bg-white relative overflow-hidden transition-all hover:shadow-2xl ${
                  tier.popular ? "border-primary shadow-xl scale-[1.02]" : "border-border"
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm">
                    Más Popular
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">
                        {tier.range} empleados
                      </span>
                      {tier.savings !== "Base" && (
                        <Badge variant="secondary" className="bg-[#66BB6A]/10 text-[#66BB6A] text-xs">
                          {tier.savings}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-2xl text-foreground mb-1">{tier.name}</h3>
                  </div>

                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl text-primary">${tier.pricePerEmployee}</span>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">MXN</span>
                        <span className="text-xs text-muted-foreground">por empleado/mes</span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#81C784] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full ${
                      tier.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    }`}
                    variant={tier.popular ? "default" : "outline"}
                    onClick={onEnterApp}
                  >
                    Solicitar Cotización
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricing Calculator Preview */}
          <Card className="max-w-4xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl text-foreground mb-2">
                  Calcula tu Inversión Mensual
                </h3>
                <p className="text-muted-foreground">
                  Ejemplo con diferentes tamaños de equipo
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-border text-center">
                  <p className="text-sm text-muted-foreground mb-2">Equipo de</p>
                  <p className="text-3xl text-foreground mb-2">30</p>
                  <p className="text-xs text-muted-foreground mb-4">empleados</p>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Inversión mensual</p>
                    <p className="text-2xl text-primary">$13,500</p>
                    <p className="text-xs text-muted-foreground mt-1">$450/empleado</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border-2 border-primary text-center">
                  <Badge className="mb-2 bg-primary text-primary-foreground">Ahorro 16%</Badge>
                  <p className="text-sm text-muted-foreground mb-2">Equipo de</p>
                  <p className="text-3xl text-foreground mb-2">100</p>
                  <p className="text-xs text-muted-foreground mb-4">empleados</p>
                  <div className="pt-4 border-t border-primary/20">
                    <p className="text-sm text-muted-foreground">Inversión mensual</p>
                    <p className="text-2xl text-primary">$38,000</p>
                    <p className="text-xs text-muted-foreground mt-1">$380/empleado</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-border text-center">
                  <Badge className="mb-2 bg-[#66BB6A]/10 text-[#66BB6A]">Ahorro 36%</Badge>
                  <p className="text-sm text-muted-foreground mb-2">Equipo de</p>
                  <p className="text-3xl text-foreground mb-2">300</p>
                  <p className="text-xs text-muted-foreground mb-4">empleados</p>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Inversión mensual</p>
                    <p className="text-2xl text-primary">$87,000</p>
                    <p className="text-xs text-muted-foreground mt-1">$290/empleado</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  💡 Todos los planes incluyen 4 sesiones anuales por empleado + acceso a consultorios premium
                </p>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  onClick={onEnterApp}
                >
                  <DollarSign className="w-5 h-5" />
                  Obtener Cotización Personalizada
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tax Deduction Note */}
          <div className="mt-8 text-center">
            <Card className="max-w-2xl mx-auto border-[#66BB6A]/20 bg-gradient-to-br from-[#66BB6A]/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#66BB6A]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#66BB6A]" />
                  </div>
                  <div className="text-left">
                    <p className="text-foreground">
                      <strong>100% Deducible de ISR</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Todas las prestaciones de salud mental califican como deducción fiscal
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>



      {/* Employee Proposal Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#42A5F5]/5 via-white to-[#42A5F5]/10">
        <div className="max-w-5xl mx-auto">
          <Card className="border-2 border-[#42A5F5]/20 bg-white shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left side - Content */}
                <div className="p-8 lg:p-12">
                  <Badge className="mb-6 bg-[#42A5F5]/10 text-[#42A5F5] px-4 py-2">
                    💼 ¿Trabajas en una Empresa?
                  </Badge>
                  <h2 className="text-3xl lg:text-4xl text-foreground mb-4">
                    Propón este Beneficio a tu Empresa
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    Ayuda a mejorar el bienestar de todo tu equipo. Te damos las herramientas
                    para presentar MindCare a tu departamento de Recursos Humanos.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#42A5F5]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-[#42A5F5]" />
                      </div>
                      <div>
                        <h4 className="text-foreground mb-1">Kit de Presentación Gratis</h4>
                        <p className="text-sm text-muted-foreground">
                          Descarga un PDF ejecutivo con beneficios y ROI para RH
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#42A5F5]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-[#42A5F5]" />
                      </div>
                      <div>
                        <h4 className="text-foreground mb-1">Email Template Listo</h4>
                        <p className="text-sm text-muted-foreground">
                          Plantilla profesional para enviar a tu jefe o RH
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#42A5F5]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-[#42A5F5]" />
                      </div>
                      <div>
                        <h4 className="text-foreground mb-1">Descuento Especial</h4>
                        <p className="text-sm text-muted-foreground">
                          Si tu empresa se une, obtén 3 sesiones gratis adicionales
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      className="bg-[#42A5F5] text-white hover:bg-[#1E88E5] gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      Descargar Kit de Presentación
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-[#42A5F5] text-[#42A5F5] hover:bg-[#42A5F5]/5"
                    >
                      Ver Email Template
                    </Button>
                  </div>

                  <div className="mt-8 p-4 bg-[#42A5F5]/5 rounded-xl border border-[#42A5F5]/20">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-[#42A5F5]">🎁 Incentivo:</strong> Si tu empresa
                      contrata MindCare gracias a tu recomendación, recibirás un bono de
                      3 sesiones completamente gratis para ti.
                    </p>
                  </div>
                </div>

                {/* Right side - Visual/Stats */}
                <div className="bg-gradient-to-br from-[#42A5F5] to-[#1E88E5] p-8 lg:p-12 text-white flex flex-col justify-center">
                  <h3 className="text-2xl mb-8">Por qué tu empresa dirá que SÍ:</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-8 h-8" />
                        <p className="text-3xl">35%</p>
                      </div>
                      <p className="text-sm opacity-90">Menos ausentismo laboral</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-8 h-8" />
                        <p className="text-3xl">100%</p>
                      </div>
                      <p className="text-sm opacity-90">Deducible de ISR</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-8 h-8" />
                        <p className="text-3xl">4.8/5</p>
                      </div>
                      <p className="text-sm opacity-90">Satisfacción de empleados</p>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                    <p className="text-sm opacity-90">
                      "Propuse MindCare a mi empresa y en 2 semanas lo aprobaron. 
                      Ahora todo el equipo tiene acceso."
                    </p>
                    <p className="text-xs opacity-75 mt-2">- Laura M., Analista de Datos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border bg-gradient-to-br from-primary to-[#26A69A] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
            <CardContent className="p-12 relative z-10">
              <div className="text-center">
                <h2 className="text-4xl mb-4">
                  ¿Listo para Transformar tu Empresa?
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  Únete a las 500+ empresas que ya cuidan la salud mental de sus equipos
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={onEnterApp}
                    className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 gap-2"
                  >
                    <Building2 className="w-5 h-5" />
                    Ingresar al Panel
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-white text-white hover:bg-white/10"
                  >
                    Hablar con un Experto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-accent/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#26A69A] flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-foreground">MindCare</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Red exclusiva de psicólogos especializados en Guadalajara.
                <br />
                Sesiones presenciales en +25 consultorios o 100% en línea.
              </p>
            </div>
            <div>
              <h4 className="text-foreground mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Planes</li>
                <li>Red de Psicólogos</li>
                <li>Dashboard Empresarial</li>
                <li>Reportes</li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Acerca de</li>
                <li>Blog</li>
                <li>Casos de Éxito</li>
                <li>Contacto</li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Privacidad</li>
                <li>Términos</li>
                <li>Aviso de Privacidad</li>
                <li>Cookies</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 MindCare. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
