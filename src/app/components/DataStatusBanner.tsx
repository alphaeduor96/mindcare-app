import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface DataStatusBannerProps {
  status: "demo" | "partial";
  detail?: string;
}

const content = {
  demo: {
    title: "Información demo",
    description:
      "Esta pantalla todavía muestra datos de ejemplo. No representa información real de la base de datos.",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    iconClassName: "text-amber-600",
    icon: AlertTriangle,
  },
  partial: {
    title: "Integración parcial",
    description:
      "Esta pantalla ya tiene parte de la conexión real, pero todavía conserva datos simulados o acciones pendientes de conectar.",
    className: "border-blue-200 bg-blue-50 text-blue-950",
    iconClassName: "text-blue-600",
    icon: Info,
  },
};

export function DataStatusBanner({ status, detail }: DataStatusBannerProps) {
  const state = content[status];
  const Icon = state.icon;

  return (
    <Alert className={`${state.className} mb-4`}>
      <Icon className={state.iconClassName} />
      <AlertTitle>{state.title}</AlertTitle>
      <AlertDescription>
        {detail || state.description}
      </AlertDescription>
    </Alert>
  );
}
