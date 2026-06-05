import {
  Home,
  Users,
  UserRound,
  Building2,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  FileText,
  Video,
  ChevronRight,
  X,
  Bell,
  Lightbulb,
  CreditCard,
  Wallet,
  UserPlus,
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: "admin" | "psicologo" | "psychologist" | "empresa" | "company" | "empleado" | "employee";
  isOpen: boolean;
  onClose: () => void;
  userPlan?: "basico" | "intermedio" | "pro" | "afiliado";
}

const menuItems: Array<{
  id: string;
  label: string;
  icon: any;
  roles?: string[];
  dataTour?: string;
  affiliatedOnly?: boolean;
  controlOnly?: boolean;
}> = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "psychologists", label: "Red de Psicólogos", icon: Users, roles: ["admin"] },
  { id: "directory", label: "Buscar Psicólogos", icon: Users, roles: ["employee"] },
  { id: "companies", label: "Empresas", icon: Building2, roles: ["admin"] },
  { id: "user-management", label: "Gestión de Usuarios", icon: UserPlus, roles: ["admin"] },
  { id: "admin-billing", label: "Cobros y Facturación", icon: CreditCard, roles: ["admin"] },
  { id: "employees", label: "Empleados", icon: UserRound, roles: ["company"] },
  { id: "patients", label: "Mis Pacientes", icon: UserRound, roles: ["psychologist"], dataTour: "patients" },
  { id: "clinical-records", label: "Expedientes", icon: FileText, roles: ["psychologist"] },
  { id: "offices", label: "Consultorios", icon: Building2, roles: ["psychologist"] },
  // Oculto temporalmente mientras se termina el flujo completo de agenda.
  { id: "appointments", label: "Citas", icon: Calendar, roles: ["psychologist", "employee"], dataTour: "calendar" },
  { id: "video-sessions", label: "Videollamadas", icon: Video, roles: ["psychologist"] },
  { id: "payments", label: "Mis Pagos", icon: DollarSign, roles: ["psychologist"], dataTour: "payments" },
  { id: "network-payouts", label: "Cortes MindCare", icon: Wallet, roles: ["psychologist"], affiliatedOnly: true },
  { id: "billing", label: "Suscripción", icon: CreditCard, roles: ["psychologist"], controlOnly: true },
  { id: "notifications", label: "Recordatorios", icon: Bell, roles: ["psychologist"], dataTour: "notifications" },
  { id: "reports", label: "Reportes", icon: BarChart3, roles: ["psychologist", "company"], dataTour: "reports" },
  { id: "feedback", label: "Sugerir Mejoras", icon: Lightbulb, roles: ["psychologist"] },
  { id: "settings", label: "Configuración", icon: Settings, roles: ["admin", "company"] },
];

export function Sidebar({ activeSection, onSectionChange, userRole, isOpen, onClose, userPlan }: SidebarProps) {
  // Map role to English for menu filtering
  const roleMap: Record<string, string> = {
    admin: "admin",
    psicologo: "psychologist",
    psychologist: "psychologist",
    empresa: "company",
    company: "company",
    empleado: "employee",
    employee: "employee",
  };

  const mappedRole = roleMap[userRole] || userRole;

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    if (!item.roles.includes(mappedRole)) return false;

    // Filter based on plan for psychologists
    if (mappedRole === "psychologist") {
      if (item.affiliatedOnly && userPlan !== "afiliado") return false;
      if (item.controlOnly && userPlan === "afiliado") return false;
    }

    return true;
  });

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 lg:hidden"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#26A69A] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-foreground">MindCare</h1>
              <p className="text-xs text-muted-foreground">
                {userRole === "admin" && "Red de Psicólogos"}
                {userRole === "psychologist" && "Panel Profesional"}
                {userRole === "company" && "Portal Empresarial"}
                {userRole === "employee" && "Tu Bienestar"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id || activeSection.startsWith(`${item.id}-`);
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-11 ${
                    isActive
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => onSectionChange(item.id)}
                  data-tour={item.dataTour}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Info */}
        <div className="p-4 border-t border-border">
          <div className="bg-accent rounded-lg p-3">
            <p className="text-xs text-accent-foreground mb-1">
              ¿Necesitas ayuda?
            </p>
            <Button variant="link" className="h-auto p-0 text-xs text-primary">
              Ver guía rápida
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
