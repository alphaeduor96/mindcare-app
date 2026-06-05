import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { Building2, Clock, DollarSign, Calendar as CalendarIcon, Mail } from "lucide-react";

export function Settings() {
  const [settings, setSettings] = useState({
    clinicName: "MindCare Centro Psicológico",
    timezone: "America/Mexico_City",
    currency: "MXN",
    defaultSessionDuration: "60",
    workingHoursStart: "08:00",
    workingHoursEnd: "20:00",
    reminderHours: "24",
    allowOnlineBooking: true,
    requirePaymentConfirmation: false,
    autoConfirmAppointments: false,
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "noreply@mindcare.com",
    appointmentReminder: true,
    paymentReceipt: true,
    monthlyReport: false,
  });

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating settings:", settings);
    toast.success("Configuración actualizada exitosamente");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating email settings:", emailSettings);
    toast.success("Configuración de email actualizada");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1">Configuración</h1>
        <p className="text-muted-foreground">
          Ajustes generales del sistema y preferencias
        </p>
      </div>

      {/* General Settings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Información General
          </CardTitle>
          <CardDescription>
            Configura la información básica de tu clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGeneralSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Nombre de la Clínica</Label>
              <Input
                id="clinicName"
                value={settings.clinicName}
                onChange={(e) =>
                  setSettings({ ...settings, clinicName: e.target.value })
                }
                className="bg-input-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) =>
                    setSettings({ ...settings, timezone: value })
                  }
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Mexico_City">
                      Ciudad de México (GMT-6)
                    </SelectItem>
                    <SelectItem value="America/Cancun">
                      Cancún (GMT-5)
                    </SelectItem>
                    <SelectItem value="America/Tijuana">
                      Tijuana (GMT-8)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) =>
                    setSettings({ ...settings, currency: value })
                  }
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Appointment Settings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Configuración de Citas
          </CardTitle>
          <CardDescription>
            Define los parámetros para la gestión de citas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultDuration">Duración predeterminada</Label>
              <Select
                value={settings.defaultSessionDuration}
                onValueChange={(value) =>
                  setSettings({ ...settings, defaultSessionDuration: value })
                }
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1.5 horas</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderHours">Recordatorio (horas antes)</Label>
              <Select
                value={settings.reminderHours}
                onValueChange={(value) =>
                  setSettings({ ...settings, reminderHours: value })
                }
              >
                <SelectTrigger className="bg-input-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="3">3 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workStart">Horario de inicio</Label>
              <Input
                id="workStart"
                type="time"
                value={settings.workingHoursStart}
                onChange={(e) =>
                  setSettings({ ...settings, workingHoursStart: e.target.value })
                }
                className="bg-input-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workEnd">Horario de cierre</Label>
              <Input
                id="workEnd"
                type="time"
                value={settings.workingHoursEnd}
                onChange={(e) =>
                  setSettings({ ...settings, workingHoursEnd: e.target.value })
                }
                className="bg-input-background"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Reservas en línea</p>
                <p className="text-xs text-muted-foreground">
                  Permite que pacientes reserven citas en línea
                </p>
              </div>
              <Switch
                checked={settings.allowOnlineBooking}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowOnlineBooking: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Confirmar pagos automáticamente</p>
                <p className="text-xs text-muted-foreground">
                  Requiere confirmación manual de pagos
                </p>
              </div>
              <Switch
                checked={settings.requirePaymentConfirmation}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, requirePaymentConfirmation: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Auto-confirmar citas</p>
                <p className="text-xs text-muted-foreground">
                  Las citas nuevas se confirman automáticamente
                </p>
              </div>
              <Switch
                checked={settings.autoConfirmAppointments}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoConfirmAppointments: checked })
                }
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleGeneralSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Guardar Configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configuración de Email
          </CardTitle>
          <CardDescription>
            Configura los parámetros de envío de correos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpServer">Servidor SMTP</Label>
                <Input
                  id="smtpServer"
                  value={emailSettings.smtpServer}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, smtpServer: e.target.value })
                  }
                  className="bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPort">Puerto</Label>
                <Input
                  id="smtpPort"
                  value={emailSettings.smtpPort}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, smtpPort: e.target.value })
                  }
                  className="bg-input-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpUser">Usuario SMTP</Label>
              <Input
                id="smtpUser"
                type="email"
                value={emailSettings.smtpUser}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, smtpUser: e.target.value })
                }
                className="bg-input-background"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm text-muted-foreground">Emails Automáticos</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Recordatorio de citas</p>
                  <p className="text-xs text-muted-foreground">
                    Enviar recordatorios automáticos
                  </p>
                </div>
                <Switch
                  checked={emailSettings.appointmentReminder}
                  onCheckedChange={(checked) =>
                    setEmailSettings({ ...emailSettings, appointmentReminder: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Recibo de pago</p>
                  <p className="text-xs text-muted-foreground">
                    Enviar recibos por email
                  </p>
                </div>
                <Switch
                  checked={emailSettings.paymentReceipt}
                  onCheckedChange={(checked) =>
                    setEmailSettings({ ...emailSettings, paymentReceipt: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Reporte mensual</p>
                  <p className="text-xs text-muted-foreground">
                    Enviar resumen mensual de actividad
                  </p>
                </div>
                <Switch
                  checked={emailSettings.monthlyReport}
                  onCheckedChange={(checked) =>
                    setEmailSettings({ ...emailSettings, monthlyReport: checked })
                  }
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Guardar Configuración
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
