import { Search, Bell, ChevronDown, LogOut, User, ArrowLeft, Menu } from "lucide-react";
import { Input } from "./ui/input";
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

export function Header({ currentUser, onBackToAdmin, onNavigate, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border fixed top-0 right-0 left-0 lg:left-64 z-10 px-4 md:px-6 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Hamburger menu for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
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

        {/* Search - Hidden on mobile */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar pacientes, psicólogos, citas..."
              className="pl-10 bg-input-background border-border/50 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search icon for mobile */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="w-5 h-5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
            3
          </Badge>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 md:gap-3 h-auto py-2 px-2 md:px-3 hover:bg-accent"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"} />
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
            <DropdownMenuItem>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
