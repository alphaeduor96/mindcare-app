import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Settings,
  AlertCircle,
  Zap,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

interface AvailabilitySettingsProps {
  psychologistName: string;
  isPlanAffiliated?: boolean;
}

const DAYS_OF_WEEK = [
  { id: "monday", label: "Lunes" },
  { id: "tuesday", label: "Martes" },
  { id: "wednesday", label: "Miércoles" },
  { id: "thursday", label: "Jueves" },
  { id: "friday", label: "Viernes" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export function AvailabilitySettings({ psychologistName, isPlanAffiliated }: AvailabilitySettingsProps) {
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [bufferTime, setBufferTime] = useState(15);
  const [maxAdvanceBooking, setMaxAdvanceBooking] = useState(30);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("17:00");

  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({
    monday: {
      enabled: true,
      slots: [
        { id: "1", start: "09:00", end: "13:00" },
        { id: "2", start: "15:00", end: "19:00" },
      ],
    },
    tuesday: {
      enabled: true,
      slots: [{ id: "3", start: "09:00", end: "17:00" }],
    },
    wednesday: {
      enabled: true,
      slots: [{ id: "4", start: "09:00", end: "17:00" }],
    },
    thursday: {
      enabled: true,
      slots: [{ id: "5", start: "09:00", end: "17:00" }],
    },
    friday: {
      enabled: true,
      slots: [{ id: "6", start: "09:00", end: "13:00" }],
    },
    saturday: {
      enabled: false,
      slots: [],
    },
    sunday: {
      enabled: false,
      slots: [],
    },
  });

  const handleDayToggle = (dayId: string, enabled: boolean) => {
    setSchedule({
      ...schedule,
      [dayId]: {
        ...schedule[dayId],
        enabled,
      },
    });
    toast.success(`${DAYS_OF_WEEK.find(d => d.id === dayId)?.label} ${enabled ? "habilitado" : "deshabilitado"}`);
  };

  const handleAddSlot = () => {
    if (!selectedDay) {
      toast.error("Selecciona un día");
      return;
    }

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      start: newSlotStart,
      end: newSlotEnd,
    };

    setSchedule({
      ...schedule,
      [selectedDay]: {
        ...schedule[selectedDay],
        slots: [...schedule[selectedDay].slots, newSlot],
      },
    });

    toast.success("Horario agregado exitosamente");
    setShowAddSlotDialog(false);
    setNewSlotStart("09:00");
    setNewSlotEnd("17:00");
  };

  const handleRemoveSlot = (dayId: string, slotId: string) => {
    setSchedule({
      ...schedule,
      [dayId]: {
        ...schedule[dayId],
        slots: schedule[dayId].slots.filter((slot) => slot.id !== slotId),
      },
    });
    toast.success("Horario eliminado");
  };

  const handleQuickSetup = (template: "morning" | "afternoon" | "fullday") => {
    const templates = {
      morning: { start: "08:00", end: "14:00" },
      afternoon: { start: "14:00", end: "20:00" },
      fullday: { start: "08:00", end: "20:00" },
    };

    const newSchedule: Record<string, DaySchedule> = {};
    DAYS_OF_WEEK.forEach((day) => {
      if (day.id !== "saturday" && day.id !== "sunday") {
        newSchedule[day.id] = {
          enabled: true,
          slots: [
            {
              id: `${day.id}-1`,
              start: templates[template].start,
              end: templates[template].end,
            },
          ],
        };
      } else {
        newSchedule[day.id] = { enabled: false, slots: [] };
      }
    });

    setSchedule(newSchedule);
    toast.success("Horario configurado exitosamente");
  };

  const getTotalWeeklyHours = () => {
    let total = 0;
    Object.values(schedule).forEach((day) => {
      if (day.enabled) {
        day.slots.forEach((slot) => {
          const [startH, startM] = slot.start.split(":").map(Number);
          const [endH, endM] = slot.end.split(":").map(Number);
          const hours = endH - startH + (endM - startM) / 60;
          total += hours;
        });
      }
    });
    return total.toFixed(1);
  };

  const getEstimatedAppointments = () => {
    const totalMinutes = parseFloat(getTotalWeeklyHours()) * 60;
    return Math.floor(totalMinutes / (sessionDuration + bufferTime));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-foreground mb-2">Disponibilidad de Horarios</h1>
        <p className="text-muted-foreground">
          Configura tu agenda y define cómo los pacientes pueden agendar contigo
        </p>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="schedule">Mi Horario</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Horas Semanales</p>
                    <p className="text-2xl text-foreground">{getTotalWeeklyHours()}h</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Citas Estimadas</p>
                    <p className="text-2xl text-foreground">{getEstimatedAppointments()}/sem</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#66BB6A]/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#66BB6A]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Días Activos</p>
                    <p className="text-2xl text-foreground">
                      {Object.values(schedule).filter((d) => d.enabled).length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#42A5F5]/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#42A5F5]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración Rápida</CardTitle>
              <CardDescription>
                Aplica un horario predefinido de lunes a viernes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleQuickSetup("morning")}
                  className="gap-2"
                >
                  🌅 Matutino (8:00 - 14:00)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickSetup("afternoon")}
                  className="gap-2"
                >
                  🌆 Vespertino (14:00 - 20:00)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickSetup("fullday")}
                  className="gap-2"
                >
                  ☀️ Jornada Completa (8:00 - 20:00)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Horario Semanal</CardTitle>
                  <CardDescription>
                    Define tus horarios disponibles para cada día
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddSlotDialog(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Horario
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const daySchedule = schedule[day.id];
                return (
                  <div
                    key={day.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      daySchedule.enabled
                        ? "border-primary/20 bg-primary/5"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={daySchedule.enabled}
                          onCheckedChange={(checked) => handleDayToggle(day.id, checked)}
                        />
                        <div>
                          <Label className="text-base">{day.label}</Label>
                          {daySchedule.enabled && daySchedule.slots.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {daySchedule.slots.length}{" "}
                              {daySchedule.slots.length === 1 ? "horario" : "horarios"}
                            </p>
                          )}
                        </div>
                      </div>
                      {daySchedule.enabled ? (
                        <Badge className="bg-[#66BB6A] text-white">Activo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactivo
                        </Badge>
                      )}
                    </div>

                    {daySchedule.enabled && (
                      <div className="space-y-2 ml-11">
                        {daySchedule.slots.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">
                            No hay horarios configurados
                          </p>
                        ) : (
                          daySchedule.slots.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between bg-card rounded-lg p-3 border border-border"
                            >
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-sm">
                                  {slot.start} - {slot.end}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveSlot(day.id, slot.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Auto-confirm Settings */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>Confirmación de Citas</CardTitle>
                  <CardDescription>
                    {isPlanAffiliated
                      ? "Configura cómo se confirman las citas de pacientes de la red"
                      : "Configura cómo se confirman todas las citas"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-base">Confirmación Automática</Label>
                    {autoConfirm && (
                      <Badge className="bg-[#66BB6A] text-white gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Activa
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {autoConfirm
                      ? "Las citas se confirman automáticamente al agendar. Los pacientes reciben confirmación instantánea."
                      : "Las citas quedan pendientes hasta que las confirmes manualmente. Te da control total sobre tu agenda."}
                  </p>
                </div>
                <Switch
                  checked={autoConfirm}
                  onCheckedChange={(checked) => {
                    setAutoConfirm(checked);
                    toast.success(
                      checked
                        ? "Confirmación automática activada"
                        : "Confirmación manual activada"
                    );
                  }}
                  className="ml-4"
                />
              </div>

              {!autoConfirm && (
                <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-[#FFB74D]/20 bg-[#FFB74D]/5">
                  <AlertCircle className="w-5 h-5 text-[#FFB74D] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground mb-1">
                      <strong>Importante:</strong> Confirmación Manual Activa
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Recibirás notificaciones de nuevas solicitudes y deberás confirmarlas
                      manualmente. Los pacientes esperarán tu confirmación.
                    </p>
                  </div>
                </div>
              )}

              {isPlanAffiliated && (
                <div className="p-4 rounded-lg border-2 border-[#4DB6AC]/20 bg-[#4DB6AC]/5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4DB6AC]/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-[#4DB6AC]" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground mb-1">
                        <strong>Pacientes de la Red MindCare</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Esta configuración se aplica a empleados de empresas afiliadas que
                        agenden contigo. Tus pacientes privados siempre requerirán
                        confirmación manual.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#42A5F5]/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#42A5F5]" />
                </div>
                <div>
                  <CardTitle>Configuración de Reservas</CardTitle>
                  <CardDescription>
                    Ajusta parámetros para el agendamiento
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Session Duration */}
              <div className="space-y-3">
                <Label>Duración de Sesión</Label>
                <Select
                  value={sessionDuration.toString()}
                  onValueChange={(value) => setSessionDuration(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos (1 hora)</SelectItem>
                    <SelectItem value="90">90 minutos (1.5 horas)</SelectItem>
                    <SelectItem value="120">120 minutos (2 horas)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Duración estándar de tus sesiones
                </p>
              </div>

              <Separator />

              {/* Buffer Time */}
              <div className="space-y-3">
                <Label>Tiempo de Descanso Entre Citas</Label>
                <Select
                  value={bufferTime.toString()}
                  onValueChange={(value) => setBufferTime(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin descanso</SelectItem>
                    <SelectItem value="10">10 minutos</SelectItem>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Espacio entre citas para preparación y notas
                </p>
              </div>

              <Separator />

              {/* Max Advance Booking */}
              <div className="space-y-3">
                <Label>Anticipación Máxima de Reserva</Label>
                <Select
                  value={maxAdvanceBooking.toString()}
                  onValueChange={(value) => setMaxAdvanceBooking(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">1 semana</SelectItem>
                    <SelectItem value="14">2 semanas</SelectItem>
                    <SelectItem value="30">1 mes</SelectItem>
                    <SelectItem value="60">2 meses</SelectItem>
                    <SelectItem value="90">3 meses</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Con cuánta anticipación pueden agendar los pacientes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-[#66BB6A]/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#66BB6A] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground mb-1">
                      <strong>Cambios en Tiempo Real</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tu disponibilidad se actualiza inmediatamente. Los pacientes verán
                      solo horarios disponibles.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#42A5F5]/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#42A5F5] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground mb-1">
                      <strong>Bloqueos Temporales</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Puedes bloquear días específicos desde el calendario para vacaciones
                      o eventos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Slot Dialog */}
      <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Horario</DialogTitle>
            <DialogDescription>
              Define un nuevo bloque de tiempo disponible
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Día de la Semana</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un día" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.id} value={day.id}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora Inicio</Label>
                <Select value={newSlotStart} onValueChange={setNewSlotStart}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hora Fin</Label>
                <Select value={newSlotEnd} onValueChange={setNewSlotEnd}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlotDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddSlot}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
