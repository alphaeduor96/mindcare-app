import { API_BASE, publicAnonKey } from "../../services/api";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Mail, Phone, Edit, Trash2, Users, Building2, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Company {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  razon_social: string;
  rfc: string;
  industria?: string;
  tamano_empresa?: string;
  numero_empleados?: number;
  telefono_corporativo?: string;
  contacto_rrhh_nombre?: string;
  contacto_rrhh_email?: string;
  contacto_rrhh_telefono?: string;
  sesiones_contratadas?: number;
  sesiones_usadas?: number;
  sesiones_disponibles?: number;
  activo: boolean;
}

export function CompaniesList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    companyName: "",
    rfc: "",
    industria: "",
    tamano: "mediana",
    contactName: "",
    email: "",
    phone: "",
    employees: "",
    address: "",
    plan: "standard",
  });

  // Cargar empresas desde la base de datos
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/empresas`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar empresas");
      }

      const data = await response.json();
      setCompanies(data);
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast.error("Error al cargar la lista de empresas");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.contactName || !formData.email || !formData.rfc) {
      toast.error("Complete los campos requeridos");
      return;
    }

    try {
      // Separar nombre y apellido del contacto
      const nameParts = formData.contactName.trim().split(" ");
      const nombre = nameParts[0];
      const apellido = nameParts.slice(1).join(" ") || nameParts[0];

      // Generar contraseña temporal segura
      const tempPassword = `Mind${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 100)}!`;

      // Calcular sesiones según el plan
      const employeeCount = parseInt(formData.employees) || 50;
      let sessionsPerEmployee = 4; // Standard
      if (formData.plan === "basic") sessionsPerEmployee = 2;
      if (formData.plan === "premium") sessionsPerEmployee = 8;
      const totalSessions = employeeCount * sessionsPerEmployee;

      // Paso 1: Crear usuario en auth.users y tabla usuarios
      const userResponse = await fetch(
        `${API_BASE}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: tempPassword,
            nombre,
            apellido,
            telefono: formData.phone,
            rol: "empresa",
          }),
        }
      );

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || "Error al crear usuario");
      }

      const { user } = await userResponse.json();

      // Paso 2: Crear perfil de empresa
      const companyResponse = await fetch(
        `${API_BASE}/empresas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            usuario_id: user.id,
            razon_social: formData.companyName,
            rfc: formData.rfc.toUpperCase(),
            industria: formData.industria || "No especificada",
            tamano_empresa: formData.tamano,
            numero_empleados: employeeCount,
            direccion: formData.address || "",
            telefono_corporativo: formData.phone || "",
            contacto_rrhh_nombre: formData.contactName,
            contacto_rrhh_email: formData.email,
            contacto_rrhh_telefono: formData.phone,
            sesiones_contratadas: totalSessions,
            sesiones_usadas: 0,
            activo: true,
          }),
        }
      );

      if (!companyResponse.ok) {
        const errorData = await companyResponse.json();
        throw new Error(errorData.error || "Error al crear empresa");
      }

      // Mostrar credenciales
      toast.success(
        <div className="space-y-2">
          <p className="font-semibold">✅ Empresa registrada exitosamente</p>
          <div className="text-sm mt-2 p-2 bg-background rounded border">
            <p className="font-medium">Credenciales de acceso:</p>
            <p><strong>Email:</strong> {formData.email}</p>
            <p><strong>Contraseña:</strong> {tempPassword}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            ⚠️ Comparte estas credenciales con el contacto de la empresa
          </p>
        </div>,
        { duration: 10000 }
      );

      // Copiar credenciales al portapapeles
      const credentials = `Email: ${formData.email}\nContraseña: ${tempPassword}`;
      try {
        await navigator.clipboard.writeText(credentials);
        toast.info("📋 Credenciales copiadas al portapapeles", { duration: 3000 });
      } catch (clipboardError) {
        console.log("Clipboard access denied, credentials shown in toast instead");
        // Si falla el portapapeles, las credenciales ya están en el toast principal
      }

      // Reset form
      setFormData({
        companyName: "",
        rfc: "",
        industria: "",
        tamano: "mediana",
        contactName: "",
        email: "",
        phone: "",
        employees: "",
        address: "",
        plan: "standard",
      });

      setIsModalOpen(false);
      // Recargar lista
      fetchCompanies();
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast.error(error.message || "Error al registrar empresa");
    }
  };

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.activo).length;
  const totalEmployees = companies.reduce((sum, c) => sum + (c.numero_empleados || 0), 0);
  const totalSessions = companies.reduce((sum, c) => sum + (c.sesiones_disponibles || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-1">Empresas Asociadas</h1>
          <p className="text-muted-foreground">
            Gestiona las empresas que tienen acceso a la red de psicólogos
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Empresas</p>
            <p className="text-3xl text-foreground">{totalCompanies}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Activas</p>
            <p className="text-3xl text-[#81C784]">{activeCompanies}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Empleados</p>
            <p className="text-3xl text-primary">{totalEmployees}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Sesiones Disponibles</p>
            <p className="text-3xl text-[#4DD0E1]">{totalSessions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Cargando empresas...</span>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No hay empresas registradas aún
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primera Empresa
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead className="text-center">Empleados</TableHead>
                  <TableHead className="text-center">Sesiones Disponibles</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-accent/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{company.razon_social}</p>
                          <p className="text-xs text-muted-foreground">{company.industria}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-foreground">{company.contacto_rrhh_nombre || "N/A"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {company.email}
                        </div>
                        {company.telefono && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {company.telefono}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {company.rfc}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <Badge variant="secondary">{company.numero_empleados || 0}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge className="bg-[#4DD0E1] text-white">
                          {company.sesiones_disponibles || 0}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          de {company.sesiones_contratadas || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          company.activo
                            ? "bg-[#81C784] text-white"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {company.activo ? "Activa" : "Inactiva"}
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
          )}
        </CardContent>
      </Card>

      {/* Add Company Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Empresa</DialogTitle>
            <DialogDescription>
              Complete la información de la empresa para asociarla a la red
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Razón Social <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="Ej: TechCorp Solutions SA de CV"
                className="bg-input-background"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rfc">
                  RFC <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rfc"
                  placeholder="ABC123456XYZ"
                  className="bg-input-background font-mono"
                  value={formData.rfc}
                  onChange={(e) =>
                    setFormData({ ...formData, rfc: e.target.value.toUpperCase() })
                  }
                  maxLength={13}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industria">Industria</Label>
                <Input
                  id="industria"
                  placeholder="Ej: Tecnología"
                  className="bg-input-background"
                  value={formData.industria}
                  onChange={(e) =>
                    setFormData({ ...formData, industria: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">
                Responsable de RRHH <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactName"
                placeholder="Nombre completo del responsable"
                className="bg-input-background"
                value={formData.contactName}
                onChange={(e) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  className="bg-input-background"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+52 33 1234 5678"
                  className="bg-input-background"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Dirección completa de la empresa"
                className="bg-input-background"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employees">Número de Empleados</Label>
                <Input
                  id="employees"
                  type="number"
                  placeholder="Ej: 100"
                  className="bg-input-background"
                  value={formData.employees}
                  onChange={(e) =>
                    setFormData({ ...formData, employees: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tamano">Tamaño</Label>
                <Select
                  value={formData.tamano}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tamano: value })
                  }
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pequena">Pequeña (1-50)</SelectItem>
                    <SelectItem value="mediana">Mediana (51-250)</SelectItem>
                    <SelectItem value="grande">Grande (251+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan de Sesiones</Label>
              <Select
                value={formData.plan}
                onValueChange={(value) =>
                  setFormData({ ...formData, plan: value })
                }
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico (2 sesiones/empleado)</SelectItem>
                  <SelectItem value="standard">Estándar (4 sesiones/empleado)</SelectItem>
                  <SelectItem value="premium">Premium (8 sesiones/empleado)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Total de sesiones se calculará automáticamente según el plan y número de empleados
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
                Guardar Empresa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
