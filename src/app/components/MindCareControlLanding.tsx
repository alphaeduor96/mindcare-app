import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Calendar,
  FileText,
  BarChart3,
  Zap,
  GraduationCap,
  Star,
  Building2,
  Shield,
  UserCheck,
  Wallet,
} from "lucide-react";
import mindcareIsotype from "../../assets/mindcare-isotype.png";
import psychologistDevicesMockup from "../../assets/mindcare-psychologist-devices.png";

interface MindCareControlLandingProps {
  onEnterApp: () => void;
  onGoToEnterpriseLanding: () => void;
  onShowAuth: () => void;
  onShowSignup: () => void;
  onApplyAsPsychologist: () => void;
  onOpenDirectory?: () => void;
}

const systemFeatures = [
  {
    icon: Calendar,
    title: "Agenda profesional",
    description: "Crea citas, repítelas semanalmente, arrástralas en calendario y evita cruces de horario.",
    color: "bg-primary",
  },
  {
    icon: Users,
    title: "Pacientes y saldos",
    description: "Consulta datos clínicos, tarifa sugerida, saldo, pagos y preferencias de comunicación por paciente.",
    color: "bg-[#26A69A]",
  },
  {
    icon: FileText,
    title: "Expedientes claros",
    description: "Organiza documentos y notas por paciente, con vista cómoda y descarga en PDF o Word.",
    color: "bg-[#0B5558]",
  },
  {
    icon: DollarSign,
    title: "Pagos simples",
    description: "Registra ingresos de citas, anticipos y consulta saldos a favor o pendientes sin hojas externas.",
    color: "bg-[#4DB6AC]",
  },
  {
    icon: BarChart3,
    title: "Reportes accionables",
    description: "Revisa lo pagado, lo pendiente y el resumen mensual por paciente con detalle de cada cita.",
    color: "bg-[#80CBC4]",
  },
  {
    icon: Building2,
    title: "Consultorios reales",
    description: "Administra consultorios, define uno principal y úsalo automáticamente al agendar.",
    color: "bg-[#00695C]",
  },
];

const valuePillars = [
  {
    icon: Clock,
    title: "Menos administración",
    description: "Agenda, pagos, saldos y notas viven en el mismo flujo. Menos hojas, chats y recordatorios manuales.",
  },
  {
    icon: UserCheck,
    title: "Más claridad por paciente",
    description: "Cada paciente conserva tarifa, saldo, expediente, pagos y preferencias en un solo lugar.",
  },
  {
    icon: Wallet,
    title: "Dinero bajo control",
    description: "Sabes qué cita está pagada, qué paciente debe y cuánto ingresó en el mes.",
  },
  {
    icon: Shield,
    title: "Pensado para consulta clínica",
    description: "No es un CRM genérico: está diseñado alrededor de citas, expedientes y seguimiento terapéutico.",
  },
];

const dailyFlow = [
  "Revisa tu agenda del día",
  "Crea o mueve citas sin cruces",
  "Consulta expediente antes de sesión",
  "Registra pago y nota clínica",
  "Ve reportes por paciente o mes",
];

const affiliateBenefits = [
  "Sistema 100% gratis sin límite de citas mientras estés afiliado",
  "Referidos de empresas y pacientes dentro del ecosistema MindCare",
  "Perfil profesional visible para nuevas oportunidades",
  "Operación centralizada de agenda, pagos y seguimiento",
];

const pricingTiers = [
  {
    range: "0-10",
    citas: "Hasta 10 citas",
    price: "0",
    perAppointment: "Gratis",
    features: [
      "Agenda y calendario",
      "Pacientes ilimitados",
      "Expedientes clínicos",
      "Pagos e ingresos",
      "Reportes básicos",
    ],
    badge: "Ideal para comenzar",
    badgeColor: "bg-[#4DB6AC]/10 text-[#00695C]",
  },
  {
    range: "11-20",
    citas: "Hasta 20 citas",
    price: "150",
    perAppointment: "$7.50 por cita",
    features: [
      "Todo del plan anterior",
      "Feed iCal para calendario",
      "Reportes avanzados",
      "Notas clínicas ilimitadas",
      "Soporte prioritario",
    ],
    badge: "Más popular",
    badgeColor: "bg-primary/10 text-primary",
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
    badgeColor: "bg-[#0B5558]/10 text-[#0B5558]",
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
    badgeColor: "bg-[#062F32]/10 text-[#062F32]",
  },
];

