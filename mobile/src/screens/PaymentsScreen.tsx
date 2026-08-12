import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { createAppointmentPayment, getPayments } from "../api/supabase";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ScreenHeader } from "../components/ScreenHeader";
import { usePsychologistData } from "../hooks/usePsychologistData";
import { useTheme } from "../state/ThemeContext";
import { Payment } from "../types";
import { colors, fontWeights, spacing, typography } from "../theme";
import { formatCurrency, formatDateTime, fullPatientName } from "../utils/format";

export function PaymentsScreen() {
  const theme = useTheme();
  const { profileId, appointments, loading: loadingBase, reload } = usePsychologistData();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  async function loadPayments() {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPayments(await getPayments(profileId));
    } catch (error: any) {
      Alert.alert("Pagos", error?.message || "No se pudieron cargar pagos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, [profileId]);

  const unpaidAppointments = useMemo(() => {
    const paidIds = new Set(payments.filter((payment) => payment.estado === "pagado").map((payment) => payment.cita_id));
    return appointments.filter((appointment) => appointment.estado !== "cancelada" && !paidIds.has(appointment.id));
  }, [appointments, payments]);

  async function handleSave() {
    if (!appointmentId || !amount || Number(amount) <= 0) {
      Alert.alert("Faltan datos", "Selecciona cita y monto válido.");
      return;
    }
    try {
      await createAppointmentPayment({ cita_id: appointmentId, amount, reference });
      setModalOpen(false);
      setAppointmentId("");
      setAmount("");
      setReference("");
      await loadPayments();
    } catch (error: any) {
      Alert.alert("No se guardó", error?.message || "Revisa permisos de Supabase.");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={loading || loadingBase} onRefresh={() => { reload(); loadPayments(); }} tintColor={theme.colors.primary} />}
    >
      <ScreenHeader title="Pagos" actionLabel="Registrar" actionIcon="card-outline" onAction={() => setModalOpen(true)} />

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : payments.length === 0 ? (
        <EmptyState title="Sin pagos" detail="Registra pagos de citas desde la app." />
      ) : (
        payments.map((payment) => (
          <Card key={payment.id} style={styles.card}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{fullPatientName(payment.citas?.pacientes)}</Text>
            <Text style={[styles.meta, { color: theme.colors.muted }]}>{payment.citas?.inicia_at ? formatDateTime(payment.citas.inicia_at) : "Sin cita"}</Text>
            <Text style={[styles.amount, { color: theme.colors.success }]}>{formatCurrency(payment.monto_centavos)}</Text>
          </Card>
        ))
      )}

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Registrar pago</Text>
          <Text style={[styles.label, { color: theme.colors.text }]}>Cita</Text>
          {unpaidAppointments.map((appointment) => (
            <Pressable
              key={appointment.id}
              style={[
                styles.choice,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                appointmentId === appointment.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
              onPress={() => {
                setAppointmentId(appointment.id);
                setAmount(appointment.costo_centavos ? String(appointment.costo_centavos / 100) : amount);
              }}
            >
              <Text style={[styles.choiceText, { color: theme.colors.text }, appointmentId === appointment.id && styles.choiceTextActive]}>
                {fullPatientName(appointment.pacientes)} · {formatDateTime(appointment.inicia_at)}
              </Text>
            </Pressable>
          ))}
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} keyboardType="numeric" placeholder="Monto" placeholderTextColor={theme.colors.muted} value={amount} onChangeText={setAmount} />
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} placeholder="Referencia opcional" placeholderTextColor={theme.colors.muted} value={reference} onChangeText={setReference} />
          <Pressable style={[styles.primaryButtonFull, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Guardar pago</Text>
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
  content: { backgroundColor: colors.background, gap: spacing.screenGap, padding: spacing.page, paddingBottom: 36 },
  title: { color: colors.text, fontSize: typography.modalTitle, fontWeight: fontWeights.black },
  loader: { marginTop: 24 },
  card: { gap: 4 },
  name: { color: colors.text, fontSize: typography.cardTitle, fontWeight: fontWeights.bold },
  meta: { color: colors.muted },
  amount: { color: colors.success, fontSize: 20, fontWeight: fontWeights.bold },
  modalContent: { backgroundColor: colors.background, gap: 12, padding: spacing.page, paddingBottom: 40 },
  label: { color: colors.text, fontWeight: fontWeights.bold },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: typography.body, minHeight: 52, paddingHorizontal: 14 },
  choice: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, padding: 12 },
  choiceText: { color: colors.text, fontWeight: fontWeights.semibold },
  choiceTextActive: { color: "#fff" },
  primaryButtonFull: { alignItems: "center", backgroundColor: colors.primary, borderRadius: 16, height: 54, justifyContent: "center" },
  primaryButtonText: { color: "#fff", fontWeight: fontWeights.bold },
  secondaryButton: { alignItems: "center", borderColor: colors.border, borderRadius: 16, borderWidth: 1, height: 52, justifyContent: "center" },
  secondaryButtonText: { color: colors.text, fontWeight: fontWeights.bold },
});
