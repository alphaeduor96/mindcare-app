import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { saveAppointment } from "../api/supabase";
import { ScreenHeader } from "../components/ScreenHeader";
import { usePsychologistData } from "../hooks/usePsychologistData";
import { useTheme } from "../state/ThemeContext";
import { colors, fontWeights, radii, spacing, typography } from "../theme";
import { Appointment } from "../types";
import { formatCurrency, fullPatientName } from "../utils/format";

type AgendaMode = "week" | "day" | "month";

const BUSINESS_HOURS = Array.from({ length: 13 }, (_, index) => index + 8);

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dayLabel(date: Date, index: number) {
  if (index === 0) return "Hoy";
  if (index === 1) return "Mañana";
  return new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(date);
}

function dayTitle(date: Date, index?: number) {
  if (index === 0 && sameDay(date, startOfDay(new Date()))) return "Hoy";
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (sameDay(date, tomorrow)) return "Mañana";
  return new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "2-digit", month: "short" }).format(date);
}

function weekHeaderTitle(date: Date, index?: number) {
  const dateLabel = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(date);
  if (index === 0 && sameDay(date, startOfDay(new Date()))) return `Hoy, ${dateLabel}`;
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (sameDay(date, tomorrow)) return `Mañana, ${dateLabel}`;
  const weekday = new Intl.DateTimeFormat("es-MX", { weekday: "long" }).format(date);
  return `${weekday}, ${dateLabel}`;
}

function dayNumber(date: Date) {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit" }).format(date);
}

