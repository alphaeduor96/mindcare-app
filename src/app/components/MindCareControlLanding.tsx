import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Heart,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Shield,
  Video,
  CheckCircle2,
  ArrowRight,
  Calendar,
  FileText,
  BarChart3,
  Bell,
  Smartphone,
  Zap,
  GraduationCap,
  Star,
} from "lucide-react";

interface MindCareControlLandingProps {
  onEnterApp: () => void;
  onGoToEnterpriseLanding: () => void;
  onShowAuth: () => void;
}

const systemFeatures = [
  {
    icon: Calendar,
    title: "Calendario Inteligente",
    description: "Gestiona tu agenda con vistas mensual/semanal, recordatorios automáticos y sincronización",
    color: "bg-[#7E57C2]",
  },
  {
    icon: Users,
    title: "Expedientes Digitales",
    description: "Crea y administra expedientes de pacientes con notas privadas, historial completo y búsqueda rápida",
    color: "bg-[#9575CD]",
  },
  {
    icon: DollarSign,
    title: "Control Financiero",
    description: "Registra pagos, genera reportes de ingresos, y lleva el control total de tu facturación",
    color: "bg-[#BA68C8]",
  },
  {
    icon: BarChart3,
    title: "Reportes & Métricas",
    description: "Visualiza estadísticas de tu práctica, tendencias de citas y análisis de crecimiento",
    color: "bg-[#AB47BC]",
  },
  {
    icon: Bell,
    title: "Recordatorios Automáticos",
    description: "Sistema de notificaciones para citas, seguimientos y tareas pendientes",
    color: "bg-[#8E24AA]",
  },
  {
    icon: Video,
    title: "Sesiones Virtuales",
    description: "Gestiona citas presenciales y en línea en un solo lugar con enlaces de videollamada",
    color: "bg-[#7B1FA2]",
  },
];

const pricingTiers = [
  {
    range: "0-10",
    citas: "Hasta 10 citas",
    price: "0",
    perAppointment: "Gratis",
    features: [
      "Todas las funciones del sistema",
      "Calendario completo",
      "Gestión de pacientes ilimitada",
      "Reportes básicos",
      "Notificaciones por email",
    ],
    badge: "Ideal para comenzar",
    badgeColor: "bg-[#66BB6A]/10 text-[#66BB6A]",
  },
  {
    range: "11-20",
    citas: "Hasta 20 citas",
    price: "150",
    perAppointment: "$7.50 por cita",
    features: [
      "Todo del plan anterior",
      "Recordatorios automáticos",
      "Reportes avanzados",
      "Notas clínicas ilimitadas",
      "Soporte prioritario",
    ],
    badge: "Más popular",
    badgeColor: "bg-[#7E57C2]/10 text-[#7E57C2]",
    popular: true,
  },
  {
    range: "21-50",
    citas: "Hasta 50 citas",
    price: "250",
    perAppointment: "$5 por cita",
    features: [
      "Todo del plan anterior",
      "Dashboard personalizado",
      "Exportar reportes PDF",
      "Múltiples consultorios",
      "Estadísticas detalladas",
    ],
    badge: "Profesional",
    badgeColor: "bg-[#FF9800]/10 text-[#FF9800]",
  },
  {
    range: "51+",
    citas: "Más de 50 citas",
    price: "500",
    perAppointment: "< $10 por cita",
    features: [
      "Todo del plan anterior",
      "Citas ilimitadas",
      "API de integración",
      "Almacenamiento ampliado",
      "Soporte dedicado",
    ],
    badge: "Alto volumen",
    badgeColor: "bg-[#4DB6AC]/10 text-[#4DB6AC]",
  },
];

const testimonials = [
  {
    name: "Dra. Patricia Hernández",
    specialty: "Psicóloga Clínica",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    text: "MindCare Control cambió mi práctica. Antes llevaba todo en papel y era un caos. Ahora tengo todo digitalizado, organizado y profesional.",
  },
  {
    name: "Dr. Roberto Sánchez",
    specialty: "Terapeuta Familiar",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    rating: 5,
    text: "La gestión de pagos es increíble. Puedo ver exactamente cuánto he facturado cada mes y mis pacientes nunca olvidan pagar gracias a los recordatorios.",
  },
  {
    name: "Lic. Ana Martínez",
    specialty: "Psicóloga Infantil",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 5,
    text: "Empecé con el plan gratis y conforme crecí fui subiendo. El sistema es tan intuitivo que no necesité capacitación. Totalmente recomendado.",
  },
];

