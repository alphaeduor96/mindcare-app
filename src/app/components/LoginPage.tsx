import { API_BASE, publicAnonKey, supabaseUrl } from "../../services/api";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Label } from "./ui/label";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LoginPageProps {
  onLogin: (user: any) => void;
  onGoToLanding?: () => void;
}

const localUsers = [
  {
    email: "admin@mindcare.mx",
    password: "Admin2026!",
    user: {
      id: "local-admin",
      email: "admin@mindcare.mx",
      nombre: "Super",
      apellido: "Admin",
      telefono: "+52 33 1111 2222",
      rol: "admin",
      activo: true,
      foto_perfil:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    },
  },
  {
    email: "admin@test.com",
    password: "12345678",
    user: {
      id: "local-admin-test",
      email: "admin@test.com",
      nombre: "Admin",
      apellido: "Demo",
      rol: "admin",
      activo: true,
    },
  },
];

function getLocalUser(email: string, password: string) {
  return localUsers.find(
    (localUser) =>
      localUser.email.toLowerCase() === email.toLowerCase() &&
      localUser.password === password
  )?.user;
}

function isNetworkError(error: any) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("failed to fetch") || message.includes("load failed");
}

function getAuthErrorMessage(errorData: any) {
  return errorData?.msg || errorData?.message || errorData?.error_description || errorData?.error;
}

async function loginWithSupabaseAuth(email: string, password: string) {
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publicAnonKey,
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ email, password }),
  });

  const authData = await authResponse.json();

  if (!authResponse.ok) {
    throw new Error(getAuthErrorMessage(authData) || "Credenciales incorrectas");
  }

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/usuarios?id=eq.${authData.user.id}&select=*`,
    {
      headers: {
        apikey: publicAnonKey,
        Authorization: `Bearer ${authData.access_token}`,
      },
    }
  );

  let profile = null;
  if (profileResponse.ok) {
    const profiles = await profileResponse.json();
    profile = profiles?.[0] || null;
  }

  const metadata = authData.user.user_metadata || {};
  const emailName = authData.user.email?.split("@")[0] || "Usuario";

  const user = profile || {
      id: authData.user.id,
      email: authData.user.email,
      nombre: metadata.nombre || emailName,
      apellido: metadata.apellido || "",
      telefono: metadata.telefono || "",
      rol: metadata.rol || "empleado",
      activo: true,
    };

  return {
    user: {
      ...user,
      activo: user.activo ?? user.estado === "activo",
    },
    access_token: authData.access_token,
    refresh_token: authData.refresh_token,
    session: authData,
  };
}

async function loginWithEdgeFunction(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data?.code === "NOT_FOUND" || data?.message === "Requested function was not found") {
      throw new Error("La función de login no está desplegada en Supabase.");
    }

    throw new Error(getAuthErrorMessage(data) || "Error al iniciar sesión");
  }

  return data;
}

export function LoginPage({ onLogin, onGoToLanding }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor ingresa tu email y contraseña");
      return;
    }

    setLoading(true);

    try {
      const data = await loginWithSupabaseAuth(email, password).catch(async (authError) => {
        if (String(authError?.message || "").toLowerCase().includes("invalid login credentials")) {
          throw new Error("Credenciales incorrectas");
        }

        return loginWithEdgeFunction(email, password);
      });

      // Store auth data
      localStorage.setItem("mindcare_user", JSON.stringify(data.user));
      localStorage.setItem("mindcare_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("mindcare_refresh_token", data.refresh_token);
      }

      toast.success(`Bienvenido ${data.user.nombre}!`);
      onLogin(data.user);
    } catch (error: any) {
      console.error("Login error:", error);

      const localUser = getLocalUser(email, password);
      if (localUser && isNetworkError(error)) {
        localStorage.setItem("mindcare_user", JSON.stringify(localUser));
        localStorage.setItem("mindcare_token", "local-dev-token");
        localStorage.removeItem("mindcare_refresh_token");
        toast.success(`Bienvenido ${localUser.nombre}! (modo local)`);
        onLogin(localUser);
        return;
      }

      if (isNetworkError(error)) {
        toast.error("No se pudo conectar con Supabase. Revisa la configuración del proyecto.");
        return;
      }

      toast.error(error.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E0F2F1] via-white to-[#F3E5F5] p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4DB6AC] mb-2">MindCare</h1>
          <p className="text-muted-foreground">
            Red de Psicólogos Profesional
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="border-border"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-[#4DB6AC] hover:bg-[#26A69A] text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>

            {/* Back to Landing */}
            {onGoToLanding && (
              <div className="mt-6 text-center">
                <button
                  onClick={onGoToLanding}
                  className="text-sm text-muted-foreground hover:text-[#4DB6AC] transition-colors"
                >
                  ← Volver al inicio
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>¿Necesitas ayuda? Contacta a tu administrador</p>
        </div>
      </div>
    </div>
  );
}
