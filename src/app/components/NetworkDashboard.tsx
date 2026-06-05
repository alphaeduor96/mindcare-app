import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Users,
  Building2,
  Calendar,
  TrendingUp,
  MapPin,
  DollarSign,
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
import { useEffect } from "react";

const statsData = [
  {
    title: "Psicólogos en Red",
    value: "42",
    change: "+5 este mes",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Empresas Asociadas",
    value: "15",
    change: "+3 este trimestre",
    icon: Building2,
    color: "text-[#81C784]",
    bgColor: "bg-[#81C784]/10",
  },
  {
    title: "Sesiones Este Mes",
    value: "328",
    change: "+12% vs mes anterior",
    icon: Calendar,
    color: "text-[#4DD0E1]",
    bgColor: "bg-[#4DD0E1]/10",
  },
  {
    title: "Tasa de Ocupación",
    value: "76%",
    change: "Óptimo",
    icon: TrendingUp,
    color: "text-[#66BB6A]",
    bgColor: "bg-[#66BB6A]/10",
  },
];

const monthlyGrowth = [
  { month: "Ene", psicologos: 28, empresas: 8, sesiones: 180 },
  { month: "Feb", psicologos: 31, empresas: 10, sesiones: 215 },
  { month: "Mar", psicologos: 34, empresas: 11, sesiones: 245 },
  { month: "Abr", psicologos: 37, empresas: 12, sesiones: 280 },
  { month: "May", psicologos: 39, empresas: 14, sesiones: 310 },
  { month: "Jun", psicologos: 42, empresas: 15, sesiones: 328 },
];

const psychologistsByZone = [
  { zone: "Norte", count: 12 },
  { zone: "Sur", count: 8 },
  { zone: "Centro", count: 15 },
  { zone: "Oriente", count: 7 },
];

const recentActivity = [
  {
    id: 1,
    type: "new_psychologist",
    message: "Dr. Roberto Sánchez se unió a la red",
    time: "Hace 2 horas",
  },
  {
    id: 2,
    type: "new_company",
    message: "TechCorp Solutions se asoció a la red",
    time: "Hace 5 horas",
  },
  {
    id: 3,
    type: "session",
    message: "150 nuevas sesiones programadas esta semana",
    time: "Hace 1 día",
  },
  {
    id: 4,
    type: "review",
    message: "Promedio de satisfacción: 4.8/5 ⭐",
    time: "Hace 2 días",
  },
];

export function NetworkDashboard() {
  // Suprimir warnings conocidos de Recharts sobre claves duplicadas
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('Encountered two children with the same key')) {
        // Ignorar warnings de claves duplicadas de Recharts (issue conocido)
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-foreground mb-1">Panel de Control de la Red</h1>
        <p className="text-muted-foreground">
          Vista general del estado de la red de psicólogos
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
        {/* Growth Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Crecimiento de la Red</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyGrowth}>
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
                  type="monotone"
                  dataKey="psicologos"
                  stroke="#4DB6AC"
                  strokeWidth={3}
                  name="Psicólogos"
                  dot={{ fill: "#4DB6AC", r: 5 }}
                  id="line-psicologos-network"
                />
                <Line
                  type="monotone"
                  dataKey="empresas"
                  stroke="#81C784"
                  strokeWidth={3}
                  name="Empresas"
                  dot={{ fill: "#81C784", r: 5 }}
                  id="line-empresas-network"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Psychologists by Zone */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Psicólogos por Zona</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={psychologistsByZone}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0F2F1" />
                <XAxis dataKey="zone" stroke="#607D8B" />
                <YAxis stroke="#607D8B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E0F2F1",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#4DB6AC" radius={[8, 8, 0, 0]} name="Psicólogos" id="bar-count-network" />
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
                  {activity.type === "new_psychologist" && (
                    <Users className="w-5 h-5 text-primary" />
                  )}
                  {activity.type === "new_company" && (
                    <Building2 className="w-5 h-5 text-[#81C784]" />
                  )}
                  {activity.type === "session" && (
                    <Calendar className="w-5 h-5 text-[#4DD0E1]" />
                  )}
                  {activity.type === "review" && (
                    <TrendingUp className="w-5 h-5 text-[#66BB6A]" />
                  )}
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
              <span>Agregar Psicólogo</span>
            </Button>
            <Button className="h-auto py-4 flex-col gap-2" variant="outline">
              <Building2 className="w-6 h-6" />
              <span>Agregar Empresa</span>
            </Button>
            <Button className="h-auto py-4 flex-col gap-2" variant="outline">
              <MapPin className="w-6 h-6" />
              <span>Ver Cobertura</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
