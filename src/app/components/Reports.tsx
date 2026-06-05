import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, Calendar as CalendarIcon, TrendingUp, Users, DollarSign } from "lucide-react";

interface ReportsProps {
  userRole: "admin" | "psychologist";
  currentPsychologistId?: string;
}

const monthlyData = [
  { month: "Ene", citas: 45, ingresos: 36000, pacientes: 12 },
  { month: "Feb", citas: 52, ingresos: 41600, pacientes: 15 },
  { month: "Mar", citas: 48, ingresos: 38400, pacientes: 14 },
  { month: "Abr", citas: 61, ingresos: 48800, pacientes: 18 },
  { month: "May", citas: 55, ingresos: 44000, pacientes: 16 },
  { month: "Jun", citas: 67, ingresos: 53600, pacientes: 20 },
];

const appointmentStatusData = [
  { name: "Completadas", value: 156, color: "#81C784" },
  { name: "Canceladas", value: 23, color: "#EF5350" },
  { name: "Pendientes", value: 12, color: "#FFB74D" },
];

const psychologistPerformance = [
  { name: "Dr. Carlos Ruiz", citas: 67, ingresos: 53600 },
  { name: "Dra. María López", citas: 58, ingresos: 49300 },
  { name: "Dr. Juan Torres", citas: 45, ingresos: 33750 },
  { name: "Dra. Laura Martínez", citas: 52, ingresos: 46800 },
];

export function Reports({ userRole, currentPsychologistId }: ReportsProps) {
  const [period, setPeriod] = useState("6months");
  const [reportType, setReportType] = useState("general");

  const handleExport = () => {
    console.log("Exporting report...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Reportes y Análisis</h1>
          <p className="text-muted-foreground">
            {userRole === "admin"
              ? "Vista general del rendimiento de la clínica"
              : "Análisis de tu desempeño profesional"}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Periodo:</span>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] bg-input-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="year">Último año</SelectItem>
              </SelectContent>
            </Select>

            {userRole === "admin" && (
              <>
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[180px] bg-input-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="psychologists">Por Psicólogo</SelectItem>
                    <SelectItem value="patients">Por Paciente</SelectItem>
                    <SelectItem value="financial">Financiero</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Citas</p>
                <p className="text-3xl text-foreground">328</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="text-[#81C784]">↑ 12%</span> vs periodo anterior
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {userRole === "admin" ? "Pacientes Totales" : "Mis Pacientes"}
                </p>
                <p className="text-3xl text-foreground">{userRole === "admin" ? "95" : "24"}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="text-[#81C784]">↑ 8%</span> vs periodo anterior
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#81C784]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#81C784]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ingresos</p>
                <p className="text-3xl text-foreground">$262K</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="text-[#81C784]">↑ 15%</span> vs periodo anterior
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#66BB6A]/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#66BB6A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tasa Completado</p>
                <p className="text-3xl text-foreground">95%</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="text-[#81C784]">↑ 3%</span> vs periodo anterior
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#4DD0E1]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#4DD0E1]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citas e Ingresos */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Citas e Ingresos Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0F2F1" />
                <XAxis dataKey="month" stroke="#607D8B" />
                <YAxis stroke="#607D8B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E0F2F1",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar key="bar-citas" dataKey="citas" fill="#4DB6AC" name="Citas" radius={[8, 8, 0, 0]} />
                <Bar key="bar-pacientes" dataKey="pacientes" fill="#81C784" name="Pacientes" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Estado de Citas */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Estado de Citas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {appointmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Psychologist Performance (Admin only) */}
      {userRole === "admin" && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Rendimiento por Psicólogo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={psychologistPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E0F2F1" />
                <XAxis type="number" stroke="#607D8B" />
                <YAxis dataKey="name" type="category" width={150} stroke="#607D8B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E0F2F1",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar key="bar-citas-performance" dataKey="citas" fill="#4DB6AC" name="Citas" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tendencia de Ingresos */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Tendencia de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0F2F1" />
              <XAxis dataKey="month" stroke="#607D8B" />
              <YAxis stroke="#607D8B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #E0F2F1",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                key="line-ingresos"
                type="monotone"
                dataKey="ingresos"
                stroke="#66BB6A"
                strokeWidth={3}
                name="Ingresos ($)"
                dot={{ fill: "#66BB6A", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
