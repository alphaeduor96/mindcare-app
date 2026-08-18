import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { LandingPage } from "./components/LandingPage";
import { MindCareControlLanding } from "./components/MindCareControlLanding";
import { PsychologistApplicationForm } from "./components/PsychologistApplicationForm";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { CompanyDashboard } from "./components/CompanyDashboard";
import { CompanyReports } from "./components/CompanyReports";
import { EmployeeDashboard } from "./components/EmployeeDashboard";
import { EmployeeAppointments } from "./components/EmployeeAppointments";
import { Dashboard } from "./components/Dashboard";
import { CalendarView } from "./components/CalendarView";
import { VideoSessions } from "./components/VideoSessions";
import { VideoSessionAccess } from "./components/VideoSessionAccess";
import { PsychologistsList } from "./components/PsychologistsList";
import { PsychologistDirectory } from "./components/PsychologistDirectory";
import { PsychologistFullProfile } from "./components/PsychologistFullProfile";
import { CompaniesList } from "./components/CompaniesList";
import { EmployeesList } from "./components/EmployeesList";
import { PatientsList } from "./components/PatientsList";
import { ClinicalRecords } from "./components/ClinicalRecords";
import { PaymentsList } from "./components/PaymentsList";
import { OfficesList } from "./components/OfficesList";
import { ProfileSettings } from "./components/ProfileSettings";
import { Settings } from "./components/Settings";
import { Reports } from "./components/Reports";
import { FeatureFeedback } from "./components/FeatureFeedback";
import { BillingManagement } from "./components/BillingManagement";
import { AdminBillingPanel } from "./components/AdminBillingPanel";
import { NetworkPayouts } from "./components/NetworkPayouts";
import { AvailabilitySettings } from "./components/AvailabilitySettings";
import { UserManagement } from "./components/UserManagement";
import { DataStatusBanner } from "./components/DataStatusBanner";
import { Toaster } from "./components/ui/sonner";
import { ensurePsychologistProfileId, supabaseFunction, supabaseRest } from "../services/api";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: "admin" | "psicologo" | "empresa" | "empleado";
  telefono?: string;
  foto_perfil?: string;
  activo: boolean;
}

const psychologists: Array<{ id: string; name: string }> = [];
const patients: Array<{ id: string; name: string }> = [];

type UserRole = "admin" | "psicologo" | "empresa" | "empleado";
type AppointmentDefaultView = "calendar" | "list";
type AuthInitialMode = "login" | "signup";
type DataStatus = {
  status: "demo" | "partial";
  detail: string;
};
type PsychologistPlan = "basico" | "intermedio" | "pro" | "afiliado";
type PublicRoute = "empresas" | "psicologos" | "directorio" | "aplicar";

interface PsychologistSubscriptionRow {
  planes_suscripcion_psicologo?: {
    codigo?: string | null;
  } | null;
}

const PUBLIC_ROUTE_PATHS: Record<PublicRoute, string> = {
  empresas: "/empresas",
  psicologos: "/psicologos",
  directorio: "/directorio",
  aplicar: "/aplicar",
};

const PSYCHOLOGIST_ROUTE_ALIASES = new Set([
  "/psicologo",
  "/psicologos",
  "/psicólogos",
  "/psicologoos",
  "/psiclogoos",
  "/psicolgoos",
]);

function normalizePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function isAppHostname(hostname: string) {
  return hostname === "app.mindcare.mx" || hostname.startsWith("app.");
}

function isMindCareMarketingHostname(hostname: string) {
  return hostname === "mindcare.mx" || hostname === "www.mindcare.mx";
}

function getPublicRouteFromLocation(): PublicRoute | null {
  const hostname = window.location.hostname;
  const path = normalizePath(window.location.pathname);

  if (path === PUBLIC_ROUTE_PATHS.empresas) return "empresas";
  if (path === PUBLIC_ROUTE_PATHS.directorio) return "directorio";
  if (path === PUBLIC_ROUTE_PATHS.aplicar) return "aplicar";
  if (PSYCHOLOGIST_ROUTE_ALIASES.has(path)) return "psicologos";

  if (isAppHostname(hostname)) return null;
  if (isMindCareMarketingHostname(hostname) && path === "/") return "psicologos";

  return null;
}

