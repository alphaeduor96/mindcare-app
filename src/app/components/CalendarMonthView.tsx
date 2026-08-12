import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
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
import type { CalendarModalityColors } from "../utils/calendarColors";

interface CalendarMonthViewProps {
  currentDate: Date;
  appointments: CalendarAppointment[];
  onDayClick: (date: Date) => void;
  modalityColors: CalendarModalityColors;
}

export function CalendarMonthView({
  currentDate,
  appointments,
  onDayClick,
  modalityColors,
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
      presencial: dayAppointments.filter((apt) => apt.modality === "presencial").length,
      virtual: dayAppointments.filter((apt) => apt.modality === "virtual").length,
      status: dayAppointments.some((apt) => apt.status === "scheduled")
        ? "scheduled"
        : dayAppointments.some((apt) => apt.status === "cancelled")
          ? "cancelled"
          : "no_show",
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
                        {dayAppointments.presencial > 0 && (
                          <Badge
                            className="w-full justify-center text-xs text-white border-transparent"
                            style={{ backgroundColor: modalityColors.presencial }}
                          >
                            {dayAppointments.presencial} presencial
                          </Badge>
                        )}
                        {dayAppointments.virtual > 0 && (
                          <Badge
                            className="w-full justify-center text-xs text-white border-transparent"
                            style={{ backgroundColor: modalityColors.virtual }}
                          >
                            {dayAppointments.virtual} en línea
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
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: modalityColors.presencial }}></div>
            <span className="text-muted-foreground">Presencial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: modalityColors.virtual }}></div>
            <span className="text-muted-foreground">En línea</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
