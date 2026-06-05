import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Building2 } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import type { CalendarAppointment } from "./CalendarView";

interface CalendarMonthViewProps {
  currentDate: Date;
  appointments: CalendarAppointment[];
  onDayClick: (date: Date) => void;
}

export function CalendarMonthView({
  currentDate,
  appointments,
  onDayClick,
}: CalendarMonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const today = new Date();
  const days = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getAppointmentsForDay = (day: Date) => {
    const dayAppointments = appointments.filter((apt) => isSameDay(apt.date, day));
    return {
      count: dayAppointments.length,
      countNetwork: dayAppointments.filter((apt) => apt.source === "network").length,
      status: dayAppointments.some((apt) => apt.status === "pending") ? "pending" : "confirmed",
    };
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div
              key={day}
              className="text-center text-xs text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, today);
                const dayAppointments = getAppointmentsForDay(day);

                return (
                  <div
                    key={dayIndex}
                    className={`
                      min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer
                      ${
                        isCurrentMonth
                          ? "border-border bg-card hover:bg-accent/50"
                          : "border-transparent bg-muted/30"
                      }
                      ${isToday ? "ring-2 ring-primary" : ""}
                    `}
                    onClick={() => onDayClick(day)}
                  >
                    <div
                      className={`text-sm mb-2 ${
                        isToday
                          ? "text-primary font-medium"
                          : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </div>

                    {dayAppointments.count > 0 && isCurrentMonth && (
                      <div className="space-y-1">
                        <Badge
                          className={`w-full justify-center text-xs ${
                            dayAppointments.status === "confirmed"
                              ? "bg-primary text-primary-foreground"
                              : "bg-[#FFB74D] text-white"
                          }`}
                        >
                          {dayAppointments.count}{" "}
                          {dayAppointments.count === 1 ? "cita" : "citas"}
                        </Badge>
                        {dayAppointments.countNetwork > 0 && (
                          <Badge
                            variant="outline"
                            className="w-full justify-center text-xs bg-[#4DB6AC]/10 text-[#4DB6AC] border-[#4DB6AC]/20"
                          >
                            <Building2 className="w-3 h-3 mr-1" />
                            {dayAppointments.countNetwork} Red
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-muted-foreground">Confirmadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FFB74D]"></div>
            <span className="text-muted-foreground">Pendientes</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-3 h-3 text-[#4DB6AC]" />
            <span className="text-muted-foreground">Pacientes de la Red</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
