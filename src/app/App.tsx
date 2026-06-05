import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { LandingPage } from "./components/LandingPage";
import { MindCareControlLanding } from "./components/MindCareControlLanding";
import { PsychologistApplicationForm } from "./components/PsychologistApplicationForm";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { NetworkDashboard } from "./components/NetworkDashboard";
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
import { ReminderCenter } from "./components/ReminderCenter";
import { BillingManagement } from "./components/BillingManagement";
import { AdminBillingPanel } from "./components/AdminBillingPanel";
import { NetworkPayouts } from "./components/NetworkPayouts";
import { AvailabilitySettings } from "./components/AvailabilitySettings";
import { UserManagement } from "./components/UserManagement";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { supabaseFunction } from "../services/api";
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

export default function App() {
  const [showLanding, setShowLanding] = useState(false);
  const [showControlLanding, setShowControlLanding] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const videoSessionToken = new URLSearchParams(window.location.search).get("video_session");

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
    setShowLanding(false);
    setShowControlLanding(false);
    setShowApplicationForm(false);
    setActiveSection("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("mindcare_user");
    localStorage.removeItem("mindcare_token");
    localStorage.removeItem("mindcare_refresh_token");
    setActiveSection("dashboard");
    setShowLogin(true);
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

  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeSection) {
      case "dashboard":
        if (currentUser.rol === "admin") return <NetworkDashboard />;
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
          />
        );
      case "video-sessions":
        return <VideoSessions currentPsychologistId={currentPsychologistId} />;
      case "psychologists":
        return <PsychologistsList onLoginAsPsychologist={() => {}} isAdmin={currentUser.rol === "admin"} />;
      case "directory":
        return <PsychologistDirectory onViewProfile={(id) => setActiveSection(`psychologist-${id}`)} />;
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
        return <OfficesList />;
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
      case "notifications":
        return <ReminderCenter currentPsychologistId={currentPsychologistId} />;
      case "settings":
        return <Settings />;
      case "profile":
        return <ProfileSettings currentUser={{
          id: currentUser.id,
          name: `${currentUser.nombre} ${currentUser.apellido}`,
          role: getRoleLabel(currentUser.rol),
          avatar: currentUser.foto_perfil
        }} />;
      default:
        if (currentUser.rol === "admin") return <NetworkDashboard />;
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

  // Show login if no user authenticated
  if (!currentUser && !showLanding && !showControlLanding && !showApplicationForm) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onGoToLanding={() => setShowLanding(true)}
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
          onBack={() => {
            setShowApplicationForm(false);
            setShowLanding(true);
          }}
          onGoToControlLanding={() => {
            setShowApplicationForm(false);
            setShowControlLanding(true);
          }}
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
          onEnterApp={() => {
            setShowControlLanding(false);
            setShowLogin(true);
          }}
          onGoToEnterpriseLanding={() => {
            setShowControlLanding(false);
            setShowLanding(true);
          }}
          onShowAuth={() => {
            setShowControlLanding(false);
            setShowLogin(true);
          }}
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
          onEnterApp={() => {
            setShowLanding(false);
            setShowLogin(true);
          }}
          onApplyAsPsychologist={() => {
            setShowLanding(false);
            setShowApplicationForm(true);
          }}
          onGoToControlLanding={() => {
            setShowLanding(false);
            setShowControlLanding(true);
          }}
        />
        <Toaster />
      </>
    );
  }

  // Show app after authentication
  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
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
        userPlan={undefined}
      />
      <Header
        currentUser={{
          id: currentUser.id,
          name: `${currentUser.nombre} ${currentUser.apellido}`,
          role: getRoleLabel(currentUser.rol),
          avatar: currentUser.foto_perfil
        }}
        onBackToAdmin={undefined}
        onNavigate={setActiveSection}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Demo: Landing Switcher */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          className="bg-white shadow-lg"
          onClick={() => {
            setShowLanding(true);
          }}
        >
          🏢 Landing Empresas
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-white shadow-lg"
          onClick={() => {
            setShowControlLanding(true);
          }}
        >
          💼 Landing Control
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-white shadow-lg text-red-600"
          onClick={handleLogout}
        >
          🚪 Cerrar Sesión
        </Button>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 mt-16 p-4 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          {renderContent()}
        </div>
      </main>

      <Toaster />
    </div>
  );
}