function shortMonth(date: Date) {
  return new Intl.DateTimeFormat("es-MX", { month: "short" }).format(date).replace(".", "");
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function statusColor(status: string, themeColors: typeof colors) {
  if (status === "cancelada") return themeColors.danger;
  if (status === "completada") return themeColors.success;
  if (status === "solicitada") return themeColors.warning;
  return themeColors.primary;
}

function statusIcon(status: string): keyof typeof Ionicons.glyphMap {
  if (status === "solicitada") return "time-outline";
  if (status === "agendada") return "calendar-outline";
  if (status === "confirmada") return "checkmark-circle-outline";
  if (status === "completada") return "checkmark-done-circle-outline";
  if (status === "cancelada") return "close-outline";
  return "ellipse-outline";
}

function monthGridDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

function appointmentRange(appointment: Appointment) {
  const start = timeLabel(appointment.inicia_at);
  const end = appointment.termina_at ? ` - ${timeLabel(appointment.termina_at)}` : "";
  return `${start}${end}`;
}

export function AppointmentsScreen() {
  const theme = useTheme();
  const { profileId, appointments, patients, loading, error, reload } = usePsychologistData();
  const [mode, setMode] = useState<AgendaMode>("week");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(startOfDay(new Date()));
  const [daySlotFilter, setDaySlotFilter] = useState<"free" | "scheduled">("free");
  const [selectedPatientFilter, setSelectedPatientFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [form, setForm] = useState({
    paciente_id: "",
    inicia_at: "",
    durationMinutes: "60",
    modalidad: "presencial",
    estado: "confirmada",
    costo: "",
  });

  const dayOptions = useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const day = startOfDay(new Date());
      day.setDate(day.getDate() + index);
      return day;
    }),
    []
  );

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === form.paciente_id),
    [form.paciente_id, patients]
  );

  const patientSearchResults = useMemo(() => {
    const normalized = patientSearch.trim().toLowerCase();
    const source = normalized
      ? patients.filter((patient) =>
          [fullPatientName(patient), patient.email, patient.telefono]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalized))
        )
      : patients;

    return source.slice(0, 20);
  }, [patientSearch, patients]);

  const filteredAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => !selectedPatientFilter || appointment.paciente_id === selectedPatientFilter)
        .sort((a, b) => new Date(a.inicia_at).getTime() - new Date(b.inicia_at).getTime()),
    [appointments, selectedPatientFilter]
  );

  const dayAppointments = useMemo(
    () => filteredAppointments.filter((appointment) => sameDay(new Date(appointment.inicia_at), selectedDate)),
    [filteredAppointments, selectedDate]
  );

  const visibleHours = useMemo(
    () =>
      BUSINESS_HOURS.filter((hour) => {
        const hasAppointment = dayAppointments.some((appointment) => new Date(appointment.inicia_at).getHours() === hour);
        if (daySlotFilter === "scheduled") return hasAppointment;
        return !hasAppointment;
      }),
    [dayAppointments, daySlotFilter]
  );

  const weekGroups = useMemo(() => {
    const days = Array.from({ length: 6 }, (_, index) => {
      const day = startOfDay(new Date());
      day.setDate(day.getDate() + index);
      return day;
    });
    return days.map((day, index) => ({
      day,
      label: dayTitle(day, index),
      appointments: filteredAppointments.filter((appointment) => sameDay(new Date(appointment.inicia_at), day)),
    }));
  }, [filteredAppointments]);

  const monthDays = useMemo(() => monthGridDays(selectedMonth), [selectedMonth]);
  function openNew(hour?: number, day = selectedDate) {
    const startsAt = new Date(day);
    startsAt.setHours(hour ?? new Date().getHours() + 1, 0, 0, 0);
    const patient = patients[0];

    setEditing(null);
    setPatientSearch(patient ? fullPatientName(patient) : "");
    setPatientDropdownOpen(false);
    setForm({
      paciente_id: patient?.id || "",
      inicia_at: toLocalInputValue(startsAt),
      durationMinutes: "60",
      modalidad: "presencial",
      estado: "confirmada",
      costo: patient?.metadata?.tarifa_sesion_centavos ? String(patient.metadata.tarifa_sesion_centavos / 100) : "",
    });
    setModalOpen(true);
  }

  function openEdit(appointment: Appointment) {
    setEditing(appointment);
    setPatientSearch(fullPatientName(appointment.pacientes));
    setPatientDropdownOpen(false);
    setForm({
      paciente_id: appointment.paciente_id,
      inicia_at: toLocalInputValue(new Date(appointment.inicia_at)),
      durationMinutes: appointment.termina_at
        ? String(Math.max(30, Math.round((new Date(appointment.termina_at).getTime() - new Date(appointment.inicia_at).getTime()) / 60000)))
        : "60",
      modalidad: appointment.modalidad || "presencial",
      estado: appointment.estado || "confirmada",
      costo: appointment.costo_centavos ? String(appointment.costo_centavos / 100) : "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!profileId || !form.paciente_id || !form.inicia_at) {
      Alert.alert("Faltan datos", "Selecciona paciente, fecha y hora.");
      return;
    }

    try {
      await saveAppointment(profileId, {
        id: editing?.id,
        paciente_id: form.paciente_id,
        inicia_at: form.inicia_at,
        durationMinutes: Number(form.durationMinutes || 60),
        modalidad: form.modalidad,
        estado: form.estado,
        costo: form.costo,
      });
      setModalOpen(false);
      await reload();
    } catch (saveError: any) {
      Alert.alert("No se guardó", saveError?.message || "Revisa permisos de Supabase.");
    }
  }

  function renderDayPicker() {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
        {dayOptions.map((day, index) => {
          const active = sameDay(day, selectedDate);
          return (
            <Pressable
              key={day.toISOString()}
              style={[
                styles.dayChip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedDate(day)}
            >
              <Text style={[styles.dayChipLabel, { color: active ? "#fff" : theme.colors.muted }]}>{dayLabel(day, index)}</Text>
              <Text style={[styles.dayChipDate, { color: active ? "#fff" : theme.colors.text }]}>{dayNumber(day)}</Text>
              <Text style={[styles.dayChipMonth, { color: active ? "rgba(255,255,255,0.86)" : theme.colors.muted }]}>{shortMonth(day)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  function renderDayControls() {
    return (
      <View style={styles.dayControls}>
        <Pressable
          style={[
            styles.dayControlPill,
            {
              backgroundColor: daySlotFilter === "free" ? `${theme.colors.primary}12` : theme.colors.surface,
              borderColor: daySlotFilter === "free" ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={() => {
            setDaySlotFilter("free");
          }}
        >
          <Ionicons name="time-outline" size={18} color={daySlotFilter === "free" ? theme.colors.primary : theme.colors.muted} />
          <Text style={[styles.dayControlText, { color: daySlotFilter === "free" ? theme.colors.primaryDark : theme.colors.text }]}>Horas libres</Text>
        </Pressable>
        <Pressable
          style={[
            styles.dayControlPill,
            {
              backgroundColor: daySlotFilter === "scheduled" ? `${theme.colors.primary}12` : theme.colors.surface,
              borderColor: daySlotFilter === "scheduled" ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={() => {
            setDaySlotFilter("scheduled");
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={daySlotFilter === "scheduled" ? theme.colors.primary : theme.colors.muted} />
          <Text style={[styles.dayControlText, { color: daySlotFilter === "scheduled" ? theme.colors.primaryDark : theme.colors.text }]}>Horas agendadas</Text>
        </Pressable>
      </View>
    );
  }

  function renderAppointmentCard(appointment: Appointment, compact = false) {
    const accent = statusColor(appointment.estado, theme.colors);
    return (
      <Pressable
        key={appointment.id}
        style={[
          styles.appointmentCard,
          compact && styles.compactAppointmentCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: accent,
          },
        ]}
        onPress={() => openEdit(appointment)}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.appointmentTitleWrap}>
            <Text style={[styles.appointmentName, { color: theme.colors.text }]} numberOfLines={1}>
              {fullPatientName(appointment.pacientes)}
            </Text>
            <Text style={[styles.appointmentMeta, { color: theme.colors.muted }]}>
              {appointmentRange(appointment)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${accent}20` }]}>
            <Text style={[styles.statusText, { color: accent }]}>{appointment.estado}</Text>
          </View>
        </View>
        {!compact && (
          <View style={styles.appointmentFooter}>
            <View style={styles.footerItem}>
              <Ionicons name={appointment.modalidad === "videollamada" ? "videocam-outline" : "business-outline"} size={16} color={theme.colors.muted} />
              <Text style={[styles.footerText, { color: theme.colors.muted }]}>{appointment.modalidad || "presencial"}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="cash-outline" size={16} color={theme.colors.muted} />
              <Text style={[styles.footerText, { color: theme.colors.muted }]}>{formatCurrency(appointment.costo_centavos)}</Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  }

  function renderWeekMode() {
    return (
      <View style={[styles.weekMode, { backgroundColor: theme.mode === "dark" ? "#111A21" : "#F3F4F6" }]}>
        {weekGroups.map((group, index) => (
          <View key={group.day.toISOString()} style={styles.weekDayBlock}>
            <View style={styles.weekDayHeader}>
              <View style={styles.weekDayTitleWrap}>
                <View style={styles.twinDots}>
                  <View style={[styles.twinDot, { backgroundColor: theme.colors.warning }]} />
                  <View style={[styles.twinDot, { backgroundColor: theme.colors.danger, marginLeft: -2 }]} />
                </View>
                <Text style={[styles.weekDayTitle, { color: index === 0 ? "#1E8FE1" : theme.colors.text }]}>
                  {weekHeaderTitle(group.day, index)}
                </Text>
              </View>
              <View style={styles.weekDayMeta}>
                <Text style={[styles.weekDayCount, { color: theme.colors.text }]}>
                  {group.appointments.length}
                </Text>
                <Ionicons name={index % 2 === 0 ? "sunny-outline" : "cloud-outline"} size={24} color={index % 2 === 0 ? "#F5C542" : "#8ED2F8"} />
              </View>
            </View>
            <View style={styles.weekTimeline}>
              <View style={[styles.weekRail, { backgroundColor: theme.colors.border }]} />
              {group.appointments.length === 0 ? (
                <View style={styles.weekItemRow}>
                  <Pressable style={[styles.weekDot, { backgroundColor: theme.colors.primary }]} onPress={() => openNew(9, group.day)}>
                    <Ionicons name="add" size={18} color="#fff" />
                  </Pressable>
                  <Pressable
                    style={[styles.weekCard, { backgroundColor: theme.colors.surface }]}
                    onPress={() => openNew(9, group.day)}
                  >
                    <Text style={[styles.weekTime, { color: theme.colors.muted }]}>Libre</Text>
                    <Text style={[styles.weekTitle, { color: theme.colors.text }]}>Abrir espacio de cita</Text>
                  </Pressable>
                </View>
              ) : (
                group.appointments.map((appointment) => (
                  <View key={appointment.id} style={styles.weekItemRow}>
                    <View style={[styles.weekDot, { backgroundColor: statusColor(appointment.estado, theme.colors) }]}>
                      {appointment.estado === "completada" && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                    <Pressable
                      style={[styles.weekCard, { backgroundColor: theme.colors.surface }]}
                      onPress={() => openEdit(appointment)}
                    >
                      <Text style={[styles.weekTime, { color: theme.colors.muted }]}>
                        {timeLabel(appointment.inicia_at)}
                      </Text>
                      <View style={styles.weekCardText}>
                        <Text
                          style={[
                            styles.weekTitle,
                            {
                              color: theme.colors.text,
                              textDecorationLine: appointment.estado === "completada" ? "line-through" : "none",
                              opacity: appointment.estado === "cancelada" ? 0.55 : 1,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {fullPatientName(appointment.pacientes)}
                        </Text>
                        <View style={styles.weekSubtitleRow}>
                          <Ionicons
                            name={appointment.modalidad === "videollamada" ? "videocam" : "location"}
                            size={17}
                            color={theme.colors.muted}
                          />
                          <Text style={[styles.weekSubtitle, { color: theme.colors.muted }]} numberOfLines={1}>
                            {appointment.modalidad || "presencial"} · {formatCurrency(appointment.costo_centavos)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>
        ))}
      </View>
    );
  }

  function renderDayMode() {
    return (
      <>
        {renderDayPicker()}
        <View style={styles.dayTopRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.summaryIcon, { backgroundColor: `${theme.colors.primary}14` }]}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{dayAppointments.length}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.muted }]}>Citas</Text>
            </View>
          </View>
        </View>
        {renderDayControls()}
        <View style={styles.timeline}>
          {visibleHours.map((hour) => {
            const hourAppointments = dayAppointments.filter((appointment) => new Date(appointment.inicia_at).getHours() === hour);
            const isFree = hourAppointments.length === 0;
            return (
              <View key={hour} style={styles.hourRow}>
                <View style={styles.hourColumn}>
                  <Text style={[styles.hourText, { color: theme.colors.muted }]}>{hourLabel(hour)}</Text>
                  <View style={[styles.hourDot, { backgroundColor: isFree ? theme.colors.border : theme.colors.primary }]} />
                </View>
                <View style={styles.slotColumn}>
                  {isFree ? (
                    <Pressable
                      style={[
                        styles.freeSlot,
                        {
                          backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.045)" : "#F7F7F8",
                        },
                      ]}
                      onPress={() => openNew(hour)}
                    >
                      <View>
                        <Text style={[styles.freeTitle, { color: theme.mode === "dark" ? "rgba(234,243,242,0.5)" : "#9B9CA5" }]}>Hora libre</Text>
                        <Text style={[styles.freeDetail, { color: theme.mode === "dark" ? "rgba(234,243,242,0.38)" : "#A9AAB1" }]}>Toca para agendar</Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={28} color={theme.mode === "dark" ? "rgba(234,243,242,0.28)" : "#D1D2D7"} />
                    </Pressable>
                  ) : hourAppointments.map((appointment) => renderAppointmentCard(appointment))}
                </View>
              </View>
            );
          })}
        </View>
      </>
    );
  }

  function renderMonthMode() {
    const monthAppointments = filteredAppointments.filter((appointment) => {
      const startsAt = new Date(appointment.inicia_at);
      return startsAt.getFullYear() === selectedMonth.getFullYear() && startsAt.getMonth() === selectedMonth.getMonth();
    });

    return (
      <View style={styles.monthMode}>
        <View style={styles.monthHeader}>
          <Pressable onPress={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
            {new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(selectedMonth)}
          </Text>
          <Pressable onPress={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text} />
          </Pressable>
        </View>
        <View style={styles.weekHeader}>
          {["L", "M", "M", "J", "V", "S", "D"].map((label, index) => (
            <Text key={`${label}-${index}`} style={[styles.weekText, { color: theme.colors.muted }]}>{label}</Text>
          ))}
        </View>
        <View style={[styles.monthGrid, { borderColor: theme.colors.border }]}>
          {monthDays.map((day) => {
            const inMonth = day.getMonth() === selectedMonth.getMonth();
            const active = sameDay(day, selectedDate);
            const items = monthAppointments.filter((appointment) => sameDay(new Date(appointment.inicia_at), day)).slice(0, 3);
            return (
              <Pressable
                key={day.toISOString()}
                style={[
                  styles.monthCell,
                  {
                    backgroundColor: active ? `${theme.colors.primary}18` : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedDate(day);
                  setMode("day");
                }}
              >
                <Text style={[styles.monthDayNumber, { color: inMonth ? theme.colors.text : theme.colors.muted }]}>
                  {day.getDate()}
                </Text>
                {items.map((appointment) => (
                  <View
                    key={appointment.id}
                    style={[styles.monthEventChip, { backgroundColor: `${statusColor(appointment.estado, theme.colors)}22`, borderLeftColor: statusColor(appointment.estado, theme.colors) }]}
                  >
                    <Text style={[styles.monthEventText, { color: theme.colors.text }]} numberOfLines={1}>
                      {fullPatientName(appointment.pacientes)}
                    </Text>
                  </View>
                ))}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  function renderModalInput({
    icon,
    label,
    value,
    placeholder,
    keyboardType,
    onChangeText,
    showChevron = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    placeholder: string;
    keyboardType?: "default" | "numeric";
    onChangeText: (value: string) => void;
    showChevron?: boolean;
  }) {
    return (
      <View style={[styles.formFieldCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[styles.formIconCircle, { backgroundColor: `${theme.colors.primary}12` }]}>
          <Ionicons name={icon} size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.formFieldText}>
          <Text style={[styles.formFieldLabel, { color: theme.colors.muted }]}>{label}</Text>
          <TextInput
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor={theme.mode === "dark" ? "rgba(234,243,242,0.38)" : "#AEB9C2"}
            style={[styles.formFieldInput, { color: theme.colors.text }]}
            value={value}
            onChangeText={onChangeText}
          />
        </View>
        {showChevron ? <Ionicons name="chevron-forward" size={22} color={theme.colors.muted} /> : null}
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.screen, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />}
    >
      <ScreenHeader title="Agenda" actionLabel="Nueva cita" actionIcon="add" onAction={() => openNew()} />
      <View style={[styles.modeTabs, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
        {[
          ["week", "Semana"],
          ["day", "Día"],
          ["month", "Mes"],
        ].map(([value, label]) => {
          const active = mode === value;
          return (
            <Pressable
              key={value}
              style={[styles.modeTab, active && { backgroundColor: theme.colors.surface }]}
              onPress={() => setMode(value as AgendaMode)}
            >
              <Text style={[styles.modeTabText, { color: active ? theme.colors.primaryDark : theme.colors.muted }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sheet}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
        ) : (
          <>
            {mode === "week" && renderWeekMode()}
            {mode === "day" && renderDayMode()}
            {mode === "month" && renderMonthMode()}
          </>
        )}
      </View>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.title, { color: theme.colors.text }]}>{editing ? "Editar cita" : "Nueva cita"}</Text>

          <Text style={[styles.label, { color: theme.colors.muted }]}>Paciente</Text>
          <View style={styles.patientSelectWrap}>
            <View style={[styles.patientSearchCard, { backgroundColor: theme.colors.surface, borderColor: patientDropdownOpen ? theme.colors.primary : theme.colors.border }]}>
              <View style={[styles.formIconCircle, { backgroundColor: `${theme.colors.primary}12` }]}>
                <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.formFieldText}>
                <Text style={[styles.formFieldLabel, { color: theme.colors.muted }]}>Buscar paciente</Text>
                <TextInput
                  autoCapitalize="words"
                  placeholder="Escribe nombre, teléfono o email"
                  placeholderTextColor={theme.mode === "dark" ? "rgba(234,243,242,0.38)" : "#AEB9C2"}
                  style={[styles.formFieldInput, { color: theme.colors.text }]}
                  value={patientSearch}
                  onFocus={() => setPatientDropdownOpen(true)}
                  onChangeText={(value) => {
                    setPatientSearch(value);
                    setPatientDropdownOpen(true);
                    if (form.paciente_id && value !== (selectedPatient ? fullPatientName(selectedPatient) : "")) {
                      setForm({ ...form, paciente_id: "" });
                    }
                  }}
                />
              </View>
              <Pressable onPress={() => setPatientDropdownOpen((open) => !open)}>
                <Ionicons name={patientDropdownOpen ? "chevron-up" : "chevron-down"} size={22} color={theme.colors.muted} />
              </Pressable>
            </View>

            {patientDropdownOpen ? (
              <View style={[styles.patientDropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {patientSearchResults.length === 0 ? (
                  <Text style={[styles.patientEmptyText, { color: theme.colors.muted }]}>Sin resultados</Text>
                ) : (
                  patientSearchResults.map((patient) => {
                    const active = form.paciente_id === patient.id;
                    return (
                      <Pressable
                        key={patient.id}
                        style={[
                          styles.patientOption,
                          { borderBottomColor: theme.colors.border },
                          active && { backgroundColor: `${theme.colors.primary}10` },
                        ]}
                        onPress={() => {
                          setForm({
                            ...form,
                            paciente_id: patient.id,
                            costo: patient.metadata?.tarifa_sesion_centavos ? String(patient.metadata.tarifa_sesion_centavos / 100) : form.costo,
                          });
                          setPatientSearch(fullPatientName(patient));
                          setPatientDropdownOpen(false);
                        }}
                      >
                        <View style={[styles.patientAvatar, { backgroundColor: active ? theme.colors.primary : `${theme.colors.primary}14` }]}>
                          <Text style={[styles.patientAvatarText, { color: active ? "#fff" : theme.colors.primaryDark }]}>
                            {fullPatientName(patient)
                              .split(" ")
                              .map((piece) => piece[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.patientOptionText}>
                          <Text style={[styles.patientOptionName, { color: theme.colors.text }]} numberOfLines={1}>
                            {fullPatientName(patient)}
                          </Text>
                          <Text style={[styles.patientOptionMeta, { color: theme.colors.muted }]} numberOfLines={1}>
                            {[patient.telefono, patient.email].filter(Boolean).join(" · ") || "Sin contacto"}
                          </Text>
                        </View>
                        {active ? <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} /> : null}
                      </Pressable>
                    );
                  })
                )}
              </View>
            ) : null}
          </View>
          {selectedPatient?.metadata?.tarifa_sesion_centavos ? (
            <Text style={[styles.helper, { color: theme.colors.primaryDark }]}>Tarifa sugerida: {formatCurrency(selectedPatient.metadata.tarifa_sesion_centavos)}</Text>
          ) : null}

          {renderModalInput({
            icon: "calendar-outline",
            label: "Fecha y hora",
            value: form.inicia_at,
            placeholder: "2026-07-03T14:00",
            onChangeText: (value) => setForm({ ...form, inicia_at: value }),
            showChevron: true,
          })}
          {renderModalInput({
            icon: "time-outline",
            label: "Duración (minutos)",
            value: form.durationMinutes,
            placeholder: "60",
            keyboardType: "numeric",
            onChangeText: (value) => setForm({ ...form, durationMinutes: value }),
            showChevron: true,
          })}
          {renderModalInput({
            icon: "cash-outline",
            label: "Monto",
            value: form.costo,
            placeholder: "Ingresa el monto",
            keyboardType: "numeric",
            onChangeText: (value) => setForm({ ...form, costo: value }),
          })}

          <Text style={[styles.label, { color: theme.colors.muted }]}>Tipo de sesión</Text>
          <View style={styles.sessionTypeRow}>
            {["presencial", "videollamada"].map((modality) => {
              const active = form.modalidad === modality;
              return (
                <Pressable
                  key={modality}
                  style={[
                    styles.sessionTypeChoice,
                    {
                      backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setForm({ ...form, modalidad: modality })}
                >
                  <Ionicons name={modality === "presencial" ? "briefcase-outline" : "videocam-outline"} size={18} color={active ? "#fff" : theme.colors.muted} />
                  <Text style={[styles.sessionTypeText, { color: active ? "#fff" : theme.colors.text }]}>
                    {modality === "presencial" ? "Presencial" : "Videollamada"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: theme.colors.muted }]}>Estado de la cita</Text>
          <View style={styles.statusGrid}>
            {["solicitada", "agendada", "confirmada", "completada", "cancelada"].map((status) => {
              const active = form.estado === status;
              const accent = statusColor(status, theme.colors);
              return (
                <Pressable
                  key={status}
                  style={[
                    styles.statusChoice,
                    {
                      backgroundColor: active ? `${accent}10` : theme.colors.surface,
                      borderColor: active ? accent : theme.colors.border,
                    },
                  ]}
                  onPress={() => setForm({ ...form, estado: status })}
                >
                  <View style={[styles.statusIconCircle, { backgroundColor: `${accent}16` }]}>
                    <Ionicons name={statusIcon(status)} size={18} color={accent} />
                  </View>
                  <Text style={[styles.statusChoiceText, { color: active ? accent : theme.colors.text }]}>
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable style={[styles.primaryButtonFull, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
            <Ionicons name="calendar-outline" size={22} color="#fff" />
            <Text style={styles.primaryButtonText}>Guardar cita</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={() => setModalOpen(false)}>
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    gap: 16,
    padding: spacing.page,
    paddingBottom: 36,
  },
  modeTabs: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  modeTab: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1,
    paddingVertical: 9,
  },
  modeTabText: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.black,
  },
  sheet: {
    gap: 24,
    minHeight: 720,
  },
  title: {
    fontSize: typography.modalTitle,
    fontWeight: fontWeights.black,
  },
  error: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    color: colors.danger,
    padding: 12,
  },
  loader: {
    marginTop: 24,
  },
  daysRow: {
    gap: 8,
    paddingRight: 20,
  },
  dayChip: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 76,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 9,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  dayChipLabel: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    textTransform: "capitalize",
  },
  dayChipDate: {
    fontSize: 24,
    fontWeight: fontWeights.black,
    marginTop: 2,
    textTransform: "capitalize",
  },
  dayChipMonth: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    marginTop: -1,
    textTransform: "capitalize",
  },
  dayTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  summaryCard: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  summaryIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  summaryLabel: {
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
  },
  summaryValue: {
    fontSize: 19,
    fontWeight: fontWeights.black,
  },
  dayControls: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  dayControlPill: {
    alignItems: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  dayControlText: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.bold,
  },
  timeline: {
    gap: 16,
  },
  hourRow: {
    flexDirection: "row",
    gap: 16,
  },
  hourColumn: {
    alignItems: "center",
    width: 52,
  },
  hourText: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.black,
  },
  hourDot: {
    borderRadius: 5,
    height: 10,
    marginTop: 16,
    width: 10,
  },
  slotColumn: {
    flex: 1,
    gap: 10,
  },
  freeSlot: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 82,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  freeTitle: {
    fontSize: typography.cardTitle,
    fontWeight: fontWeights.black,
  },
  freeDetail: {
    fontSize: typography.bodySmall,
    marginTop: 3,
  },
  appointmentCard: {
    borderLeftWidth: 7,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    minHeight: 116,
    padding: 16,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  compactAppointmentCard: {
    minHeight: 76,
  },
  appointmentHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  appointmentTitleWrap: {
    flex: 1,
  },
  appointmentName: {
    fontSize: 19,
    fontWeight: fontWeights.black,
  },
  appointmentMeta: {
    fontSize: typography.body,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeights.black,
    textTransform: "capitalize",
  },
  appointmentFooter: {
    flexDirection: "row",
    gap: 14,
  },
  footerItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  footerText: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.bold,
    textTransform: "capitalize",
  },
  weekMode: {
    borderRadius: radii.large,
    overflow: "hidden",
    paddingBottom: 14,
  },
  weekDayBlock: {
    paddingTop: 16,
  },
  weekDayHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  weekDayTitleWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  twinDots: {
    flexDirection: "row",
    width: 24,
  },
  twinDot: {
    borderRadius: 8,
    height: 14,
    width: 14,
  },
  weekDayTitle: {
    fontSize: 20,
    fontWeight: fontWeights.bold,
    letterSpacing: 0,
    textTransform: "capitalize",
  },
  weekDayMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  weekDayCount: {
    fontSize: typography.body,
    fontWeight: fontWeights.bold,
  },
  weekTimeline: {
    gap: 10,
    paddingHorizontal: 14,
    position: "relative",
  },
  weekRail: {
    bottom: 2,
    left: 27,
    position: "absolute",
    top: 0,
    width: 1,
  },
  weekItemRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 66,
  },
  weekDot: {
    alignItems: "center",
    borderRadius: 12,
    height: 22,
    justifyContent: "center",
    width: 22,
    zIndex: 2,
  },
  weekCard: {
    alignItems: "center",
    borderRadius: radii.medium,
    flex: 1,
    flexDirection: "row",
    minHeight: 66,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  weekTime: {
    fontSize: typography.body,
    fontWeight: "500",
    marginRight: 12,
    textAlign: "right",
    width: 62,
  },
  weekCardText: {
    flex: 1,
    gap: 4,
  },
  weekTitle: {
    fontSize: typography.cardTitle,
    fontWeight: fontWeights.bold,
    letterSpacing: 0,
  },
  weekSubtitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  weekSubtitle: {
    flex: 1,
    fontSize: typography.bodySmall,
    fontWeight: "500",
  },
  listMode: {
    gap: 24,
  },
  listDayBlock: {
    gap: 10,
  },
  listDayHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listDayTitle: {
    fontSize: 23,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  listDayCount: {
    fontSize: 13,
    fontWeight: "800",
  },
  listTimeline: {
    gap: 10,
    paddingLeft: 6,
    position: "relative",
  },
  timelineRail: {
    bottom: 0,
    left: 8,
    position: "absolute",
    top: 0,
    width: 1,
  },
  listItemRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  timelinePoint: {
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  listHour: {
    fontSize: 13,
    fontWeight: "800",
    width: 54,
  },
  listCardWrap: {
    flex: 1,
  },
  monthMode: {
    gap: 14,
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthTitle: {
    fontSize: typography.sectionTitle,
    fontWeight: fontWeights.black,
    textTransform: "capitalize",
  },
  weekHeader: {
    flexDirection: "row",
  },
  weekText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  monthGrid: {
    borderLeftWidth: 1,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  monthCell: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    minHeight: 82,
    padding: 5,
    width: `${100 / 7}%`,
  },
  monthDayNumber: {
    alignSelf: "flex-end",
    fontSize: 12,
    fontWeight: "900",
  },
  monthEventChip: {
    borderLeftWidth: 3,
    borderRadius: 5,
    marginTop: 4,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  monthEventText: {
    fontSize: 9,
    fontWeight: "800",
  },
  modalContent: {
    gap: 20,
    padding: 24,
    paddingBottom: 52,
  },
  sheetHandle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 6,
    marginBottom: 14,
    width: 58,
  },
  label: {
    fontSize: typography.body,
    fontWeight: fontWeights.black,
    marginBottom: -8,
  },
  patientSelectWrap: {
    gap: 8,
  },
  patientSearchCard: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 82,
    paddingHorizontal: 18,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.045,
    shadowRadius: 18,
  },
  patientDropdown: {
    borderRadius: 22,
    borderWidth: 1,
    maxHeight: 320,
    overflow: "hidden",
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
  },
  patientOption: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  patientAvatar: {
    alignItems: "center",
    borderRadius: 18,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  patientAvatarText: {
    fontSize: typography.caption,
    fontWeight: fontWeights.black,
  },
  patientOptionText: {
    flex: 1,
  },
  patientOptionName: {
    fontSize: typography.body,
    fontWeight: fontWeights.black,
  },
  patientOptionMeta: {
    fontSize: typography.bodySmall,
    marginTop: 2,
  },
  patientEmptyText: {
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
    padding: 18,
    textAlign: "center",
  },
  helper: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.bold,
    marginTop: -12,
  },
  formFieldCard: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 92,
    paddingHorizontal: 18,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.045,
    shadowRadius: 18,
  },
  formIconCircle: {
    alignItems: "center",
    borderRadius: 24,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  formFieldText: {
    flex: 1,
  },
  formFieldLabel: {
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
    marginBottom: 2,
  },
  formFieldInput: {
    fontSize: 19,
    fontWeight: fontWeights.semibold,
    minHeight: 34,
    padding: 0,
  },
  sessionTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sessionTypeChoice: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    minWidth: 156,
    paddingHorizontal: 18,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.045,
    shadowRadius: 15,
  },
  sessionTypeText: {
    fontSize: typography.body,
    fontWeight: fontWeights.black,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statusChoice: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 14,
    width: "47.8%",
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
  },
  statusIconCircle: {
    alignItems: "center",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  statusChoiceText: {
    flex: 1,
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.black,
    textTransform: "capitalize",
  },
  primaryButtonFull: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 12,
    height: 72,
    justifyContent: "center",
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: typography.body,
    fontWeight: "900",
  },
});
