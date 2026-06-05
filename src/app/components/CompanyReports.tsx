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
import { Download, FileText, TrendingUp, Users, Heart, DollarSign } from "lucide-react";
import { Badge } from "./ui/badge";

const wellnessMetrics = [
  { month: "Ene", satisfaccion: 3.8, participacion: 45 },
  { month: "Feb", satisfaccion: 4.1, participacion: 52 },
  { month: "Mar", satisfaccion: 4.3, participacion: 58 },
  { month: "Abr", satisfaccion: 4.5, participacion: 64 },
  { month: "May", satisfaccion: 4.6, participacion: 68 },
  { month: "Jun", satisfaccion: 4.8, participacion: 72 },
];

const departmentWellness = [
  { department: "Desarrollo", satisfaccion: 4.9, sesiones: 28 },
  { department: "Ventas", satisfaccion: 4.7, sesiones: 22 },
  { department: "RH", satisfaccion: 4.8, sesiones: 18 },
  { department: "Marketing", satisfaccion: 4.6, sesiones: 17 },
];

const impactMetrics = [
  { name: "Reducción de Ausentismo", value: 35, color: "#66BB6A" },
  { name: "Mejora en Productividad", value: 28, color: "#42A5F5" },
  { name: "Reducción de Rotación", value: 22, color: "#AB47BC" },
  { name: "Otros Beneficios", value: 15, color: "#FFB74D" },
];

const invoiceData = [
  {
    id: "INV-2025-001",
    date: "30 Jun 2025",
    concept: "Servicio de Salud Mental - Junio",
    amount: 45600,
    sessions: 68,
    status: "paid",
  },
  {
    id: "INV-2025-002",
    date: "31 May 2025",
    concept: "Servicio de Salud Mental - Mayo",
    amount: 42000,
    sessions: 55,
    status: "paid",
  },
  {
    id: "INV-2025-003",
    date: "30 Abr 2025",
    concept: "Servicio de Salud Mental - Abril",
    amount: 48800,
    sessions: 61,
    status: "paid",
  },
];

export function CompanyReports() {
  const [period, setPeriod] = useState("6months");

  const handleExportReport = () => {
    console.log("Exporting wellness report...");
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log("Downloading invoice:", invoiceId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Reportes de Bienestar</h1>
          <p className="text-muted-foreground">
            Impacto del programa en el bienestar de tus empleados
          </p>
        </div>
        <Button variant="outline" onClick={handleExportReport} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Reporte Completo
        </Button>
      </div>

      {/* Filter */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Periodo:</span>
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
          </div>
        </CardContent>
      </Card>

      {/* Key Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Satisfacción Promedio
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl text-foreground">4.8</p>
                  <p className="text-sm text-muted-foreground">/5.0</p>
                </div>
                <p className="text-xs text-[#66BB6A] mt-2">
                  ↑ 26% vs inicio del programa
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#FFB74D]/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-[#FFB74D]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Participación
                </p>
                <p className="text-3xl text-foreground">72%</p>
                <p className="text-xs text-[#66BB6A] mt-2">
                  ↑ 60% vs mes anterior
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Ausentismo Reducido
                </p>
                <p className="text-3xl text-foreground">35%</p>
                <p className="text-xs text-muted-foreground mt-2">
                  vs periodo anterior
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#66BB6A]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#66BB6A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Deducción Fiscal Anual
                </p>
                <p className="text-2xl text-foreground">$273K</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Base imponible
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#81C784]/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#81C784]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wellness Trend */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Evolución del Bienestar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={wellnessMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3F2FD" />
                <XAxis dataKey="month" stroke="#5C7A9E" />
                <YAxis yAxisId="left" stroke="#5C7A9E" />
                <YAxis yAxisId="right" orientation="right" stroke="#5C7A9E" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #BBDEFB",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="satisfaccion"
                  stroke="#42A5F5"
                  strokeWidth={3}
                  name="Satisfacción (1-5)"
                  dot={{ fill: "#42A5F5", r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="participacion"
                  stroke="#66BB6A"
                  strokeWidth={3}
                  name="Participación (%)"
                  dot={{ fill: "#66BB6A", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Impact Distribution */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Distribución del Impacto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={impactMetrics}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {impactMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Wellness */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Bienestar por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentWellness}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3F2FD" />
              <XAxis dataKey="department" stroke="#5C7A9E" />
              <YAxis stroke="#5C7A9E" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #BBDEFB",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="satisfaccion"
                fill="#42A5F5"
                radius={[8, 8, 0, 0]}
                name="Satisfacción (1-5)"
              />
              <Bar
                dataKey="sesiones"
                fill="#66BB6A"
                radius={[8, 8, 0, 0]}
                name="Sesiones Tomadas"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Invoices & Tax Deductions */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Facturas y Deducciones Fiscales</CardTitle>
          <Badge className="bg-primary text-primary-foreground">
            Deducibles de ISR
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoiceData.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-foreground mb-1">{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.concept}
                        </p>
                      </div>
                      <Badge
                        className={
                          invoice.status === "paid"
                            ? "bg-[#66BB6A] text-white"
                            : "bg-[#FFB74D] text-white"
                        }
                      >
                        {invoice.status === "paid" ? "Pagada" : "Pendiente"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>Fecha: {invoice.date}</span>
                      <span>Sesiones: {invoice.sessions}</span>
                      <span className="font-medium text-foreground">
                        ${invoice.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadInvoice(invoice.id)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-accent/30 border border-border">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-foreground mb-1">
                  <strong>Beneficio Fiscal:</strong> Las prestaciones de salud mental son
                  100% deducibles de impuestos
                </p>
                <p className="text-xs text-muted-foreground">
                  Total deducible este año: $273,600 MXN. Todas las facturas cumplen con
                  los requisitos del SAT.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
