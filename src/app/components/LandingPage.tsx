import { useState } from "react";
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
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  MessageSquare,
  MessageCircle,
  UserCheck,
  CircleHelp,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import empresasBanner from "../../assets/mindcare-empresas-hero-generated.png";
import mindcareIsotype from "../../assets/mindcare-isotype.png";
import { supabaseFunction } from "../../services/api";
import { toast } from "sonner";

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
    color: "bg-[#4DB6AC]",
  },
  {
    icon: Users,
    title: "Retén el Talento",
    description: "Reduce hasta 22% la rotación de personal con programas de bienestar integral.",
    color: "bg-[#4DB6AC]",
  },
  {
    icon: Heart,
    title: "Empleados Más Felices",
    description: "4.8/5 de satisfacción promedio. Empleados más comprometidos y motivados.",
    color: "bg-[#4DB6AC]",
  },
  {
    icon: Shield,
    title: "Cumple Normativas",
    description: "Cumplimiento con NOM-035 y mejora tu reputación como empleador responsable.",
    color: "bg-[#4DB6AC]",
  },
  {
    icon: DollarSign,
    title: "100% Deducible de ISR",
    description: "Todas las prestaciones de salud mental son completamente deducibles de impuestos.",
    color: "bg-[#80CBC4]",
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

const sessionPackageSteps = [
  {
    title: "Compra una bolsa inicial",
    description: "Definimos un paquete mensual de sesiones por empleado según tamaño, riesgo y objetivo del programa.",
    detail: "Bolsa mensual para iniciar",
  },
  {
    title: "Tu equipo usa sesiones",
    description: "Cada cita atendida se descuenta automáticamente de la bolsa, ya sea presencial o en línea.",
    detail: "Consumo visible para RH",
  },
  {
    title: "Corte y facturación",
    description: "Al cierre del periodo revisas sesiones usadas, saldo disponible y factura correspondiente.",
    detail: "Corte claro por periodo",
  },
];

const packageBenefits = [
  "Sin publicar costo por sesión antes de entender el alcance real",
  "Control de consumo por mes, área o sede",
  "Reportes agregados de adopción, uso y satisfacción",
  "Factura por corte con respaldo operativo de sesiones usadas",
];

const decisionQuestions = [
  "¿Cómo sé que mi equipo sí lo va a usar?",
  "¿Qué información ve RH sin invadir la privacidad?",
  "¿Cuánto cuesta por empleado y cómo se justifica?",
  "¿Qué tan rápido lo puedo implementar?",
];

const productFlow = [
  {
    icon: Building2,
    title: "1. Configuramos tu empresa",
    description: "Definimos empleados, beneficios, sesiones disponibles, modalidad y reglas de acceso.",
  },
  {
    icon: Users,
    title: "2. Tu equipo agenda fácil",
    description: "Cada colaborador elige psicólogo, horario y modalidad presencial o en línea.",
  },
  {
    icon: CalendarCheck,
    title: "3. MindCare opera la atención",
    description: "Gestionamos agenda, consultorios, recordatorios, asistencia y seguimiento operativo.",
  },
  {
    icon: BarChart3,
    title: "4. RH ve resultados",
    description: "Recibes métricas agregadas de uso, adopción, satisfacción y evolución del programa.",
  },
];

const hrDashboardItems = [
  {
    icon: BarChart3,
    title: "Adopción del beneficio",
    description: "Usuarios activos, sesiones tomadas, áreas con mayor uso y tendencia mensual.",
  },
  {
    icon: Shield,
    title: "Privacidad clínica",
    description: "RH nunca ve notas clínicas ni detalles sensibles de colaboradores.",
  },
  {
    icon: FileText,
    title: "Reportes ejecutivos",
    description: "Información lista para dirección, finanzas y comités de bienestar.",
  },
  {
    icon: Heart,
    title: "Satisfacción con el beneficio",
    description: "Pregunta agregada al empleado: ¿Este beneficio mejora tu satisfacción con la empresa?",
  },
];

const implementationSteps = [
  "Diagnóstico inicial y definición del plan",
  "Carga de empleados o liga de acceso",
  "Comunicación interna de lanzamiento",
  "Primer mes con seguimiento de adopción",
];

const faqs = [
  {
    question: "¿Qué información recibe la empresa?",
    answer: "Indicadores agregados: uso del beneficio, sesiones tomadas, satisfacción, NPS del beneficio y tendencias. Por ejemplo: ¿Este beneficio mejora tu satisfacción con la empresa? No se comparten diagnósticos, notas clínicas ni información sensible del colaborador.",
  },
  {
    question: "¿Puede ser presencial y en línea?",
    answer: "Sí. El programa puede operar con sesiones presenciales en consultorios disponibles y sesiones por videollamada para equipos remotos o híbridos.",
  },
  {
    question: "¿Cómo se cobra?",
    answer: "La empresa compra una bolsa inicial de sesiones por empleado al mes. Cada cita atendida se descuenta de esa bolsa; al cierre del periodo se hace corte, se muestra el consumo y se factura con respaldo operativo.",
  },
  {
    question: "¿Qué pasa si pocos empleados lo usan?",
    answer: "Durante la implementación se trabaja comunicación interna, recordatorios y seguimiento de adopción para que el beneficio sea visible, claro y fácil de usar.",
  },
  {
    question: "¿En cuánto tiempo puede iniciar?",
    answer: "Un lanzamiento estándar puede estar listo en días: configuración, comunicación interna, acceso al equipo y agenda disponible.",
  },
];

export function LandingPage({ onEnterApp, onApplyAsPsychologist, onGoToControlLanding }: LandingPageProps) {
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    company: "",
    email: "",
    whatsapp: "",
    employees: "",
    message: "",
  });

  const scrollToInformationForm = () => {
    document.getElementById("solicitar-informacion")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleLeadSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!leadForm.name.trim() || !leadForm.company.trim() || !leadForm.email.trim()) {
      toast.error("Completa nombre, empresa y correo corporativo.");
      return;
    }

    setLeadSubmitting(true);

    try {
      await supabaseFunction("supabase-functions-deploy-company-lead-email", {
        method: "POST",
        body: JSON.stringify(leadForm),
      });

      toast.success("Solicitud enviada. Te contactaremos pronto.");
      setLeadForm({
        name: "",
        company: "",
        email: "",
        whatsapp: "",
        employees: "",
        message: "",
      });
    } catch (error: any) {
      console.error("Company lead submit error:", error);
      const message = String(error?.message || "");
      toast.error(
        message.includes("Load failed") || message.includes("Failed to fetch")
          ? "No se pudo conectar con la función. Revisa que company-lead-email esté desplegada y con JWT desactivado."
          : message || "No se pudo enviar la solicitud."
      );
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FFFE] to-white">
      {/* Header/Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={mindcareIsotype}
              alt="MindCare"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-xl text-foreground">MindCare</h1>
              <p className="text-xs text-muted-foreground">Salud Mental Empresarial</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={scrollToInformationForm}
              className="border-[#4DB6AC] text-[#4DB6AC] hover:bg-[#4DB6AC]/5 gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Solicitar información
            </Button>
            <Button
              onClick={scrollToInformationForm}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              Solicitar demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="enterprise-hero relative min-h-[760px] pt-28 px-6 overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={empresasBanner}
            alt="Equipo empresarial colaborando con MindCare Empresas"
            className="enterprise-hero__image h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#062F32]/95 via-[#062F32]/72 to-[#062F32]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#062F32]/70 via-transparent to-transparent" />
        </div>

        <div className="enterprise-hero__content max-w-7xl mx-auto relative z-10 w-full">
          <div className="max-w-2xl py-16">
            <Badge className="mb-6 bg-white/12 text-white border border-white/20 px-4 py-2 shadow-sm backdrop-blur-md">
              MindCare Empresas
            </Badge>
            <h1 className="text-5xl md:text-7xl text-white mb-6 leading-[0.95] tracking-tight">
              Cuidamos a tu equipo,
              <span className="block text-[#8EDDD4]">
                impulsamos tu empresa.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/84 mb-8 leading-relaxed max-w-xl">
              Programa de salud mental para empresas con psicólogos certificados,
              sesiones presenciales o en línea y reportes claros para RH.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-9">
              <div className="flex items-center gap-2 text-white bg-white/12 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
                <MapPin className="w-5 h-5 text-[#8EDDD4]" />
                <span>Presencial en GDL</span>
              </div>
              <div className="flex items-center gap-2 text-white bg-white/12 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
                <Video className="w-5 h-5 text-[#8EDDD4]" />
                <span>Sesiones en Línea</span>
              </div>
              <div className="flex items-center gap-2 text-white bg-white/12 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
                <Shield className="w-5 h-5 text-[#8EDDD4]" />
                <span>NOM-035</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button
                size="lg"
                onClick={scrollToInformationForm}
                className="bg-[#4DB6AC] text-white hover:bg-[#26A69A] text-lg px-8 py-6 gap-2 shadow-lg shadow-black/20"
              >
                Solicitar información
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onGoToControlLanding}
                className="text-lg px-8 py-6 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-md"
              >
                Soy Psicólogo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl pb-10">
            {stats.map((stat, index) => (
              <Card key={index} className="border-white/15 bg-white/12 backdrop-blur-md shadow-lg shadow-black/10">
                <CardContent className="p-5">
                  <p className="text-3xl text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-white/72">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Buying Journey */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
            <div>
              <Badge className="mb-5 bg-primary/10 text-primary px-4 py-2">
                Para RH, Dirección y Finanzas
              </Badge>
              <h2 className="text-4xl text-foreground mb-4 leading-tight">
                Antes de contratar un beneficio, necesitas claridad.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Una empresa no compra solo sesiones. Compra adopción, operación,
                privacidad, reportes y una forma sencilla de cuidar a su equipo.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {decisionQuestions.map((question) => (
                <div key={question} className="rounded-2xl border border-border bg-accent/20 p-5">
                  <CircleHelp className="w-5 h-5 text-primary mb-4" />
                  <p className="text-foreground leading-snug">{question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Flow */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/5 via-white to-[#E0F2F1]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <Badge className="mb-5 bg-primary/10 text-primary px-4 py-2">
              Cómo funciona
            </Badge>
            <h2 className="text-4xl text-foreground mb-4">
              Un programa de salud mental que se opera fácil y se mide bien.
            </h2>
            <p className="text-xl text-muted-foreground">
              RH no tiene que coordinar citas ni manejar información sensible.
              MindCare centraliza la operación y entrega visibilidad ejecutiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {productFlow.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border bg-white shadow-sm hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg text-foreground mb-3">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* RH Dashboard Preview */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.95fr] gap-10 items-center">
            <div className="rounded-[2rem] border border-border bg-[#F7FAFA] p-6 lg:p-8 shadow-sm">
              <div className="rounded-[1.5rem] bg-white border border-border p-5 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Panel RH</p>
                    <h3 className="text-2xl text-foreground">Bienestar del equipo</h3>
                  </div>
                  <Badge className="bg-primary/10 text-primary">Mes actual</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-2xl bg-primary/10 p-4">
                    <p className="text-2xl text-primary">68%</p>
                    <p className="text-xs text-muted-foreground">Adopción</p>
                  </div>
                  <div className="rounded-2xl bg-[#E0F2F1] p-4">
                    <p className="text-2xl text-[#00695C]">124</p>
                    <p className="text-xs text-muted-foreground">Sesiones</p>
                  </div>
                  <div className="rounded-2xl bg-[#E0F7FA] p-4">
                    <p className="text-2xl text-[#00695C]">4.8</p>
                    <p className="text-xs text-muted-foreground">Satisfacción</p>
                  </div>
                  <div className="rounded-2xl bg-[#F8FFFE] border border-primary/15 p-4">
                    <p className="text-2xl text-[#00695C]">+62</p>
                    <p className="text-xs text-muted-foreground">NPS beneficio</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    ["Sesiones presenciales", "46%"],
                    ["Sesiones en línea", "54%"],
                    ["Citas completadas", "91%"],
                    ["Satisfacción con tu empresa", "88%"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground">{label}</span>
                        <span className="text-sm text-primary">{value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-accent overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: value }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Badge className="mb-5 bg-primary/10 text-primary px-4 py-2">
                Qué ve la empresa
              </Badge>
              <h2 className="text-4xl text-foreground mb-5 leading-tight">
                Métricas útiles para decidir, sin cruzar líneas clínicas.
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Una empresa necesita saber si el beneficio funciona. MindCare muestra
                datos operativos y agregados, manteniendo privada la relación terapéutica.
              </p>
              <div className="space-y-4">
                {hrDashboardItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4 rounded-2xl border border-border bg-white p-5">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Trust and Flexible Access */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/5 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 items-start mb-12">
            <div>
              <Badge className="mb-6 bg-primary/10 text-primary px-4 py-2">
                Confianza clínica
              </Badge>
              <h2 className="text-4xl text-foreground mb-4 leading-tight">
                Atención profesional, verificada y fácil de activar.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                MindCare combina psicólogos con perfil validado, reglas claras de privacidad
                y una experiencia sencilla para que el colaborador pueda pedir ayuda sin fricción.
              </p>
              <Button
                onClick={onGoToControlLanding}
                variant="outline"
                className="mt-8 border-primary text-primary hover:bg-primary/5 gap-2"
              >
                Conoce el proceso de la red
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border bg-white shadow-sm hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg text-foreground mb-2">Perfil validado</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Cédula, experiencia, enfoque terapéutico y disponibilidad documentada.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-white shadow-sm hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] flex items-center justify-center mb-5">
                    <UserCheck className="w-6 h-6 text-[#00695C]" />
                  </div>
                  <h3 className="text-lg text-foreground mb-2">Asignación simple</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    El colaborador elige psicólogo, horario y modalidad desde un flujo claro.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-white shadow-sm hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] flex items-center justify-center mb-5">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg text-foreground mb-2">Privacidad cuidada</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    La empresa ve métricas agregadas, no notas clínicas ni información sensible.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-border bg-[#062F32] text-white overflow-hidden shadow-xl">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr]">
                <div className="p-8 lg:p-10">
                  <Badge className="mb-6 bg-white/12 text-white border border-white/20">
                    Acceso flexible
                  </Badge>
                  <h3 className="text-3xl mb-4">
                    Una red de atención pensada para equipos híbridos.
                  </h3>
                  <p className="text-white/78 leading-relaxed mb-8">
                    No todos los colaboradores necesitan lo mismo. Algunos prefieren atención
                    presencial, otros videollamada, y otros solo necesitan disponibilidad rápida.
                    La experiencia se adapta sin que RH tenga que coordinar caso por caso.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white/10 p-5 border border-white/10">
                      <MapPin className="w-6 h-6 text-[#8EDDD4] mb-4" />
                      <p className="text-lg mb-1">Presencial</p>
                      <p className="text-sm text-white/70">Consultorios disponibles por zona y cercanía.</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-5 border border-white/10">
                      <Video className="w-6 h-6 text-[#8EDDD4] mb-4" />
                      <p className="text-lg mb-1">En línea</p>
                      <p className="text-sm text-white/70">Sesiones remotas para equipos distribuidos.</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-5 border border-white/10">
                      <CalendarCheck className="w-6 h-6 text-[#8EDDD4] mb-4" />
                      <p className="text-lg mb-1">Agenda clara</p>
                      <p className="text-sm text-white/70">Horarios disponibles, recordatorios y seguimiento.</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-5 border border-white/10">
                      <MessageSquare className="w-6 h-6 text-[#8EDDD4] mb-4" />
                      <p className="text-lg mb-1">Comunicación</p>
                      <p className="text-sm text-white/70">Mensajes de lanzamiento y adopción para el equipo.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white text-foreground p-8 lg:p-10">
                  <div className="mb-8">
                    <p className="text-sm text-muted-foreground mb-2">Experiencia del colaborador</p>
                    <h3 className="text-2xl text-foreground">Pedir apoyo debe sentirse simple.</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      ["Elige modalidad", "Presencial o en línea según disponibilidad y preferencia."],
                      ["Selecciona horario", "Agenda con opciones claras y confirmación inmediata."],
                      ["Recibe recordatorios", "Menos ausencias y mejor continuidad del proceso."],
                      ["Mantiene privacidad", "Su información clínica no se comparte con la empresa."],
                    ].map(([title, description], index) => (
                      <div key={title} className="flex gap-4 rounded-2xl border border-border bg-accent/20 p-4">
                        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-foreground mb-1">{title}</p>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                          <Star key={i} className="w-4 h-4 fill-[#4DB6AC] text-[#4DB6AC]" />
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

      {/* Session Package Model */}
      <section className="py-20 px-6 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-[#4DB6AC]/10 text-[#4DB6AC] px-4 py-2">
              Modelo de consumo
            </Badge>
            <h2 className="text-4xl text-foreground mb-4">
              Compra una bolsa de sesiones y paga sobre uso real.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              La empresa inicia con un paquete mensual de sesiones para sus colaboradores.
              Conforme se atienden citas, la bolsa se descuenta, se hace corte y se factura con claridad.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch mb-10">
            <Card className="border-border bg-white shadow-sm">
              <CardContent className="p-8 lg:p-10">
                <div className="flex flex-col gap-5">
                  {sessionPackageSteps.map((step, index) => (
                    <div key={step.title} className="flex gap-5 rounded-2xl border border-border bg-[#F8FFFE] p-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                        {index + 1}
                      </div>
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-xl text-foreground">{step.title}</h3>
                          <Badge className="bg-primary/10 text-primary">{step.detail}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/15 bg-gradient-to-br from-[#062F32] to-[#0B5558] text-white overflow-hidden">
              <CardContent className="p-8 lg:p-10">
                <Badge className="mb-6 bg-white/12 text-white border border-white/20">
                  Para RH y finanzas
                </Badge>
                <h3 className="text-3xl mb-4 leading-tight">
                  Control presupuestal sin prometer precios antes de diagnosticar.
                </h3>
                <p className="text-white/78 mb-7 leading-relaxed">
                  Primero dimensionamos la necesidad: número de empleados, modalidad,
                  ubicaciones, frecuencia sugerida y nivel de acompañamiento.
                </p>
                <div className="space-y-3">
                  {packageBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3 rounded-2xl bg-white/10 border border-white/10 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#8EDDD4]" />
                      <span className="text-sm text-white/90">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-5xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  ["Bolsa inicial", "Sesiones disponibles para el mes según el paquete contratado."],
                  ["Consumo", "Cada cita completada descuenta una sesión de la bolsa."],
                  ["Corte mensual", "Se entrega resumen de uso, saldo y factura del periodo."],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-2xl border border-border bg-white p-5">
                    <p className="text-lg text-foreground mb-2">{title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  La propuesta se arma con base en el tamaño de tu equipo, uso esperado y modalidad de atención.
                </p>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  onClick={scrollToInformationForm}
                >
                  <DollarSign className="w-5 h-5" />
                  Diseñar paquete de sesiones
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tax Deduction Note */}
          <div className="mt-8 text-center">
            <Card className="max-w-2xl mx-auto border-[#4DB6AC]/20 bg-gradient-to-br from-[#4DB6AC]/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#4DB6AC]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#4DB6AC]" />
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


      {/* Implementation and FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10">
            <Card className="border-border bg-gradient-to-br from-[#062F32] to-[#0B5558] text-white overflow-hidden">
              <CardContent className="p-8 lg:p-10">
                <Badge className="mb-6 bg-white/12 text-white border border-white/20">
                  Cómo iniciar
                </Badge>
                <h2 className="text-3xl mb-4">
                  De la decisión al lanzamiento, sin complicarlo.
                </h2>
                <p className="text-white/78 mb-8 leading-relaxed">
                  El objetivo es que RH pueda lanzar el beneficio rápido, con comunicación clara
                  y seguimiento desde el primer mes.
                </p>
                <div className="space-y-4">
                  {implementationSteps.map((step, index) => (
                    <div key={step} className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-white text-[#0B5558] flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={scrollToInformationForm}
                  className="mt-8 bg-[#4DB6AC] text-white hover:bg-[#26A69A] gap-2"
                >
                  Planear implementación
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <div>
              <Badge className="mb-5 bg-primary/10 text-primary px-4 py-2">
                Dudas frecuentes
              </Badge>
              <h2 className="text-4xl text-foreground mb-4">
                Lo que una empresa suele preguntar antes de avanzar.
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Respuestas claras para RH, Dirección y Finanzas.
              </p>
              <Card className="border-border bg-white shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={faq.question} value={`faq-${index}`}>
                        <AccordionTrigger className="text-base text-foreground hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>


      {/* Employee Proposal Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#4DB6AC]/5 via-white to-[#4DB6AC]/10">
        <div className="max-w-5xl mx-auto">
          <Card className="border-2 border-[#4DB6AC]/20 bg-white shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left side - Content */}
                <div className="p-8 lg:p-12">
                  <Badge className="mb-6 bg-[#4DB6AC]/10 text-[#4DB6AC] px-4 py-2">
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
                      <div className="w-10 h-10 rounded-full bg-[#4DB6AC]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-[#4DB6AC]" />
                      </div>
                      <div>
                        <h4 className="text-foreground mb-1">Kit de Presentación Gratis</h4>
                        <p className="text-sm text-muted-foreground">
                          Descarga un PDF ejecutivo con beneficios y ROI para RH
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4DB6AC]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-[#4DB6AC]" />
                      </div>
                      <div>
                        <h4 className="text-foreground mb-1">Email Template Listo</h4>
                        <p className="text-sm text-muted-foreground">
                          Plantilla profesional para enviar a tu jefe o RH
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4DB6AC]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-[#4DB6AC]" />
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
                      className="bg-[#4DB6AC] text-white hover:bg-[#26A69A] gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      Descargar Kit de Presentación
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-[#4DB6AC] text-[#4DB6AC] hover:bg-[#4DB6AC]/5"
                    >
                      Ver Email Template
                    </Button>
                  </div>

                  <div className="mt-8 p-4 bg-[#4DB6AC]/5 rounded-xl border border-[#4DB6AC]/20">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-[#4DB6AC]">🎁 Incentivo:</strong> Si tu empresa
                      contrata MindCare gracias a tu recomendación, recibirás un bono de
                      3 sesiones completamente gratis para ti.
                    </p>
                  </div>
                </div>

                {/* Right side - Visual/Stats */}
                <div className="bg-gradient-to-br from-[#4DB6AC] to-[#26A69A] p-8 lg:p-12 text-white flex flex-col justify-center">
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
      <section id="solicitar-informacion" className="scroll-mt-24 py-20 px-6 bg-[#F8FFFE]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 items-stretch">
            <div className="rounded-[2rem] bg-gradient-to-br from-[#062F32] to-[#0B5558] p-8 lg:p-10 text-white">
              <Badge className="mb-6 bg-white/12 text-white border border-white/20">
                Solicitar información
              </Badge>
              <h2 className="text-4xl mb-4 leading-tight">
                Cuéntanos de tu empresa y armamos una propuesta clara.
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-8">
                Revisamos tamaño del equipo, modalidad, ubicación y objetivos de bienestar
                para recomendar el alcance correcto.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {["Diagnóstico inicial", "Cotización", "Plan de lanzamiento"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/12 bg-white/10 p-4">
                    <CheckCircle2 className="w-5 h-5 text-[#8EDDD4] mb-3" />
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-primary/10 bg-white shadow-xl shadow-primary/5">
              <CardContent className="p-6 lg:p-8">
                <form
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  onSubmit={handleLeadSubmit}
                >
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Nombre</span>
                    <input
                      required
                      value={leadForm.name}
                      onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Tu nombre"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Empresa</span>
                    <input
                      required
                      value={leadForm.company}
                      onChange={(event) => setLeadForm({ ...leadForm, company: event.target.value })}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Nombre de la empresa"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Correo corporativo</span>
                    <input
                      required
                      type="email"
                      value={leadForm.email}
                      onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="rh@empresa.com"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Número WhatsApp</span>
                    <input
                      value={leadForm.whatsapp}
                      onChange={(event) => setLeadForm({ ...leadForm, whatsapp: event.target.value })}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="+52 33 1234 5678"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Número de colaboradores</span>
                    <input
                      value={leadForm.employees}
                      onChange={(event) => setLeadForm({ ...leadForm, employees: event.target.value })}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Ej. 80"
                    />
                  </label>
                  <label className="sm:col-span-2 space-y-2">
                    <span className="text-sm text-foreground">¿Qué estás buscando resolver?</span>
                    <textarea
                      value={leadForm.message}
                      onChange={(event) => setLeadForm({ ...leadForm, message: event.target.value })}
                      className="min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Cuéntanos si buscas apoyo NOM-035, sesiones para empleados, atención híbrida, reportes para RH, etc."
                    />
                  </label>
                  <Button
                    type="submit"
                    disabled={leadSubmitting}
                    className="sm:col-span-2 bg-primary text-white hover:bg-primary/90 gap-2"
                  >
                    {leadSubmitting ? "Enviando..." : "Enviar solicitud"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <p className="sm:col-span-2 text-center text-xs text-muted-foreground">
                    Recibirás respuesta para dimensionar sesiones, cobertura y plan de lanzamiento.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border bg-gradient-to-br from-primary to-[#26A69A] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
            <CardContent className="p-12 relative z-10">
              <div className="text-center">
                <h2 className="text-4xl mb-4">
                  ¿Listo para evaluar MindCare para tu empresa?
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  Agenda una demo, revisa el alcance ideal y recibe una cotización clara para tu equipo.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={scrollToInformationForm}
                    className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 gap-2"
                  >
                    <Building2 className="w-5 h-5" />
                    Solicitar demo empresarial
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-white text-white hover:bg-white/10"
                  >
                    Hablar con un asesor
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
                <img
                  src={mindcareIsotype}
                  alt="MindCare"
                  className="h-11 w-11 object-contain"
                />
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

      <a
        href="https://wa.me/5213312345678?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20MindCare%20Empresas"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/30 transition hover:-translate-y-1 hover:bg-[#1EBE5D] focus:outline-none focus:ring-4 focus:ring-[#25D366]/25"
        aria-label="Contactar por WhatsApp"
        title="Contactar por WhatsApp"
      >
        <MessageCircle className="h-8 w-8" />
      </a>
    </div>
  );
}
