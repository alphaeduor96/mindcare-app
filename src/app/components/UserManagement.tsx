import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function UserManagement() {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
    telefono: "",
    rol: "psicologo" as "admin" | "psicologo" | "empresa" | "empleado",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("Alta legacy deshabilitada por seguridad. Usaremos una función administrativa segura.");
  };

  const getRoleLabel = (rol: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl text-foreground mb-2">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Crea y administra usuarios de la plataforma
          </p>
        </div>

        {/* Create User Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#4DB6AC] hover:bg-[#26A69A]">
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa la información del nuevo usuario
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Rol */}
              <div className="space-y-2">
                <Label htmlFor="rol">Tipo de Usuario *</Label>
                <select
                  id="rol"
                  value={formData.rol}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rol: e.target.value as typeof formData.rol,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#4DB6AC]"
                  required
                >
                  <option value="psicologo">Psicólogo</option>
                  <option value="empresa">Empresa</option>
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={loading}
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Juan"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    type="text"
                    placeholder="Pérez"
                    value={formData.apellido}
                    onChange={(e) =>
                      setFormData({ ...formData, apellido: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+52 33 1234 5678"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#4DB6AC] hover:bg-[#26A69A]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Usuario"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Psicólogos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#7E57C2]">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de psicólogos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FF9800]">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de empresas asociadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#42A5F5]">-</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de empleados registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4DB6AC]">1</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de administradores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Instrucciones para Crear Usuarios</CardTitle>
          <CardDescription>
            Sigue estos pasos para registrar nuevos usuarios en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#4DB6AC]/10 text-[#4DB6AC] rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Selecciona el Tipo de Usuario
                </h4>
                <p className="text-sm text-muted-foreground">
                  Elige si el usuario será un Psicólogo, Empresa, Empleado o Administrador
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#4DB6AC]/10 text-[#4DB6AC] rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Completa la Información
                </h4>
                <p className="text-sm text-muted-foreground">
                  Ingresa email, contraseña, nombre, apellido y teléfono del usuario
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#4DB6AC]/10 text-[#4DB6AC] rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Comparte las Credenciales
                </h4>
                <p className="text-sm text-muted-foreground">
                  Envía el email y contraseña al usuario para que pueda acceder a la plataforma
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#4DB6AC]/10 text-[#4DB6AC] rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Configuración Adicional
                </h4>
                <p className="text-sm text-muted-foreground">
                  Según el rol, el usuario deberá completar su perfil con información adicional (cédula profesional para psicólogos, RFC para empresas, etc.)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#E0F2F1] p-4 rounded-lg border border-[#4DB6AC]/20">
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              💡 Recomendaciones de Seguridad
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Genera contraseñas seguras de al menos 8 caracteres</li>
              <li>Combina letras mayúsculas, minúsculas, números y símbolos</li>
              <li>Pide a los usuarios cambiar su contraseña en el primer acceso</li>
              <li>No compartas las credenciales por canales inseguros</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