const testimonials = [
  {
    name: "Dra. Patricia Hernández",
    specialty: "Psicóloga Clínica",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 5,
    text: "MindCare me ayudó a ordenar agenda, pacientes y pagos en un solo flujo. El consultorio se siente mucho más profesional.",
  },
  {
    name: "Dr. Roberto Sánchez",
    specialty: "Terapeuta Familiar",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    rating: 5,
    text: "La parte de pagos y reportes me ahorra muchísimo tiempo. En segundos sé qué paciente pagó, qué debe y qué citas vienen.",
  },
  {
    name: "Lic. Ana Martínez",
    specialty: "Psicóloga Infantil",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 5,
    text: "La agenda y los expedientes son fáciles de usar. Puedo atender, documentar y cobrar sin brincar entre herramientas.",
  },
];

export function MindCareControlLanding({
  onEnterApp,
  onGoToEnterpriseLanding,
  onShowAuth,
  onShowSignup,
  onApplyAsPsychologist,
  onOpenDirectory,
}: MindCareControlLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FFFE] via-white to-[#E0F7FA]">
      {/* Header/Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white/85 backdrop-blur-lg border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={mindcareIsotype} alt="MindCare" className="h-12 w-12 object-contain" />
            <div>
              <p className="text-lg text-foreground leading-none">MindCare</p>
              <p className="text-xs text-muted-foreground">Software para psicólogos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onOpenDirectory}
              className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
            >
              Directorio
            </Button>
            <Button
              variant="ghost"
              onClick={onGoToEnterpriseLanding}
              className="text-muted-foreground hover:text-foreground"
            >
              Para Empresas
            </Button>
            <Button
              variant="outline"
              onClick={onApplyAsPsychologist}
              className="hidden sm:inline-flex border-primary text-primary hover:bg-primary/5 gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Únete a la red
            </Button>
            <Button
              onClick={onShowAuth}
              className="bg-primary text-white hover:bg-primary/90 gap-2"
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
              <Badge className="mb-6 bg-primary/10 text-primary px-4 py-2">
                Software creado para psicólogos
              </Badge>
              <h2 className="text-5xl md:text-6xl text-foreground mb-6">
                Tu consulta en orden, sin perder lo humano
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                MindCare centraliza agenda, pacientes, expedientes, pagos y reportes
                para que administres menos y atiendas mejor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  onClick={onShowSignup}
                  size="lg"
                  className="bg-primary text-white hover:bg-primary/90 gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Crear cuenta gratis
                </Button>
                <Button
                  onClick={onShowAuth}
                  variant="outline"
                  size="lg"
                  className="border-primary text-primary hover:bg-primary/5"
                >
                  Iniciar Sesión
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#4DB6AC]" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#4DB6AC]" />
                  <span>Gratis hasta 10 citas/mes</span>
                </div>
              </div>
            </div>
            
            {/* Multi-device Product Mockup */}
            <div className="relative">
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-[#E0F7FA] to-white blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-[#F8FFFE] via-white to-[#E0F7FA] shadow-2xl">
                <img
                  src={psychologistDevicesMockup}
                  alt="MindCare operando en laptop, iPad y iPhone"
                  className="w-full object-cover mix-blend-multiply"
                />
              </div>
              <div className="relative z-10 -mt-6 text-center">
                <Badge className="bg-white/95 text-primary shadow-lg border border-primary/15">
                  Opera desde laptop, iPad o iPhone
                </Badge>
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
              { value: "Agenda", label: "Día, semana y mes" },
              { value: "Pacientes", label: "Saldo, tarifa y expediente" },
              { value: "Pagos", label: "Ingresos y anticipos" },
              { value: "Reportes", label: "Mes, año y paciente" },
            ].map((stat, index) => (
              <Card key={index} className="border-border bg-white text-center">
                <CardContent className="p-6">
                  <p className="text-3xl text-primary mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/5 via-white to-[#E0F2F1]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
            <div>
              <Badge className="mb-6 bg-primary/10 text-primary px-4 py-2">
                Pensado en tu práctica
              </Badge>
              <h2 className="text-4xl text-foreground mb-4 leading-tight">
                El valor no es tener más pantallas. Es trabajar con menos fricción.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Un psicólogo necesita rapidez, orden y contexto. MindCare junta lo operativo
                y lo clínico en una experiencia simple para consulta privada.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {valuePillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <Card key={pillar.title} className="border-border bg-white shadow-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg text-foreground mb-2">{pillar.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {pillar.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-primary/10 text-primary px-4 py-2">
              Funciones del día a día
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
                className="border-primary/20 bg-white hover:shadow-xl transition-all"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.color} bg-opacity-10 flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-primary" />
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

      {/* Daily Flow */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
            <div>
              <Badge className="mb-6 bg-primary/10 text-primary px-4 py-2">
                En una jornada real
              </Badge>
              <h2 className="text-4xl text-foreground mb-4 leading-tight">
                Del primer paciente del día al cierre de ingresos.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                MindCare acompaña el flujo completo de tu consulta: antes, durante y después
                de cada sesión.
              </p>
              <Button
                onClick={onShowSignup}
                size="lg"
                className="bg-primary text-white hover:bg-primary/90 gap-2"
              >
                Probar flujo completo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <Card className="border-border bg-[#062F32] text-white overflow-hidden">
              <CardContent className="p-8">
                <div className="space-y-4">
                  {dailyFlow.map((step, index) => (
                    <div key={step} className="flex items-center gap-4 rounded-2xl bg-white/10 border border-white/10 p-4">
                      <div className="w-10 h-10 rounded-full bg-[#4DB6AC] flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#0B5558]/5 via-white to-[#E0F7FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-primary/10 text-primary px-4 py-2">
              Precios transparentes
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
                  tier.popular ? "border-primary scale-[1.02]" : "border-border"
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 text-sm">
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
                        <CheckCircle2 className="w-4 h-4 text-[#4DB6AC] flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={onShowSignup}
                    className={`w-full ${
                      tier.popular
                        ? "bg-primary text-white hover:bg-primary/90"
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

          {/* Affiliate CTA */}
          <Card className="max-w-4xl mx-auto border-2 border-[#0B5558]/20 bg-gradient-to-br from-white to-[#E0F7FA] overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-10">
                  <Badge className="mb-4 bg-[#0B5558]/10 text-[#0B5558]">
                    Opción afiliado
                  </Badge>
                  <h3 className="text-2xl text-foreground mb-3">
                    Usa el software gratis si formas parte de la red MindCare.
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    La afiliación es para psicólogos que quieren recibir pacientes del ecosistema
                    MindCare y operar su consulta desde la misma plataforma.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {affiliateBenefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#4DB6AC] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={onApplyAsPsychologist}
                    size="lg"
                    className="w-full bg-[#0B5558] text-white hover:bg-[#0B5558]/90 gap-2"
                  >
                    <GraduationCap className="w-5 h-5" />
                    Únete a la red MindCare
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    La afiliación requiere validación de perfil profesional.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-[#E0F7FA] to-white p-8 lg:p-10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto mb-6">
                      <img src={mindcareIsotype} alt="MindCare" className="h-20 w-20 object-contain" />
                    </div>
                    <p className="text-foreground mb-2">
                      Red profesional verificada
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Directorio, referidos y operación en un mismo ecosistema
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
                        className="w-4 h-4 fill-[#4DB6AC] text-[#4DB6AC]"
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
      <section className="py-20 px-6 bg-gradient-to-br from-[#0B5558] to-[#4DB6AC] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl mb-6">
            Empieza a Organizar tu Práctica Hoy
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Únete a psicólogos que ya usan MindCare para operar mejor su consulta
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onShowSignup}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 gap-2"
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