function getAppBaseUrl() {
  const configuredUrl = import.meta.env.VITE_APP_BASE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");
  if (isLocalHostname(window.location.hostname) || isAppHostname(window.location.hostname)) {
    return window.location.origin;
  }
  return "https://app.mindcare.mx";
}

function getAuthInitialModeFromLocation(): AuthInitialMode {
  const params = new URLSearchParams(window.location.search);
  return params.get("auth") === "signup" ? "signup" : "login";
}

export default function App() {
  const [publicRoute, setPublicRoute] = useState<PublicRoute | null>(() => getPublicRouteFromLocation());
  const [showLogin, setShowLogin] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<AuthInitialMode>(() => getAuthInitialModeFromLocation());
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [appointmentDefaultView, setAppointmentDefaultView] = useState<AppointmentDefaultView>(() => {
    const stored = localStorage.getItem("mindcare_appointment_default_view");
    return stored === "list" ? "list" : "calendar";
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const storedTheme = localStorage.getItem("mindcare_theme");
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserPlan, setCurrentUserPlan] = useState<PsychologistPlan | undefined>(undefined);
  const videoSessionToken = new URLSearchParams(window.location.search).get("video_session");
  const showLanding = publicRoute === "empresas";
  const showControlLanding = publicRoute === "psicologos";
  const showApplicationForm = publicRoute === "aplicar";
  const showPublicDirectory = publicRoute === "directorio";
  const isPrivateAppView =
    Boolean(currentUser) &&
    !videoSessionToken &&
    !showLanding &&
    !showControlLanding &&
    !showApplicationForm &&
    !showPublicDirectory;

  const navigateToPublicRoute = (route: PublicRoute | null, options: { replace?: boolean } = {}) => {
    const nextPath = route ? PUBLIC_ROUTE_PATHS[route] : "/";
    if (normalizePath(window.location.pathname) !== nextPath || window.location.search || window.location.hash) {
      const historyMethod = options.replace ? "replaceState" : "pushState";
      window.history[historyMethod]({}, "", nextPath);
    }
    setPublicRoute(route);
    if (route) setShowLogin(false);
  };

  const openAppLogin = (mode: AuthInitialMode = "login") => {
    const appBaseUrl = getAppBaseUrl();

    if (appBaseUrl !== window.location.origin) {
      window.location.href = mode === "signup" ? `${appBaseUrl}?auth=signup` : appBaseUrl;
      return;
    }

    setAuthInitialMode(mode);
    navigateToPublicRoute(null);
    setShowLogin(true);
  };

  useEffect(() => {
    const syncRoute = () => setPublicRoute(getPublicRouteFromLocation());
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    const canonicalPath = publicRoute ? PUBLIC_ROUTE_PATHS[publicRoute] : null;
    if (canonicalPath && normalizePath(window.location.pathname) !== canonicalPath) {
      window.history.replaceState({}, "", canonicalPath);
    }
  }, [publicRoute]);

  useEffect(() => {
    if (!isPrivateAppView) {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
      return;
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("mindcare_theme", theme);
  }, [isPrivateAppView, theme]);

  // Check for stored auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("mindcare_user");
    const storedToken = localStorage.getItem("mindcare_token");

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("mindcare_user");
        localStorage.removeItem("mindcare_token");
        localStorage.removeItem("mindcare_refresh_token");
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUserPlan = async () => {
      if (currentUser?.rol !== "psicologo") {
        setCurrentUserPlan(undefined);
        return;
      }

      try {
        const profileId = await ensurePsychologistProfileId(currentUser.id);
        if (!profileId) {
          if (!cancelled) setCurrentUserPlan("basico");
          return;
        }

        const subscriptions = await supabaseRest<PsychologistSubscriptionRow[]>(
          `/suscripciones_psicologo?psicologo_id=eq.${profileId}&estado=eq.activa&select=planes_suscripcion_psicologo(codigo)&limit=1`
        );
        const planCode = subscriptions[0]?.planes_suscripcion_psicologo?.codigo;
        const validPlan = ["basico", "intermedio", "pro", "afiliado"].includes(planCode || "")
          ? planCode as PsychologistPlan
          : "basico";

        if (!cancelled) setCurrentUserPlan(validPlan);
      } catch (error) {
        console.warn("No se pudo cargar el plan del psicólogo:", error);
        if (!cancelled) setCurrentUserPlan("basico");
      }
    };

    loadCurrentUserPlan();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.rol]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("stripe_setup_session_id");
    const cancelled = params.get("stripe_setup_cancelled");
    const isPopup = params.get("stripe_setup_popup") === "1";

    if (!sessionId && !cancelled) return;

    const notifyParent = (status: "success" | "cancelled" | "error") => {
      try {
        new BroadcastChannel("mindcare-stripe-setup").postMessage({ status });
      } catch (error) {
        console.warn("Stripe setup broadcast failed:", error);
      }
    };

    if (cancelled) {
      notifyParent("cancelled");
      toast.info("Registro de método de pago cancelado");
      window.history.replaceState({}, "", window.location.pathname);
      if (isPopup) window.setTimeout(() => window.close(), 700);
      return;
    }

    supabaseFunction("stripe-sync-setup-session", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(() => {
        notifyParent("success");
        toast.success("Método de pago guardado correctamente");
      })
      .catch((error: any) => {
        console.error("Stripe sync error:", error);
        notifyParent("error");
        toast.error(`No se pudo sincronizar el método de pago. ${error?.message || ""}`);
      })
      .finally(() => {
        window.history.replaceState({}, "", window.location.pathname);
        if (isPopup) window.setTimeout(() => window.close(), 900);
      });
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setShowLogin(false);
    setAuthInitialMode("login");
    navigateToPublicRoute(null, { replace: true });
    setActiveSection("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("mindcare_user");
    localStorage.removeItem("mindcare_token");
    localStorage.removeItem("mindcare_refresh_token");
    setActiveSection("dashboard");
    setShowLogin(true);
    navigateToPublicRoute(null, { replace: true });
  };

  const handleAppointmentDefaultViewChange = (view: AppointmentDefaultView) => {
    setAppointmentDefaultView(view);
    localStorage.setItem("mindcare_appointment_default_view", view);
  };

  const openPublicDirectory = () => {
    navigateToPublicRoute("directorio");
  };

  const closePublicDirectory = () => {
    navigateToPublicRoute("psicologos");
  };

  const getRoleLabel = (rol: UserRole): string => {
    switch (rol) {
      case "admin":
        return "Administrador";
      case "psicologo":
        return "Psicólogo";
      case "empresa":
        return "Empresa";
      case "empleado":
        return "Empleado";
      default:
        return rol;
    }
  };

  const currentPsychologistId = currentUser?.rol === "psicologo" ? currentUser.id : undefined;

  const getDataStatus = (): DataStatus | null => {
    if (!currentUser) return null;

    if (activeSection === "dashboard") {
      if (currentUser.rol === "admin") {
        return null;
      }
      if (currentUser.rol === "empresa") {
        return {
          status: "demo",
          detail: "El panel de empresa todavía usa métricas, gráficas y actividad de ejemplo.",
        };
      }
      if (currentUser.rol === "empleado") {
        return {
          status: "demo",
          detail: "El panel de empleado todavía usa sesiones y datos de ejemplo.",
        };
      }
      return null;
    }

    if (activeSection.startsWith("psychologist-")) {
      return {
        status: "demo",
        detail: "El perfil público abierto desde el directorio todavía usa información de ejemplo.",
      };
    }

    const statusBySection: Record<string, DataStatus> = {
      companies: {
        status: "partial",
        detail: "Empresas usa endpoints reales antiguos, pero aún falta validar todo el CRUD y reemplazar métricas auxiliares.",
      },
      employees: {
        status: "demo",
        detail: "La lista de empleados todavía usa datos de ejemplo y no está conectada al padrón real.",
      },
      "user-management": {
        status: "partial",
        detail: "La gestión general de usuarios usa el flujo antiguo; el alta completa real ya está implementada solo para psicólogos.",
      },
      directory: {
        status: "partial",
        detail: "El directorio ya consulta perfiles reales públicos; faltan reseñas detalladas y edición de perfil público.",
      },
      availability: {
        status: "partial",
        detail: "La disponibilidad se edita en pantalla, pero todavía no se guarda ni se lee desde la base de datos.",
      },
      reports: {
        status: "demo",
        detail: "Los reportes todavía usan métricas y gráficas de ejemplo.",
      },
      feedback: {
        status: "demo",
        detail: "Las sugerencias de mejora todavía se guardan solo en estado local de la pantalla.",
      },
      billing: {
        status: "partial",
        detail: "La suscripción ya lee planes y límites desde Supabase. Los métodos de pago dependen de Stripe, Edge Functions y configuración final.",
      },
      "network-payouts": {
        status: "demo",
        detail: "Los cortes MindCare todavía usan sesiones, montos e historial de ejemplo.",
      },
      settings: {
        status: "partial",
        detail: "La configuración todavía no persiste todos los cambios en Supabase.",
      },
      profile: {
        status: "partial",
        detail: "Nombre, teléfono y contraseña ya se actualizan en Supabase. La sección fiscal sigue como prototipo visual.",
      },
    };

    if (activeSection === "appointments" && currentUser.rol === "empleado") {
      return {
        status: "demo",
        detail: "Las citas del empleado todavía se muestran con información de ejemplo.",
      };
    }

    return statusBySection[activeSection] || null;
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeSection) {
      case "dashboard":
        if (currentUser.rol === "admin") {
          return <PsychologistsList isAdmin />;
        }
        if (currentUser.rol === "empresa") return <CompanyDashboard />;
        if (currentUser.rol === "empleado") return <EmployeeDashboard />;
        return <Dashboard currentUser={currentUser} />;
      case "appointments":
        if (currentUser.rol === "empleado") {
          return <EmployeeAppointments />;
        }
        return (
          <CalendarView
            currentPsychologistId={currentPsychologistId}
            psychologists={psychologists}
            patients={patients}
            defaultTab={appointmentDefaultView}
          />
        );
      case "video-sessions":
        return <VideoSessions currentPsychologistId={currentPsychologistId} />;
      case "psychologists":
        return <PsychologistsList isAdmin={currentUser.rol === "admin"} />;
      case "directory":
        return <PsychologistDirectory />;
      case activeSection.startsWith("psychologist-") ? activeSection : "":
        const psychologistId = parseInt(activeSection.split("-")[1]);
        const psychologist = {
          id: psychologistId,
          name: "Dr. Carlos Ruiz",
          specialty: "Terapia Cognitivo-Conductual",
          zone: "Centro",
          rating: 4.9,
          reviews: 127,
          baseRate: 800,
          nextAvailable: "Mañana 10:00 AM",
          avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop",
          description: "Especialista en ansiedad, depresión y trastornos del estado de ánimo.",
        };
        return (
          <PsychologistFullProfile
            psychologist={psychologist}
            onBack={() => setActiveSection("directory")}
          />
        );
      case "companies":
        return <CompaniesList />;
      case "employees":
        return <EmployeesList />;
      case "user-management":
        return <UserManagement />;
      case "admin-billing":
        return <AdminBillingPanel />;
      case "patients":
        return (
          <PatientsList
            currentPsychologistId={currentPsychologistId}
            psychologists={psychologists}
          />
        );
      case "clinical-records":
        return <ClinicalRecords currentPsychologistId={currentPsychologistId} />;
      case "payments":
        return (
          <PaymentsList
            currentPsychologistId={currentPsychologistId}
            psychologists={psychologists}
            patients={patients}
          />
        );
      case "offices":
        return <OfficesList currentPsychologistId={currentPsychologistId} />;
      case "availability":
        return (
          <AvailabilitySettings
            psychologistName={`${currentUser.nombre} ${currentUser.apellido}`}
            isPlanAffiliated={true}
          />
        );
      case "reports":
        if (currentUser.rol === "empresa") {
          return <CompanyReports />;
        }
        return <Reports userRole={currentUser.rol === "psicologo" ? "psychologist" : "admin"} currentPsychologistId={currentPsychologistId} />;
      case "feedback":
        return <FeatureFeedback />;
      case "billing":
        return (
          <BillingManagement
            currentPlan={"basico"}
            currentPsychologistId={currentPsychologistId}
            onPlanChange={() => {}}
          />
        );
      case "network-payouts":
        return <NetworkPayouts psychologistName={`${currentUser.nombre} ${currentUser.apellido}`} />;
      case "settings":
        return (
          <Settings
            userRole={currentUser.rol}
            userId={currentUser.id}
            appointmentDefaultView={appointmentDefaultView}
            onAppointmentDefaultViewChange={handleAppointmentDefaultViewChange}
          />
        );
      case "profile":
        return <ProfileSettings currentUser={{
          id: currentUser.id,
          name: `${currentUser.nombre} ${currentUser.apellido}`,
          role: getRoleLabel(currentUser.rol),
          avatar: currentUser.foto_perfil,
          email: currentUser.email,
          phone: currentUser.telefono || "",
        }} onUserUpdated={(updates) => {
          setCurrentUser((user) => {
            if (!user) return user;
            const updatedUser = {
              ...user,
              ...updates,
            };
            localStorage.setItem("mindcare_user", JSON.stringify(updatedUser));
            return updatedUser;
          });
        }} />;
      default:
        if (currentUser.rol === "admin") {
          return <PsychologistsList isAdmin />;
        }
        if (currentUser.rol === "empresa") return <CompanyDashboard />;
        if (currentUser.rol === "empleado") return <EmployeeDashboard />;
        return <Dashboard currentUser={currentUser} />;
    }
  };

  if (videoSessionToken) {
    return (
      <>
        <VideoSessionAccess token={videoSessionToken} />
        <Toaster />
      </>
    );
  }

  if (showPublicDirectory) {
    return (
      <>
        <PsychologistDirectory
          publicMode
          onBack={closePublicDirectory}
          onShowAuth={openAppLogin}
        />
        <Toaster />
      </>
    );
  }

  // Show login if no user authenticated
  if (!currentUser && !showLanding && !showControlLanding && !showApplicationForm) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onGoToLanding={() => navigateToPublicRoute("psicologos")}
          initialMode={authInitialMode}
        />
        <Toaster />
      </>
    );
  }

  // Show psychologist application form
  if (showApplicationForm) {
    return (
      <>
        <PsychologistApplicationForm
          onBack={() => navigateToPublicRoute("psicologos")}
          onGoToControlLanding={() => navigateToPublicRoute("psicologos")}
        />
        <Toaster />
      </>
    );
  }

  // Show MindCare Control landing
  if (showControlLanding) {
    return (
      <>
        <MindCareControlLanding
          onEnterApp={openAppLogin}
          onGoToEnterpriseLanding={() => navigateToPublicRoute("empresas")}
          onShowAuth={openAppLogin}
          onShowSignup={() => openAppLogin("signup")}
          onApplyAsPsychologist={() => navigateToPublicRoute("aplicar")}
          onOpenDirectory={openPublicDirectory}
        />
        <Toaster />
      </>
    );
  }

  // Show enterprise landing page
  if (showLanding) {
    return (
      <>
        <LandingPage
          onEnterApp={openAppLogin}
          onApplyAsPsychologist={() => navigateToPublicRoute("psicologos")}
          onGoToControlLanding={() => navigateToPublicRoute("psicologos")}
        />
        <Toaster />
      </>
    );
  }

  // Show app after authentication
  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onGoToLanding={() => navigateToPublicRoute("psicologos")}
          initialMode={authInitialMode}
        />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-role={currentUser.rol}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setSidebarOpen(false);
        }}
        userRole={currentUser.rol}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
        userPlan={currentUserPlan}
      />
      <Header
        currentUser={{
          id: currentUser.id,
          name: `${currentUser.nombre} ${currentUser.apellido}`,
          role: getRoleLabel(currentUser.rol),
          avatar: currentUser.foto_perfil,
          plan: currentUserPlan
        }}
        onBackToAdmin={undefined}
        onNavigate={setActiveSection}
        onMenuClick={() => {
          if (window.innerWidth >= 1024) {
            setSidebarCollapsed((collapsed) => !collapsed);
            return;
          }
          setSidebarOpen(!sidebarOpen);
        }}
        sidebarCollapsed={sidebarCollapsed}
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main
        className={`${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } mt-16 p-4 md:p-6 lg:p-8 transition-all duration-300`}
      >
        <div className={`${activeSection === "appointments" ? "max-w-[1800px]" : "max-w-[1400px]"} mx-auto`}>
          {getDataStatus() && (
            <DataStatusBanner
              status={getDataStatus()!.status}
              detail={getDataStatus()!.detail}
            />
          )}
          {renderContent()}
        </div>
      </main>

      <Toaster />
    </div>
  );
}
