import { useState } from "react";
import { Card, CardContent, CardHeader, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import {
  Heart,
  Mail,
  Lock,
  User,
  Phone,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Award,
  Sparkles,
} from "lucide-react";

interface ControlAuthProps {
  onBack: () => void;
  onLogin: (email: string, password: string) => void;
  onSignup: (data: SignupData) => void;
  onGoToAffiliateSignup?: () => void;
}

export interface SignupData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  license: string;
  specialty: string;
}

export function ControlAuth({ onBack, onLogin, onSignup, onGoToAffiliateSignup }: ControlAuthProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [signupData, setSignupData] = useState<SignupData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    license: "",
    specialty: "",
  });

  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    onLogin(loginData.email, loginData.password);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupData.fullName || !signupData.email || !signupData.phone || 
        !signupData.password || !signupData.license || !signupData.specialty) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    // Validate password strength
    if (signupData.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!acceptTerms) {
      toast.error("Debes aceptar los términos y condiciones");
      return;
    }

    onSignup(signupData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3E5F5] to-white py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 gap-2 text-[#7E57C2] hover:text-[#7E57C2]/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7E57C2] to-[#9575CD] flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl text-foreground">MindCare Control</h1>
                  <p className="text-muted-foreground">Tu consultorio digital</p>
                </div>
              </div>
              <p className="text-lg text-muted-foreground">
                {mode === "login" 
                  ? "Accede a tu panel de gestión profesional"
                  : "Crea tu cuenta y comienza a organizar tu práctica"
                }
              </p>
            </div>

            {mode === "signup" && (
              <Card className="border-[#7E57C2]/20 bg-gradient-to-br from-[#7E57C2]/5 to-transparent">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-[#7E57C2] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-foreground mb-2">¿Qué obtienes con tu cuenta?</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            Sistema completo de gestión gratis hasta 10 citas/mes
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            Calendario, pacientes, pagos y reportes ilimitados
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            Recordatorios automáticos por email y SMS
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            Sin contratos ni permanencias - cancela cuando quieras
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="bg-white rounded-lg p-4 border-2 border-dashed border-[#7E57C2]/20">
                    <div className="flex items-start gap-3">
                      <Award className="w-5 h-5 text-[#FF9800] flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground mb-1">
                          ¿Quieres más pacientes?
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Aplica a nuestra red de psicólogos afiliados y obtén referidos constantes de 500+ empresas
                        </p>
                        <Badge className="bg-[#FF9800]/10 text-[#FF9800] text-xs">
                          Sistema 100% gratis para afiliados
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {mode === "login" && (
              <div className="space-y-4">
                <Card className="border-[#7E57C2]/20 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-[#7E57C2]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-[#7E57C2]" />
                      </div>
                      <div>
                        <h3 className="text-foreground mb-1">Plan Gratis</h3>
                        <p className="text-sm text-muted-foreground">
                          Hasta 10 citas/mes • Todas las funciones
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#7E57C2]/20 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#FF9800]/10 flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-[#FF9800]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-foreground mb-2">¿Quieres sistema 100% gratis?</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Los psicólogos afiliados a nuestra red obtienen acceso ilimitado sin costo y referidos constantes de 500+ empresas.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onGoToAffiliateSignup || onBack}
                          className="border-[#FF9800] text-[#FF9800] hover:bg-[#FF9800]/5"
                        >
                          Únete a Nuestra Red
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Side - Form */}
          <Card className="border-2 border-[#7E57C2]/20 bg-white shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl text-foreground">
                  {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
                </h2>
                <Badge className="bg-[#7E57C2]/10 text-[#7E57C2]">
                  MindCare Control
                </Badge>
              </div>
              <CardDescription>
                {mode === "login"
                  ? "Ingresa tus credenciales para acceder"
                  : "Completa el formulario para crear tu cuenta gratis"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-11 pr-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={loginData.rememberMe}
                        onCheckedChange={(checked) => 
                          setLoginData({ ...loginData, rememberMe: checked as boolean })
                        }
                      />
                      <Label htmlFor="remember" className="cursor-pointer text-sm">
                        Recordarme
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-[#7E57C2] p-0 h-auto"
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-[#7E57C2] text-white hover:bg-[#7E57C2]/90"
                  >
                    Iniciar Sesión
                  </Button>

                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      ¿No tienes cuenta?{" "}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setMode("signup")}
                      className="text-[#7E57C2] p-0 h-auto"
                    >
                      Regístrate gratis
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Dr. Juan Pérez"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                        className="pl-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="tu@email.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className="pl-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="33 1234 5678"
                          value={signupData.phone}
                          onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                          className="pl-11"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="license">Cédula Profesional *</Label>
                      <Input
                        id="license"
                        placeholder="12345678"
                        value={signupData.license}
                        onChange={(e) => setSignupData({ ...signupData, license: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialty">Especialidad *</Label>
                      <Input
                        id="specialty"
                        placeholder="Ej: Terapia Cognitiva"
                        value={signupData.specialty}
                        onChange={(e) => setSignupData({ ...signupData, specialty: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="pl-11 pr-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Debe tener al menos 8 caracteres
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="cursor-pointer text-sm leading-relaxed">
                      Acepto los{" "}
                      <Button type="button" variant="link" className="p-0 h-auto text-[#7E57C2]">
                        términos y condiciones
                      </Button>{" "}
                      y la{" "}
                      <Button type="button" variant="link" className="p-0 h-auto text-[#7E57C2]">
                        política de privacidad
                      </Button>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-[#7E57C2] text-white hover:bg-[#7E57C2]/90"
                  >
                    Crear Cuenta Gratis
                  </Button>

                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      ¿Ya tienes cuenta?{" "}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setMode("login")}
                      className="text-[#7E57C2] p-0 h-auto"
                    >
                      Inicia sesión
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
