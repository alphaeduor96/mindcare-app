import { Card, CardContent } from "./ui/card";
import { Building2 } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import type { CalendarAppointment } from "./CalendarView";

interface CalendarWeekViewProps {
  currentDate: Date;
  appointments: CalendarAppointment[];
  blocks?: Array<{
    id: string;
    title: string;
    date: Date;
    hour: number;
    minute: number;
    duration: number;
    color: string;
  }>;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
  onAppointmentResizeStart?: (appointment: CalendarAppointment, event: React.MouseEvent<HTMLDivElement>) => void;
  onAppointmentDragStart?: (appointment: CalendarAppointment) => void;
  onAppointmentDrop?: (date: Date, hour: number) => void;
  hours?: number[];
}

const defaultHours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
const weekGridColumns = "8.75rem repeat(7, minmax(0, 1fr))";

function formatHour(hour: number) {
  const period = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00${period}`;
}

function formatHourRange(hour: number) {
  return `${formatHour(hour)}-${formatHour(hour + 1)}`;
}

export function CalendarWeekView({
  currentDate,
  appointments,
  blocks = [],
  onTimeSlotClick,
  onAppointmentClick,
  onAppointmentResizeStart,
  onAppointmentDragStart,
  onAppointmentDrop,
  hours = defaultHours,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const today = new Date();

  return (
    <Card className="border-border">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[1120px] 2xl:min-w-0">
            {/* Header with days */}
            <div
              className="grid border-b border-border bg-muted/30 sticky top-0 z-10"
              style={{ gridTemplateColumns: weekGridColumns }}
            >
              <div className="p-3 border-r border-border">
                <span className="text-sm text-muted-foreground">Hora</span>
              </div>
              {weekDays.map((day, index) => {
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={index}
                    className={`p-3 border-r border-border text-center ${
                      isToday ? "bg-primary/10" : ""
                    }`}
                  >
                    <div
                      className={`text-xs text-muted-foreground mb-1 ${
                        isToday ? "text-primary" : ""
                      }`}
                    >
                      {format(day, "EEE", { locale: es })}
                    </div>
                    <div
                      className={`text-sm ${
                        isToday
                          ? "text-primary font-medium"
                          : "text-foreground"
                      }`}
                    >
                      {format(day, "d", { locale: es })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time slots grid */}
            <div className="relative">
              {hours.map((hour) => {
                return (
                  <div
                    key={hour}
                    className="grid border-b border-border"
                    style={{ height: "80px", gridTemplateColumns: weekGridColumns }}
                  >
                    {/* Hour label */}
                    <div className="p-3 border-r border-border flex items-start">
                      <span className="text-xs text-muted-foreground">
                        {formatHourRange(hour)}
                      </span>
                    </div>

                    {/* Day cells */}
                    {weekDays.map((day, dayIndex) => {
                      return (
                        <div
                          key={dayIndex}
                          className="border-r border-border hover:bg-accent/30 transition-colors cursor-pointer relative"
                          onClick={() => onTimeSlotClick(day, hour)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            onAppointmentDrop?.(day, hour);
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-[10px] text-muted-foreground">+</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Appointments overlay */}
              <div
                className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none grid"
                style={{ gridTemplateColumns: weekGridColumns }}
              >
                <div className="border-r border-transparent" /> {/* Spacer for time column */}
                {weekDays.map((day, dayIndex) => {
                  const dayAppointments = appointments.filter((apt) => isSameDay(apt.date, day));
                  const dayBlocks = blocks.filter((block) => isSameDay(block.date, day));

                  return (
                    <div key={dayIndex} className="relative border-r border-transparent">
                      {dayBlocks.map((block) => {
                        const startMinutes = block.hour * 60 + block.minute;
                        const baseStartMinutes = hours[0] * 60;
                        const topPosition = ((startMinutes - baseStartMinutes) / 60) * 80;
                        const height = (block.duration / 60) * 80;

                        return (
                          <div
                            key={block.id}
                            className="absolute left-1 right-1 rounded p-2 text-xs text-white opacity-80 z-[5]"
                            style={{
                              top: `${topPosition}px`,
                              height: `${Math.max(height, 30)}px`,
                              backgroundColor: block.color,
                            }}
                          >
                            <p className="truncate font-medium">{block.title}</p>
                            {height > 45 ? <p className="text-[10px] opacity-90">Bloqueado</p> : null}
                          </div>
                        );
                      })}
                      {dayAppointments.map((appointment) => {
                        const startMinutes = appointment.hour * 60 + appointment.minute;
                        const baseStartMinutes = hours[0] * 60;
                        const topPosition = ((startMinutes - baseStartMinutes) / 60) * 80;
                        const height = (appointment.duration / 60) * 80;

                        return (
                          <div
                            key={appointment.id}
                            draggable
                            className={`absolute left-1 right-1 text-white rounded p-2 text-xs hover:shadow-lg transition-all pointer-events-auto cursor-pointer z-10 group ${
                              appointment.source === "network" ? "border-2 border-[#4DB6AC]/30" : ""
                            }`}
                            style={{
                              top: `${topPosition}px`,
                              height: `${Math.max(height, 30)}px`,
                              backgroundColor: appointment.color,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick(appointment);
                            }}
                            onDragStart={(event) => {
                              event.stopPropagation();
                              onAppointmentDragStart?.(appointment);
                            }}
                          >
                            <div className="flex items-start justify-between gap-1 mb-0.5">
                              <p className="truncate flex-1">{appointment.patient}</p>
                              {appointment.source === "network" && (
                                <Building2 className="w-3 h-3 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] opacity-90 truncate">
                              {appointment.psychologist}
                            </p>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[9px] opacity-75">
                                {appointment.duration} min
                              </p>
                              {appointment.source === "network" && (
                                <p className="text-[9px] opacity-90">
                                  ${appointment.amount}
                                </p>
                              )}
                            </div>
                            {onAppointmentResizeStart ? (
                              <div
                                className="absolute left-2 right-2 bottom-1 h-2 cursor-ns-resize rounded-full bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Jala para ajustar duración"
                                onMouseDown={(event) => onAppointmentResizeStart(appointment, event)}
                              />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
