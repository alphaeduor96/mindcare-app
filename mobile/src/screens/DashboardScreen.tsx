import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ScreenHeader } from "../components/ScreenHeader";
import { usePsychologistData } from "../hooks/usePsychologistData";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";
import { colors, fontWeights, spacing, typography } from "../theme";
import { formatCurrency, formatDateTime, fullPatientName } from "../utils/format";

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const theme = useTheme();
  const {
    appointments,
    patients,
    todayAppointments,
    monthlyIncomeCents,
    loading,
    error,
    reload,
  } = usePsychologistData();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />}
    >
      <ScreenHeader title="Inicio" subtitle={`Hola, ${user?.nombre || "psicolog@"}`} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Citas hoy</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{loading ? "..." : todayAppointments.length}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Pacientes</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{loading ? "..." : patients.length}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Citas totales</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{loading ? "..." : appointments.length}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Ingreso mes</Text>
          <Text style={[styles.statValueSmall, { color: theme.colors.text }]}>{loading ? "..." : formatCurrency(monthlyIncomeCents)}</Text>
        </Card>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Acciones rápidas</Text>
      <View style={styles.quickGrid}>
        {[
          { label: "Cita", icon: "add-circle-outline", route: "Agenda" },
          { label: "Paciente", icon: "person-add-outline", route: "Pacientes" },
          { label: "Pago", icon: "card-outline", route: "Pagos" },
          { label: "Nota", icon: "create-outline", route: "Expedientes" },
        ].map((action) => (
          <Pressable
            key={action.label}
            style={[styles.quickAction, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate(action.route)}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name={action.icon as any} size={26} color={theme.colors.primary} />
            </View>
            <Text style={[styles.quickText, { color: theme.colors.text }]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Próximas citas</Text>
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : todayAppointments.length === 0 ? (
        <EmptyState title="Sin citas hoy" detail="Cuando tengas citas agendadas aparecerán aquí." />
      ) : (
        todayAppointments.slice(0, 4).map((appointment) => (
          <Card key={appointment.id} style={styles.appointmentCard}>
            <Text style={[styles.appointmentName, { color: theme.colors.text }]}>{fullPatientName(appointment.pacientes)}</Text>
            <Text style={[styles.appointmentMeta, { color: theme.colors.muted }]}>{formatDateTime(appointment.inicia_at)}</Text>
            <Text style={[styles.appointmentStatus, { color: theme.colors.primaryDark }]}>{appointment.estado}</Text>
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
  error: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    color: colors.danger,
    padding: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    minHeight: 104,
    width: "47.8%",
  },
  statLabel: {
    color: colors.muted,
    fontSize: typography.bodySmall,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.metric,
    fontWeight: fontWeights.bold,
    marginTop: 12,
  },
  statValueSmall: {
    color: colors.text,
    fontSize: 20,
    fontWeight: fontWeights.bold,
    marginTop: 18,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle,
    fontWeight: fontWeights.bold,
    marginTop: 12,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 10,
  },
  quickAction: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minHeight: 96,
    padding: 10,
  },
  quickIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  quickText: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.black,
  },
  loader: {
    marginTop: 24,
  },
  appointmentCard: {
    gap: 4,
  },
  appointmentName: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: fontWeights.bold,
  },
  appointmentMeta: {
    color: colors.muted,
  },
  appointmentStatus: {
    color: colors.primaryDark,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