export function MindCareControlLanding({
  onEnterApp,
  onGoToEnterpriseLanding,
  onShowAuth,
}: MindCareControlLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3E5F5] to-white">
      {/* Header/Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7E57C2] to-[#9575CD] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl text-foreground">MindCare Control</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestión para Psicólogos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onGoToEnterpriseLanding}
              className="text-muted-foreground hover:text-foreground"
            >
              Para Empresas
            </Button>
            <Button
              onClick={onShowAuth}
              className="bg-[#7E57C2] text-white hover:bg-[#7E57C2]/90 gap-2"
            >
              Ingresar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-[#7E57C2]/10 text-[#7E57C2] px-4 py-2">
                💼 Sistema de Gestión Profesional
              </Badge>
              <h2 className="text-5xl md:text-6xl text-foreground mb-6">
                Tu Consultorio, Organizado y Digital
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Agenda, pacientes, pagos y reportes en un solo lugar. 
                Sistema diseñado específicamente para psicólogos independientes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  onClick={onShowAuth}
                  size="lg"
                  className="bg-[#7E57C2] text-white hover:bg-[#7E57C2]/90 gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Comenzar Gratis
                </Button>
                <Button
                  onClick={onShowAuth}
                  variant="outline"
                  size="lg"
                  className="border-[#7E57C2] text-[#7E57C2] hover:bg-[#7E57C2]/5"
                >
                  Iniciar Sesión
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#66BB6A]" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#66BB6A]" />
                  <span>Cancela cuando quieras</span>
                </div>
              </div>
            </div>
            
            {/* Dashboard Preview */}
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-[#7E57C2]/20 to-[#9575CD]/20 p-6 backdrop-blur">
                {/* Main Dashboard Card */}
                <Card className="border-2 border-[#7E57C2]/20 bg-white shadow-2xl overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#7E57C2] to-[#9575CD] p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Panel de Control</p>
                          <p className="text-xs opacity-75">Miércoles, 15 Oct 2025</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <Heart className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-b from-[#7E57C2]/5 to-transparent">
                      <div className="bg-white rounded-lg p-3 border border-[#7E57C2]/10 text-center">
                        <Calendar className="w-5 h-5 text-[#7E57C2] mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground mb-1">Hoy</p>
                        <p className="text-lg text-foreground">5</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-[#66BB6A]/10 text-center">
                        <Users className="w-5 h-5 text-[#66BB6A] mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground mb-1">Pacientes</p>
                        <p className="text-lg text-foreground">34</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-[#FF9800]/10 text-center">
                        <DollarSign className="w-5 h-5 text-[#FF9800] mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground mb-1">Mes</p>
                        <p className="text-lg text-foreground">$12K</p>
                      </div>
                    </div>

                    {/* Appointments Section */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#7E57C2]" />
                          <p className="text-sm text-foreground">Citas de Hoy</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          5 programadas
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {[
                          { time: "10:00", name: "Ana María G.", status: "Confirmada" },
                          { time: "12:00", name: "Luis H.", status: "En espera" },
                        ].map((apt, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-2 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#7E57C2]/10 flex items-center justify-center flex-shrink-0">
                              <Users className="w-4 h-4 text-[#7E57C2]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground truncate">
                                {apt.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {apt.time} AM
                              </p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-[#66BB6A] flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="p-4 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-3">
                        Acciones Rápidas
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-xs h-auto py-2 border-[#7E57C2]/20 hover:bg-[#7E57C2]/5"
                        >
                          <Users className="w-3 h-3" />
                          Nuevo Paciente
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-xs h-auto py-2 border-[#FF9800]/20 hover:bg-[#FF9800]/5"
                        >
                          <DollarSign className="w-3 h-3" />
                          Registrar Pago
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-xs h-auto py-2 border-[#42A5F5]/20 hover:bg-[#42A5F5]/5"
                        >
                          <Bell className="w-3 h-3" />
                          Recordatorios
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-xs h-auto py-2 border-[#66BB6A]/20 hover:bg-[#66BB6A]/5"
                        >
                          <BarChart3 className="w-3 h-3" />
                          Ver Reportes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Floating notification badge */}
                <div className="absolute -top-2 -right-2 bg-[#FF9800] text-white rounded-full p-3 shadow-xl animate-pulse">
                  <Bell className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "2,000+", label: "Psicólogos Activos" },
              { value: "50K+", label: "Citas Gestionadas" },
              { value: "4.9/5", label: "Calificación" },
              { value: "99%", label: "Uptime" },
            ].map((stat, index) => (
              <Card key={index} className="border-border bg-white text-center">
                <CardContent className="p-6">
                  <p className="text-4xl text-[#7E57C2] mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-[#7E57C2]/10 text-[#7E57C2] px-4 py-2">
              ⚡ Funcionalidades Completas
            </Badge>
            <h2 className="text-4xl text-foreground mb-4">
              Todo lo que Necesitas en un Solo Lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Diseñado específicamente para las necesidades de psicólogos profesionales
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemFeatures.map((feature, index) => (
              <Card
                key={index}
                className="border-[#7E57C2]/20 bg-white hover:shadow-xl transition-all"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.color} bg-opacity-10 flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-[#7E57C2]" />
                  </div>
                  <h3 className="text-lg text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#7E57C2]/5 via-white to-[#7E57C2]/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-[#7E57C2]/10 text-[#7E57C2] px-4 py-2">
              💰 Precios Transparentes
            </Badge>
            <h2 className="text-4xl text-foreground mb-4">
              Paga Solo por lo que Usas
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comienza gratis y escala conforme crece tu práctica. Sin contratos ni permanencias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={`border-2 bg-white relative overflow-hidden transition-all hover:shadow-2xl ${
                  tier.popular ? "border-[#7E57C2] scale-[1.02]" : "border-border"
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-[#7E57C2] text-white px-4 py-1 text-sm">
                    {tier.badge}
                  </div>
                )}
                <CardContent className="p-6">
                  <Badge variant="secondary" className={`${tier.badgeColor} mb-4`}>
                    {tier.citas}
                  </Badge>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-5xl text-foreground">${tier.price}</span>
                      <span className="text-muted-foreground text-sm">MXN/mes</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{tier.perAppointment}</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={onShowAuth}
                    className={`w-full ${
                      tier.popular
                        ? "bg-[#7E57C2] text-white hover:bg-[#7E57C2]/90"
                        : ""
                    }`}
                    variant={tier.popular ? "default" : "outline"}
                  >
                    {tier.price === "0" ? "Comenzar Gratis" : "Elegir Plan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enterprise CTA */}
          <Card className="max-w-4xl mx-auto border-2 border-[#FF9800]/20 bg-gradient-to-br from-white to-[#FF9800]/5 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-10">
                  <Badge className="mb-4 bg-[#FF9800]/10 text-[#FF9800]">
                    🎯 ¿Buscas Más Pacientes?
                  </Badge>
                  <h3 className="text-2xl text-foreground mb-3">
                    Únete a MindCare Afiliado
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Como psicólogo afiliado a nuestra red, obtienes:
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        <strong>Sistema 100% gratis</strong> sin límites de citas
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        <strong>Referidos constantes</strong> de empresas afiliadas
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        <strong>Perfil público</strong> en nuestro directorio
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">
                        <strong>Consultorios premium</strong> disponibles en GDL
                      </span>
                    </li>
                  </ul>
                  <Button
                    onClick={onGoToEnterpriseLanding}
                    size="lg"
                    className="w-full bg-[#FF9800] text-white hover:bg-[#FF9800]/90 gap-2"
                  >
                    <GraduationCap className="w-5 h-5" />
                    Conocer MindCare Afiliado
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Solo el 8% de aplicantes son aceptados
                  </p>
                </div>
                <div className="bg-gradient-to-br from-[#FF9800]/10 to-[#FF9800]/5 p-8 lg:p-10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-12 h-12 text-[#FF9800]" />
                    </div>
                    <p className="text-foreground mb-2">
                      Red de Psicólogos Elite
                    </p>
                    <p className="text-sm text-muted-foreground">
                      500+ empresas confían en nosotros
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl text-foreground mb-4">
              Lo que Dicen Nuestros Usuarios
            </h2>
            <p className="text-xl text-muted-foreground">
              Psicólogos que ya transformaron su práctica
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-[#FFB74D] text-[#FFB74D]"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "{testimonial.text}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#7E57C2] to-[#9575CD] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl mb-6">
            Empieza a Organizar tu Práctica Hoy
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Únete a más de 2,000 psicólogos que ya usan MindCare Control
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onShowAuth}
              size="lg"
              className="bg-white text-[#7E57C2] hover:bg-white/90 gap-2"
            >
              <Zap className="w-5 h-5" />
              Comenzar Gratis - Sin Tarjeta
            </Button>
            <Button
              onClick={onGoToEnterpriseLanding}
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10"
            >
              Ver MindCare Empresas
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-6">
            ✓ Gratis hasta 10 citas/mes • ✓ Sin contratos • ✓ Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 MindCare. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
