import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Video, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  psychologist: any;
}

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM",
];

export function BookAppointmentModal({
  isOpen,
  onClose,
  psychologist,
}: BookAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [modality, setModality] = useState("presencial");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Por favor selecciona fecha y hora");
      return;
    }

    console.log({
      psychologist: psychologist.name,
      date: selectedDate,
      time: selectedTime,
      duration,
      modality,
      notes,
    });

    toast.success(
      <>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#81C784]" />
          <strong>¡Cita agendada exitosamente!</strong>
        </div>
        <p className="text-sm mt-1">
          {selectedDate.toLocaleDateString("es-ES", { 
            weekday: "long", 
            day: "numeric", 
            month: "long" 
          })} a las {selectedTime}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Recibirás un correo de confirmación
        </p>
      </>
    );

    setStep(1);
    setSelectedDate(undefined);
    setSelectedTime("");
    setDuration("60");
    setModality("presencial");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agendar Cita</DialogTitle>
          <DialogDescription>
            {psychologist.name} - {psychologist.specialty}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </div>
              <span className="text-sm">Fecha y Hora</span>
            </div>
            <div className="w-12 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span className="text-sm">Detalles</span>
            </div>
          </div>

          {/* Step 1: Date and Time */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Selecciona una fecha</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border border-border"
                />
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <Label>Horarios disponibles</Label>
                  <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        className={`h-auto py-2 ${
                          selectedTime === time
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-accent/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="text-foreground">
                    {selectedDate?.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{selectedTime}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-input-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1.5 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modality">Modalidad</Label>
                <Select value={modality} onValueChange={setModality}>
                  <SelectTrigger className="bg-input-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Presencial
                      </div>
                    </SelectItem>
                    <SelectItem value="virtual">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Virtual
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="¿Hay algo que el psicólogo deba saber?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-input-background min-h-[100px]"
                />
              </div>

              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-foreground mb-1">Costo de la sesión</p>
                    <p className="text-2xl text-foreground">${psychologist.baseRate}</p>
                  </div>
                  <Badge className="bg-[#81C784] text-white">
                    Cubierto por tu empresa
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {step === 1 ? (
            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedDate || !selectedTime}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Siguiente
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Confirmar Cita
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
