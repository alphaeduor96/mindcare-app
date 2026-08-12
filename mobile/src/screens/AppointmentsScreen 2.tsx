import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { saveAppointment } from "../api/supabase";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { usePsychologistData } from "../hooks/usePsychologistData";
import { colors, spacing } from "../theme";
import { formatCurrency, formatDateTime, fullPatientName } from "../utils/format";
import { Appointment } from "../types";

function statusColor(status: string) {
  if (status === "cancelada") return colors.danger;
  if (status === "completada") return colors.success;
  if (status === "solicitada") return colors.warning;
  return colors.primaryDark;
}

export function AppointmentsScreen() {
  const { profileId, appointments, patients, loading, error, reload } = usePsychologistData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState({
    paciente_id: "",
    inicia_at: "",
    durationMinutes: "60",
    modalidad: "presencial",
    estado: "confirmada",
    costo: "",
  });

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === form.paciente_id),
    [form.paciente_id, patients]
  );

  function openNew() {
    setEditing(null);
    setForm({
      paciente_id: patients[0]?.id || "",
      inicia_at: new Date().toISOString().slice(0, 16),
      durationMinutes: "60",
      modalidad: "presencial",
      estado: "confirmada",
      costo: patients[0]?.metadata?.tarifa_sesion_centavos ? String(patients[0].metadata.tarifa_sesion_centavos / 100) : "",
    });
    setModalOpen(true);
  }

  function openEdit(appointment: Appointment) {
    setEditing(appointment);
    setForm({
      paciente_id: appointment.paciente_id,
      inicia_at: new Date(appointment.inicia_at).toISOString().slice(0, 16),
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

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Citas</Text>
          <Text style={styles.subtle}>Crear y editar citas reales</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={openNew}>
          <Text style={styles.primaryButtonText}>Nueva</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : appointments.length === 0 ? (
        <EmptyState title="No hay citas" detail="Las citas reales del psicólogo aparecerán aquí." />
      ) : (
        appointments.map((appointment) => (
          <Pressable key={appointment.id} onPress={() => openEdit(appointment)}>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.name}>{fullPatientName(appointment.pacientes)}</Text>
                <Text style={styles.date}>{formatDateTime(appointment.inicia_at)}</Text>
              </View>
              <Text style={[styles.status, { color: statusColor(appointment.estado) }]}>
                {appointment.estado}
              </Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.detail}>{appointment.modalidad || "presencial"}</Text>
              <Text style={styles.detail}>{formatCurrency(appointment.costo_centavos)}</Text>
            </View>
          </Card>
          </Pressable>
        ))
      )}

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.title}>{editing ? "Editar cita" : "Nueva cita"}</Text>
          <Text style={styles.label}>Paciente</Text>
          <View style={styles.selectorWrap}>
            {patients.map((patient) => (
              <Pressable
                key={patient.id}
                style={[styles.choice, form.paciente_id === patient.id && styles.choiceActive]}
                onPress={() =>
                  setForm({
                    ...form,
                    paciente_id: patient.id,
                    costo: patient.metadata?.tarifa_sesion_centavos ? String(patient.metadata.tarifa_sesion_centavos / 100) : form.costo,
                  })
                }
              >
                <Text style={[styles.choiceText, form.paciente_id === patient.id && styles.choiceTextActive]}>
                  {fullPatientName(patient)}
                </Text>
              </Pressable>
            ))}
          </View>
          {selectedPatient?.metadata?.tarifa_sesion_centavos ? (
            <Text style={styles.helper}>Tarifa sugerida: {formatCurrency(selectedPatient.metadata.tarifa_sesion_centavos)}</Text>
          ) : null}
          <TextInput style={styles.input} placeholder="Fecha y hora: 2026-07-03T14:00" placeholderTextColor={colors.muted} value={form.inicia_at} onChangeText={(value) => setForm({ ...form, inicia_at: value })} />
          <TextInput style={styles.input} keyboardType="numeric" placeholder="Duración minutos" placeholderTextColor={colors.muted} value={form.durationMinutes} onChangeText={(value) => setForm({ ...form, durationMinutes: value })} />
          <TextInput style={styles.input} keyboardType="numeric" placeholder="Monto" placeholderTextColor={colors.muted} value={form.costo} onChangeText={(value) => setForm({ ...form, costo: value })} />
          <View style={styles.selectorWrap}>
            {["presencial", "videollamada"].map((modality) => (
              <Pressable key={modality} style={[styles.choice, form.modalidad === modality && styles.choiceActive]} onPress={() => setForm({ ...form, modalidad: modality })}>
                <Text style={[styles.choiceText, form.modalidad === modality && styles.choiceTextActive]}>{modality}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.selectorWrap}>
            {["solicitada", "agendada", "confirmada", "completada", "cancelada"].map((status) => (
              <Pressable key={status} style={[styles.choice, form.estado === status && styles.choiceActive]} onPress={() => setForm({ ...form, estado: status })}>
                <Text style={[styles.choiceText, form.estado === status && styles.choiceTextActive]}>{status}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.primaryButtonFull} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Guardar cita</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setModalOpen(false)}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
    gap: 12,
    padding: spacing.page,
    paddingBottom: 36,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  subtle: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 8,
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
    gap: 12,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  date: {
    color: colors.muted,
    marginTop: 4,
  },
  status: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  details: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  detail: {
    color: colors.muted,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  modalContent: {
    backgroundColor: colors.background,
    gap: 12,
    padding: spacing.page,
    paddingBottom: 40,
  },
  label: {
    color: colors.text,
    fontWeight: "800",
  },
  selectorWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceText: {
    color: colors.text,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  choiceTextActive: {
    color: "#fff",
  },
  helper: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  primaryButtonFull: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "800",
  },
});
