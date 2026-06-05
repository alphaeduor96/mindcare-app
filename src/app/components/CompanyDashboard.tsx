import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Users,
  Calendar,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const statsData = [
  {
    title: "Total Empleados",
    value: "150",
    change: "+5 este mes",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Sesiones Usadas",
    value: "85",
    change: "28% del total",
    icon: Calendar,
    color: "text-[#4DD0E1]",
    bgColor: "bg-[#4DD0E1]/10",
  },
  {
    title: "Sesiones Disponibles",
    value: "215",
    change: "72% del total",
    icon: CheckCircle2,
    color: "text-[#81C784]",
    bgColor: "bg-[#81C784]/10",
  },
  {
    title: "Tasa de Uso",
    value: "57%",
    change: "+12% vs mes anterior",
    icon: TrendingUp,
    color: "text-[#66BB6A]",
    bgColor: "bg-[#66BB6A]/10",
  },
];

const monthlyUsage = [
  { month: "Ene", sesiones: 45 },
  { month: "Feb", sesiones: 52 },
  { month: "Mar", sesiones: 48 },
  { month: "Abr", sesiones: 61 },
  { month: "May", sesiones: 55 },
  { month: "Jun", sesiones: 68 },
];

const departmentUsage = [
  { department: "Desarrollo", sesiones: 28 },
  { department: "Ventas", sesiones: 22 },
  { department: "RH", sesiones: 18 },
  { department: "Marketing", sesiones: 17 },
];

const recentActivity = [
  {
    id: 1,
    message: "Carlos Mendoza agendó sesión con Dr. Carlos Ruiz",
    time: "Hace 2 horas",
  },
  {
    id: 2,
    message: "Ana Rodríguez completó su sesión",
    time: "Hace 5 horas",
  },
  {
    id: 3,
    message: "15 nuevos empleados agregados al programa",
    time: "Hace 1 día",
  },
  {
    id: 4,
    message: "Satisfacción promedio: 4.8/5 ⭐",
    time: "Hace 2 días",
  },
];

export function CompanyDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-foreground mb-1">Panel de Bienestar Empresarial</h1>
        <p className="text-muted-foreground">
          Resumen del programa de salud mental para TechCorp Solutions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl text-foreground">{stat.value}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </div>
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trend */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Uso Mensual de Sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyUsage}>
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
                  key="line-sesiones"
                  type="monotone"
                  dataKey="sesiones"
                  stroke="#4DB6AC"
                  strokeWidth={3}
                  name="Sesiones"
                  dot={{ fill: "#4DB6AC", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Usage */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Uso por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0F2F1" />
                <XAxis dataKey="department" stroke="#607D8B" />
                <YAxis stroke="#607D8B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E0F2F1",
                    borderRadius: "8px",
                  }}
                />
                <Bar key="bar-sesiones" dataKey="sesiones" fill="#81C784" radius={[8, 8, 0, 0]} name="Sesiones" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Actividad Reciente</CardTitle>
          <Button variant="outline" size="sm">
            Ver todo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto py-4 flex-col gap-2" variant="outline">
              <Users className="w-6 h-6" />
              <span>Agregar Empleado</span>
            </Button>
            <Button className="h-auto py-4 flex-col gap-2" variant="outline">
              <Calendar className="w-6 h-6" />
              <span>Ver Reportes</span>
            </Button>
            <Button className="h-auto py-4 flex-col gap-2" variant="outline">
              <TrendingUp className="w-6 h-6" />
              <span>Estadísticas Detalladas</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
