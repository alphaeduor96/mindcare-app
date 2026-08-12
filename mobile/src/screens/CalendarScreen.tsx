import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ScreenHeader } from "../components/ScreenHeader";
import { usePsychologistData } from "../hooks/usePsychologistData";
import { useTheme } from "../state/ThemeContext";
import { colors, fontWeights, spacing, typography } from "../theme";
import { formatDateTime, fullPatientName } from "../utils/format";

function monthTitle(date: Date) {
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(date);
}

export function CalendarScreen() {
  const theme = useTheme();
  const { appointments, loading, error, reload } = usePsychologistData();
  const [month, setMonth] = useState(new Date());

  const monthAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const startsAt = new Date(appointment.inicia_at);
        return startsAt.getFullYear() === month.getFullYear() && startsAt.getMonth() === month.getMonth();
      }),
    [appointments, month]
  );

  function moveMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />}
    >
      <ScreenHeader title="Calendario" />
      <View style={styles.monthBar}>
        <Pressable style={[styles.monthButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => moveMonth(-1)}>
          <Text style={[styles.monthButtonText, { color: theme.colors.primaryDark }]}>Anterior</Text>
        </Pressable>
        <Text style={[styles.monthTitle, { color: theme.colors.text }]}>{monthTitle(month)}</Text>
        <Pressable style={[styles.monthButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => moveMonth(1)}>
          <Text style={[styles.monthButtonText, { color: theme.colors.primaryDark }]}>Siguiente</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : monthAppointments.length === 0 ? (
        <EmptyState title="Sin citas este mes" />
      ) : (
        monthAppointments.map((appointment) => (
          <Card key={appointment.id} style={styles.card}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{fullPatientName(appointment.pacientes)}</Text>
            <Text style={[styles.meta, { color: theme.colors.muted }]}>{formatDateTime(appointment.inicia_at)}</Text>
            <Text style={[styles.status, { color: theme.colors.primaryDark }]}>{appointment.estado}</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
    gap: spacing.screenGap,
    padding: spacing.page,
    paddingBottom: 36,
  },
  monthBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  monthButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  monthButtonText: {
    color: colors.primaryDark,
    fontWeight: fontWeights.bold,
  },
  monthTitle: {
    color: colors.text,
    flex: 1,
    fontSize: typography.cardTitle,
    fontWeight: fontWeights.bold,
    textAlign: "center",
    textTransform: "capitalize",
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
  card: {
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: fontWeights.bold,
  },
  meta: {
    color: colors.muted,
  },
  status: {
    color: colors.primaryDark,
    fontWeight: fontWeights.bold,
    textTransform: "capitalize",
  },
});
