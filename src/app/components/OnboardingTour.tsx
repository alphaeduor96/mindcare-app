import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  Sparkles,
  CalendarDays,
  Users,
  CreditCard,
  FileText,
  MapPin,
  Settings,
  Globe2,
  ShieldCheck,
  Receipt,
} from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
}

export function OnboardingTour({ isOpen, onClose, steps }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tourMode, setTourMode] = useState<"basic" | "advanced" | null>(null);
  const [elementPosition, setElementPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const advancedSections = [
    {
      icon: CalendarDays,
      title: "Agenda y citas",
      items: [
        "Ver citas en Calendario o Lista, y configurar cuál abre por defecto desde Configuración > Citas > Vista inicial.",
        "Filtrar citas por mes, abrir detalle, editar, cancelar, marcar como completada y registrar pago desde la cita.",
        "Crear citas con paciente, consultorio principal automático, modalidad presencial/en línea, estado, monto y duración.",
        "Usar duraciones de 30 minutos a 3 horas, ajustar hora inicio/fin y preparar agenda para arrastrar/mover citas.",
        "Crear citas recurrentes semanales con validación de cruces de horario.",
        "Bloquear horarios por actividades externas para que no aparezcan como disponibles.",
        "Generar feed iCal para iOS/Android; las citas canceladas se conservan en lista, pero no aparecen en calendario ni feed.",
      ],
    },
    {
      icon: Users,
      title: "Pacientes",
      items: [
        "Crear, editar y ver pacientes sin seleccionar psicólogo asignado: el sistema usa tu usuario actual.",
        "Configurar tarifa base por paciente para sugerir automáticamente el monto al crear una cita.",
        "Ver saldo del paciente con indicador rojo si te debe o verde si tiene saldo a favor.",
        "Abrir resumen del paciente: citas del año, sesiones por semana, ingresos, expediente y pagos.",
        "Configurar recordatorios por WhatsApp por paciente: confirmación de cita, recordatorio de cita y pago pendiente.",
        "Configurar si el paciente requiere factura y capturar sus datos fiscales desde alta/edición.",
      ],
    },
    {
      icon: FileText,
      title: "Expedientes",
      items: [
        "Filtrar por paciente y ver todos sus documentos clínicos en una lista simple.",
        "Abrir un documento para leerlo a fondo, sin forzar una vista de tres columnas.",
        "Descargar documentos en PDF o Word cuando estén disponibles.",
        "Crear nuevas entradas clínicas desde expediente o desde accesos rápidos.",
      ],
    },
    {
      icon: CreditCard,
      title: "Pagos y reportes",
      items: [
        "Registrar ingresos asociados a citas, con paciente/cita/psicólogo prellenados cuando vienes desde Pagar.",
        "Consultar saldos a favor de pacientes en una vista pensada para muchos registros.",
        "Ver reporte por paciente con cuánto debe, cuánto ha pagado, últimas citas agendadas y últimos pagos.",
        "Ver resumen mensual por paciente, con total del mes, pagado, pendiente y desglose por cita.",
        "Filtrar reportes por mes y año; el resumen mensual no requiere elegir paciente.",
      ],
    },
    {
      icon: MapPin,
      title: "Consultorios",
      items: [
        "Crear, editar y administrar consultorios reales desde base de datos.",
        "Marcar un consultorio principal con corazón; si solo tienes uno, se usa automáticamente en citas.",
        "Capturar calle y número, código postal, colonia, ciudad y estado obligatorios.",
        "Cargar colonias por código postal, calcular ciudad/estado y confirmar ubicación moviendo el pin en mapa.",
        "Subir fotos reales del consultorio para mostrarlas en el directorio público.",
      ],
    },
    {
      icon: Globe2,
      title: "Perfil público y directorio",
      items: [
        "Activar o desactivar aparecer en el directorio público.",
        "Actualizar foto circular de perfil desde Mi Perfil; esa imagen se usa en el directorio.",
        "Publicar biografía, enfoque, especialidades, cédula, años de experiencia, modalidades y consultorio principal.",
        "Dar de alta servicios con precio propio: terapia individual, pareja, familiar u otros.",
        "El directorio público muestra lista y mapa con pines; al seleccionar un pin aparece un perfil rápido y acceso a ver más.",
        "Planes del directorio: Normal, Recomendado y Premium con mayor visibilidad visual.",
      ],
    },
    {
      icon: Receipt,
      title: "Suscripción, cobros y facturación",
      items: [
        "Ver plan actual, límites de citas, mensualidad y estado de suscripción.",
        "Agregar o actualizar tarjeta con Stripe cuando el plan lo requiere.",
        "Al subir de plan se puede cobrar en el momento según la regla de prorrateo configurada.",
        "Ver Mis cobros con periodo, monto, tarjeta y motivo del cargo.",
        "Ver facturación por periodo; si no hay datos fiscales, se genera recibo informativo/no fiscal.",
        "Preparar facturación a pacientes con datos fiscales del paciente y configuración fiscal del psicólogo.",
      ],
    },
    {
      icon: Settings,
      title: "Configuración",
      items: [
        "Cambiar zona horaria desde Configuración > Información General > Zona Horaria.",
        "Cambiar moneda, duración predeterminada, horario de inicio/cierre y horas de recordatorio.",
        "Cambiar vista inicial de Citas entre Calendario y Lista.",
        "Activar o desactivar reservas en línea, confirmación automática y requerir pago.",
        "Cambiar colores de calendario para citas presenciales y en línea desde Mi Perfil > Configuración.",
        "Usar modo claro/oscuro desde el control superior del panel.",
        "Actualizar nombre, teléfono, foto y contraseña desde Mi Perfil.",
      ],
    },
    {
      icon: ShieldCheck,
      title: "Administrador",
      items: [
        "Entrar desde el mismo login habilitando administrador con doble click en la palabra administrador.",
        "Ver psicólogos registrados, estado, datos generales, consultorios, suscripción activa y próxima fecha de cobro.",
        "Configurar planes: costo mensual, límite de citas y planes ilimitados.",
        "Consultar tarjetas/cobros de Stripe y disparar cobros administrativos cuando aplique.",
        "Revisar prefacturas/facturas de suscripciones conforme se generen.",
      ],
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setTourMode(null);
      setCurrentStep(0);
      setElementPosition(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || tourMode !== "basic") return;

    const updatePosition = () => {
      const element = document.querySelector(steps[currentStep]?.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
        
        // Scroll element into view smoothly
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [currentStep, isOpen, steps, tourMode]);

  if (!isOpen) return null;

  if (!tourMode) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
        <Card className="fixed left-1/2 top-1/2 z-[10000] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 border-border shadow-2xl">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-sm text-primary">Centro de aprendizaje</p>
                <h2 className="text-2xl text-foreground">¿Qué tutorial quieres ver?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  El básico te guía por el panel principal. El avanzado te muestra todas las funciones y dónde configurarlas.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setTourMode("basic")}
                className="rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-lg text-foreground">Tutorial básico</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Recorrido corto por métricas, calendario, pacientes, pagos y reportes del inicio.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTourMode("advanced")}
                className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-left transition hover:border-primary hover:bg-primary/10"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-lg text-foreground">Tutorial avanzado</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Guía completa de funciones, configuraciones, cobros, directorio, consultorios y automatizaciones.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (tourMode === "advanced") {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
        <Card className="fixed left-1/2 top-1/2 z-[10000] flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col border-border shadow-2xl">
          <CardContent className="flex min-h-0 flex-col p-0">
            <div className="border-b border-border p-6 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-sm text-primary">Tutorial avanzado</p>
                  <h2 className="text-2xl text-foreground">Funciones completas de MindCare</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Usa esta guía como mapa rápido para saber qué existe y dónde se configura.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto p-6 md:p-7">
              <div className="grid gap-4 md:grid-cols-2">
                {advancedSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.title} className="rounded-2xl border border-border bg-card p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="text-lg text-foreground">{section.title}</h3>
                      </div>
                      <ul className="space-y-2">
                        {section.items.map((item) => (
                          <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border p-5">
              <Button variant="outline" onClick={() => setTourMode(null)}>
                Cambiar tutorial
              </Button>
              <Button onClick={onClose} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Entendido
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!steps[currentStep]) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getTooltipPosition = () => {
    if (!elementPosition) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const placement = steps[currentStep].placement || "bottom";
    const padding = 20;
    const tooltipWidth = 448; // max-w-md = 28rem = 448px
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let position = { top: "0px", left: "0px", transform: "" };

    switch (placement) {
      case "top":
        position = {
          top: `${elementPosition.top - padding}px`,
          left: `${elementPosition.left + elementPosition.width / 2}px`,
          transform: "translate(-50%, -100%)",
        };
        break;
      case "bottom":
        position = {
          top: `${elementPosition.top + elementPosition.height + padding}px`,
          left: `${elementPosition.left + elementPosition.width / 2}px`,
          transform: "translate(-50%, 0)",
        };
        break;
      case "left":
        position = {
          top: `${elementPosition.top + elementPosition.height / 2}px`,
          left: `${elementPosition.left - padding}px`,
          transform: "translate(-100%, -50%)",
        };
        break;
      case "right":
        position = {
          top: `${elementPosition.top + elementPosition.height / 2}px`,
          left: `${elementPosition.left + elementPosition.width + padding}px`,
          transform: "translate(0, -50%)",
        };
        break;
      default:
        position = {
          top: `${elementPosition.top + elementPosition.height + padding}px`,
          left: `${elementPosition.left + elementPosition.width / 2}px`,
          transform: "translate(-50%, 0)",
        };
    }

    // Parse position values to check boundaries
    const topValue = parseFloat(position.top);
    let leftValue = parseFloat(position.left);

    // Adjust horizontal position to keep tooltip on screen
    // Calculate where the tooltip would actually end up after transform
    let actualLeft = leftValue;
    if (position.transform.includes("-50%")) {
      actualLeft = leftValue - tooltipWidth / 2;
    } else if (position.transform.includes("-100%")) {
      actualLeft = leftValue - tooltipWidth;
    }

    // If tooltip would go off the left edge, adjust it
    if (actualLeft < padding) {
      leftValue = tooltipWidth / 2 + padding;
      position.left = `${leftValue}px`;
      position.transform = position.transform.replace("translate(-50%", "translate(-50%").replace("translate(-100%", "translate(-50%");
    }
    
    // If tooltip would go off the right edge, adjust it
    if (actualLeft + tooltipWidth > viewportWidth - padding) {
      leftValue = viewportWidth - tooltipWidth / 2 - padding;
      position.left = `${leftValue}px`;
      position.transform = position.transform.replace("translate(0,", "translate(-50%,");
    }

    // Adjust vertical position to keep tooltip on screen
    let actualTop = topValue;
    if (position.transform.includes("-100%")) {
      actualTop = topValue - 300; // Approximate tooltip height
    } else if (position.transform.includes("-50%")) {
      actualTop = topValue - 150;
    }

    if (actualTop < padding) {
      position.top = `${elementPosition.top + elementPosition.height + padding}px`;
      position.transform = position.transform.replace("-100%", "0").replace("-50%", "-50%");
    }

    if (actualTop + 300 > viewportHeight - padding) {
      position.top = `${elementPosition.top - padding}px`;
      position.transform = position.transform.replace(", 0)", ", -100%)").replace(", -50%)", ", -100%)");
    }

    return position;
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={handleSkip} />
      
      {/* Spotlight highlight */}
      {elementPosition && (
        <>
          <div
            className="fixed z-[9999] pointer-events-none animate-pulse"
            style={{
              top: `${elementPosition.top - 8}px`,
              left: `${elementPosition.left - 8}px`,
              width: `${elementPosition.width + 16}px`,
              height: `${elementPosition.height + 16}px`,
              boxShadow: "0 0 0 4px rgba(126, 87, 194, 0.8), 0 0 0 9999px rgba(0, 0, 0, 0.7)",
              borderRadius: "12px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: `${elementPosition.top - 4}px`,
              left: `${elementPosition.left - 4}px`,
              width: `${elementPosition.width + 8}px`,
              height: `${elementPosition.height + 8}px`,
              border: "2px solid rgba(126, 87, 194, 1)",
              borderRadius: "10px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </>
      )}

      {/* Tooltip */}
      <Card
        className="fixed z-[10000] w-full max-w-md border-2 border-[#7E57C2] shadow-2xl mx-4"
        style={getTooltipPosition()}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[#7E57C2] text-white flex items-center justify-center text-xs">
                  {currentStep + 1}
                </div>
                <span className="text-xs text-muted-foreground">
                  Paso {currentStep + 1} de {steps.length}
                </span>
              </div>
              <h3 className="text-lg text-foreground mb-2">
                {steps[currentStep].title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0 hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            {steps[currentStep].content}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-6 bg-[#7E57C2]"
                    : index < currentStep
                    ? "w-2 bg-[#7E57C2]/50"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              size="sm"
              className="text-muted-foreground"
            >
              Saltar Tutorial
            </Button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  size="sm"
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
              )}
              <Button
                onClick={handleNext}
                size="sm"
                className="bg-[#7E57C2] text-white hover:bg-[#7E57C2]/90 gap-2"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Finalizar
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
