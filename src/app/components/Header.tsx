import { ChevronDown, LogOut, User, ArrowLeft, Menu, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

interface HeaderProps {
  currentUser: {
    name: string;
    role: string;
    avatar?: string;
    plan?: "basico" | "intermedio" | "pro" | "afiliado";
  };
  onBackToAdmin?: () => void;
  onNavigate?: (section: string) => void;
  onMenuClick: () => void;
  sidebarCollapsed?: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
}

const getPlanLabel = (plan?: string) => {
  switch (plan) {
    case "basico":
      return { label: "Plan Básico", color: "bg-[#66BB6A]/10 text-[#66BB6A] border-[#66BB6A]/20" };
    case "intermedio":
      return { label: "Plan Intermedio", color: "bg-[#7E57C2]/10 text-[#7E57C2] border-[#7E57C2]/20" };
    case "pro":
      return { label: "Plan Pro", color: "bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/20" };
    case "afiliado":
      return { label: "Afiliado", color: "bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/20" };
    default:
      return null;
  }
};

export function Header({
  currentUser,
  onBackToAdmin,
  onNavigate,
  onMenuClick,
  sidebarCollapsed = false,
  theme,
  onToggleTheme,
  onLogout,
}: HeaderProps) {
  return (
    <header
      className={`h-16 bg-card border-b border-border fixed top-0 right-0 left-0 ${
        sidebarCollapsed ? "lg:left-20" : "lg:left-64"
      } z-10 px-4 md:px-6 flex items-center justify-between transition-all duration-300`}
    >
      {/* Left section */}
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Hamburger menu for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
          title="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Back to Admin Button */}
        {onBackToAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToAdmin}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver a Admin</span>
          </Button>
        )}

      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 md:gap-3 h-auto py-2 px-2 md:px-3 hover:bg-accent"
            >
              <Avatar className="w-8 h-8">
                {currentUser.avatar && <AvatarImage src={currentUser.avatar} />}
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentUser.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden lg:block">
                <p className="text-sm text-foreground">{currentUser.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{currentUser.role}</p>
                  {getPlanLabel(currentUser.plan) && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0 h-4 border ${getPlanLabel(currentUser.plan)?.color}`}
                    >
                      {getPlanLabel(currentUser.plan)?.label}
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate?.("profile")}>
              <User className="w-4 h-4 mr-2" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
