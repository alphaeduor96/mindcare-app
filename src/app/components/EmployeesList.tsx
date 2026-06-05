import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Mail, Phone, Edit, Trash2, UserCheck, Calendar } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { toast } from "sonner";

const employees = [
  {
    id: 1,
    name: "Carlos Mendoza",
    email: "carlos.mendoza@techcorp.com",
    phone: "+52 55 1111 1111",
    department: "Desarrollo",
    sessionsUsed: 2,
    sessionsAvailable: 2,
    status: "active",
  },
  {
    id: 2,
    name: "Ana Rodríguez",
    email: "ana.rodriguez@techcorp.com",
    phone: "+52 55 2222 2222",
    department: "Recursos Humanos",
    sessionsUsed: 1,
    sessionsAvailable: 3,
    status: "active",
  },
  {
    id: 3,
    name: "Luis García",
    email: "luis.garcia@techcorp.com",
    phone: "+52 55 3333 3333",
    department: "Ventas",
    sessionsUsed: 0,
    sessionsAvailable: 4,
    status: "active",
  },
  {
    id: 4,
    name: "María Santos",
    email: "maria.santos@techcorp.com",
    phone: "+52 55 4444 4444",
    department: "Marketing",
    sessionsUsed: 3,
    sessionsAvailable: 1,
    status: "active",
  },
];

export function EmployeesList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Complete los campos requeridos");
      return;
    }

    console.log("Nuevo empleado:", formData);
    toast.success(`Empleado ${formData.name} registrado. Se envió un email de bienvenida.`);
    
    setFormData({
      name: "",
      email: "",
      phone: "",
      department: "",
    });
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Empleados</h1>
          <p className="text-muted-foreground">
            Gestiona los empleados con acceso a servicios psicológicos
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Agregar Empleado
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Empleados</p>
            <p className="text-3xl text-foreground">150</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Sesiones Usadas</p>
            <p className="text-3xl text-[#4DD0E1]">85</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Sesiones Disponibles</p>
            <p className="text-3xl text-[#81C784]">215</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Activos</p>
            <p className="text-3xl text-primary">148</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-center">Sesiones Usadas</TableHead>
                <TableHead className="text-center">Sesiones Disponibles</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <p className="text-foreground">{employee.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {employee.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {employee.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.department}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{employee.sessionsUsed}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-[#81C784] text-white">
                      {employee.sessionsAvailable}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        employee.status === "active"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {employee.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Agregar Empleado</DialogTitle>
            <DialogDescription>
              El empleado recibirá un email con acceso a la plataforma
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Carlos Mendoza"
                className="bg-input-background"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Corporativo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="empleado@empresa.com"
                className="bg-input-background"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  className="bg-input-background"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  placeholder="Ej: Desarrollo"
                  className="bg-input-background"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="bg-accent/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                El empleado tendrá acceso a <strong className="text-foreground">4 sesiones</strong> según su plan.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Agregar Empleado
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
