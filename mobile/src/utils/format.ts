export function fullPatientName(patient?: { nombre?: string | null; apellido?: string | null } | null) {
  return `${patient?.nombre || ""} ${patient?.apellido || ""}`.trim() || "Paciente sin nombre";
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCurrency(cents?: number | null) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);
}
