import { publicAnonKey, supabaseUrl } from "../../services/api";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Label } from "./ui/label";
import { ArrowLeft, Eye, EyeOff, LogIn, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import mindcareIsotype from "../../assets/mindcare-isotype.png";
import mindcareLoginLeftPanel from "../../assets/mindcare-login-left-panel.png";

interface LoginPageProps {
  onLogin: (user: any) => void;
  onGoToLanding?: () => void;
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

async function fetchUserProfile(userId: string, accessToken: string) {
  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/usuarios?id=eq.${userId}&select=*`,
    {
      headers: {
        apikey: publicAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!profileResponse.ok) return null;

  const profiles = await profileResponse.json();
  return profiles?.[0] || null;
}

async function waitForUserProfile(userId: string, accessToken: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const profile = await fetchUserProfile(userId, accessToken);
    if (profile) return profile;
    await new Promise((resolve) => window.setTimeout(resolve, 350));
  }

  return null;
}

async function signupPsychologistWithSupabase(data: {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  email: string;
  phone: string;
  password: string;
}) {
  const apellido = [data.paternalLastName, data.maternalLastName].filter(Boolean).join(" ");
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publicAnonKey,
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({
      email: data.email.toLowerCase().trim(),
      password: data.password,
      data: {
        nombre: data.firstName.trim(),
        apellido,
        apellido_paterno: data.paternalLastName.trim(),
        apellido_materno: data.maternalLastName.trim(),
        telefono: data.phone.trim(),
        rol: "psicologo",
        signup_source: "self_service",
      },
    }),
  });

  const authData = await response.json();

  if (!response.ok) {
    throw new Error(getAuthErrorMessage(authData) || "No se pudo crear la cuenta");
  }

  if (!authData.session?.access_token) {
    return {
      requiresEmailConfirmation: true,
      email: authData.user?.email || data.email,
    };
  }

  const profile = await waitForUserProfile(authData.user.id, authData.session.access_token);
  const user = profile || {
    id: authData.user.id,
    email: authData.user.email,
    nombre: data.firstName.trim(),
    apellido,
    telefono: data.phone.trim(),
    rol: "psicologo",
    activo: true,
  };

  return {
    user: {
      ...user,
      activo: user.activo ?? user.estado === "activo",
    },
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
    session: authData.session,
  };
}

export function LoginPage({ onLogin, onGoToLanding }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupData, setSignupData] = useState({
    firstName: "",
    paternalLastName: "",
    maternalLastName: "",
    email: "",
    phone: "",
    password: "",
  });
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
      const data = await loginWithSupabaseAuth(email, password);

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

      if (isNetworkError(error)) {
        toast.error("No se pudo conectar con Supabase. Revisa la configuración del proyecto.");
        return;
      }

      toast.error(error.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !signupData.firstName ||
      !signupData.paternalLastName ||
      !signupData.maternalLastName ||
      !signupData.email ||
      !signupData.phone ||
      !signupData.password
    ) {
      toast.error("Completa todos los campos para crear tu cuenta");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      toast.error("Ingresa un correo válido");
      return;
    }

    if (signupData.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const data = await signupPsychologistWithSupabase(signupData);

      if ("requiresEmailConfirmation" in data) {
        toast.success(`Cuenta creada. Revisa ${data.email} para confirmar tu correo.`);
        setMode("login");
        setEmail(signupData.email);
        setPassword("");
        return;
      }

      localStorage.setItem("mindcare_user", JSON.stringify(data.user));
      localStorage.setItem("mindcare_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("mindcare_refresh_token", data.refresh_token);
      }

      toast.success(`Cuenta creada. Bienvenido ${data.user.nombre}!`);
      onLogin(data.user);
    } catch (error: any) {
      console.error("Signup error:", error);

      if (isNetworkError(error)) {
        toast.error("No se pudo conectar con Supabase. Revisa la configuración del proyecto.");
        return;
      }

      const message = String(error?.message || "");
      if (message.toLowerCase().includes("already registered") || message.toLowerCase().includes("already exists")) {
        toast.error("Ese correo ya está registrado. Inicia sesión o usa otro correo.");
        return;
      }

      toast.error(message || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#F4FBFA] text-[#132A33]">
      <div className="grid h-full lg:[grid-template-columns:min(38vw,58vh)_1fr]">
        <aside className="relative hidden overflow-hidden bg-[#0A5961] lg:flex lg:items-center lg:justify-center">
          <button
            type="button"
            onClick={onGoToLanding}
            className="h-full w-full text-left"
            title="Ir a la landing de psicólogos"
          >
            <img
              src={mindcareLoginLeftPanel}
              alt="MindCare Red de Psicólogos Profesional"
              className="h-full w-full object-contain object-center"
            />
          </button>
        </aside>

        <main className="flex h-dvh min-h-0 items-center justify-center overflow-hidden px-5 py-4 sm:px-8 lg:px-10">
          <div className="w-full max-w-[500px]">
            <div className="mb-8 flex justify-center lg:hidden">
              <button type="button" onClick={onGoToLanding} className="inline-flex items-center gap-3">
                <img src={mindcareIsotype} alt="MindCare" className="h-14 w-14 object-contain" />
                <div className="text-left">
                  <p className="text-3xl font-semibold tracking-tight text-[#087780]">MindCare</p>
                  <p className="text-sm text-[#58707A]">Red de Psicólogos Profesional</p>
                </div>
              </button>
            </div>

            <Card className="rounded-[22px] border-[#C9E3E1] bg-white/82 shadow-[0_24px_90px_rgba(0,75,82,0.10)] backdrop-blur-xl">
              <CardContent className="p-6 sm:p-8 md:p-10">
                <div className="mb-6">
                  <p className="mb-3 text-base font-medium text-[#007F86]">
                    {mode === "login" ? "Tu espacio profesional" : "Comienza con MindCare"}
                  </p>
                  <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.01em] text-[#122C36] sm:text-[36px]">
                    {mode === "login" ? "Bienvenido de nuevo" : "Crear cuenta gratis"}
                  </h1>
                  <p className="mt-2 text-base text-[#5F6F82]">
                    {mode === "login"
                      ? "Continúa donde dejaste tu trabajo."
                      : "Alta gratuita para psicólogos. No necesitas tarjeta."}
                  </p>
                </div>

                {mode === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm text-[#132A33]">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                        className="h-12 rounded-xl border-[#D1DDE2] bg-white px-4 text-base text-[#132A33] shadow-sm transition focus-visible:ring-[#00959B]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm text-[#132A33]">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          required
                          className="h-12 rounded-xl border-[#D1DDE2] bg-white px-4 pr-12 text-base text-[#132A33] shadow-sm transition focus-visible:ring-[#00959B]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7B8C] hover:text-[#132A33]"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <div className="text-right">
                        <button type="button" className="text-sm text-[#008D94] hover:text-[#006A70]">
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="h-12 w-full rounded-xl bg-[#34B9B3] text-base font-semibold text-white shadow-[0_18px_35px_rgba(52,185,179,0.25)] hover:bg-[#179E9B]"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Ingresando...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-3 h-5 w-5" />
                          Iniciar sesión
                        </>
                      )}
                    </Button>

                    <div className="text-center text-sm text-[#5F6F82]">
                      ¿Eres psicólogo y aún no tienes cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("signup")}
                        className="font-medium text-[#008D94] hover:text-[#006A70]"
                      >
                        Crear cuenta gratis
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="signup-first-name" className="text-[#132A33]">Nombre</Label>
                        <Input
                          id="signup-first-name"
                          placeholder="Eduardo"
                          value={signupData.firstName}
                          onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                          disabled={loading}
                          required
                          className="h-12 rounded-xl border-[#D1DDE2] bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-paternal" className="text-[#132A33]">Apellido paterno</Label>
                        <Input
                          id="signup-paternal"
                          placeholder="Ortega"
                          value={signupData.paternalLastName}
                          onChange={(e) => setSignupData({ ...signupData, paternalLastName: e.target.value })}
                          disabled={loading}
                          required
                          className="h-12 rounded-xl border-[#D1DDE2] bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-maternal" className="text-[#132A33]">Apellido materno</Label>
                        <Input
                          id="signup-maternal"
                          placeholder="Ramírez"
                          value={signupData.maternalLastName}
                          onChange={(e) => setSignupData({ ...signupData, maternalLastName: e.target.value })}
                          disabled={loading}
                          required
                          className="h-12 rounded-xl border-[#D1DDE2] bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-[#132A33]">Correo</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        disabled={loading}
                        required
                        className="h-12 rounded-xl border-[#D1DDE2] bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className="text-[#132A33]">Celular</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+52 33 1234 5678"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        disabled={loading}
                        required
                        className="h-12 rounded-xl border-[#D1DDE2] bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-[#132A33]">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          disabled={loading}
                          required
                          className="h-12 rounded-xl border-[#D1DDE2] bg-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7B8C] hover:text-[#132A33]"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-[#5F6F82]">
                        Plan gratis activo hasta topar el límite mensual de citas.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="h-14 w-full rounded-xl bg-[#34B9B3] text-base font-semibold text-white shadow-[0_18px_35px_rgba(52,185,179,0.22)] hover:bg-[#179E9B]"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Creando cuenta...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-3 h-5 w-5" />
                          Crear cuenta gratis
                        </>
                      )}
                    </Button>

                    <div className="text-center text-base text-[#5F6F82]">
                      ¿Ya tienes cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="font-medium text-[#008D94] hover:text-[#006A70]"
                      >
                        Iniciar sesión
                      </button>
                    </div>
                  </form>
                )}

                {onGoToLanding && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={onGoToLanding}
                    className="inline-flex items-center gap-2 text-sm text-[#4F6273] transition-colors hover:text-[#008D94]"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver al inicio
                    </button>
                  </div>
                )}

                <div className="mt-6 border-t border-[#CADDDD] pt-5">
                  <div className="flex items-center justify-center gap-3 text-sm text-[#5F6F82]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0F2F1] text-[#087780]">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <span>Tus datos están protegidos y cifrados.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-5 text-center text-sm text-[#5F6F82]">
              ¿Necesitas ayuda?{" "}
              <button
                type="button"
                className="font-medium text-[#008D94]"
              >
                Contacta a tu administrador
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
