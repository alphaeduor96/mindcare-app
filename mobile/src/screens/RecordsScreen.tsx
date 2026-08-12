import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { createClinicalNote, getClinicalNotes } from "../api/supabase";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ScreenHeader } from "../components/ScreenHeader";
import { usePsychologistData } from "../hooks/usePsychologistData";
import { useTheme } from "../state/ThemeContext";
import { ClinicalNote } from "../types";
import { colors, fontWeights, spacing, typography } from "../theme";
import { fullPatientName } from "../utils/format";

export function RecordsScreen() {
  const theme = useTheme();
  const { profileId, patients, appointments, loading: loadingBase, reload } = usePsychologistData();
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [observations, setObservations] = useState("");

  async function loadNotes() {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setNotes(await getClinicalNotes(profileId));
    } catch (error: any) {
      Alert.alert("Expedientes", error?.message || "No se pudieron cargar expedientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, [profileId]);

  const patientAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.paciente_id === selectedPatientId),
    [appointments, selectedPatientId]
  );

  async function handleSave() {
    if (!profileId || !selectedPatientId || !content.trim()) {
      Alert.alert("Faltan datos", "Selecciona paciente y escribe el contenido.");
      return;
    }

    try {
      await createClinicalNote(profileId, {
        paciente_id: selectedPatientId,
        cita_id: selectedAppointmentId || undefined,
        titulo: title,
        tipo: "nota_clinica",
        fecha_clinica: new Date().toISOString().slice(0, 10),
        contenido: content,
        observaciones: observations,
      });
      setModalOpen(false);
      setTitle("");
      setContent("");
      setObservations("");
      await loadNotes();
    } catch (error: any) {
      Alert.alert("No se guardó", error?.message || "Revisa permisos de Supabase.");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={loading || loadingBase} onRefresh={() => { reload(); loadNotes(); }} tintColor={theme.colors.primary} />}
    >
      <ScreenHeader title="Expedientes" subtitle="Notas clínicas reales" actionLabel="Nueva" actionIcon="create-outline" onAction={() => setModalOpen(true)} />

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : notes.length === 0 ? (
        <EmptyState title="Sin entradas" detail="Crea la primera nota clínica desde la app." />
      ) : (
        notes.map((note) => (
          <Card key={note.id} style={styles.card}>
            <Text style={[styles.noteTitle, { color: theme.colors.text }]}>{note.titulo || "Nota clínica"}</Text>
            <Text style={[styles.meta, { color: theme.colors.muted }]}>{fullPatientName(note.pacientes)}</Text>
            <Text style={[styles.body, { color: theme.colors.text }]} numberOfLines={4}>{note.contenido}</Text>
          </Card>
        ))
      )}

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Nueva entrada</Text>
          <Text style={[styles.label, { color: theme.colors.text }]}>Paciente</Text>
          <View style={styles.selectorWrap}>
            {patients.map((patient) => (
              <Pressable
                key={patient.id}
                style={[
                  styles.choice,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  selectedPatientId === patient.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => {
                  setSelectedPatientId(patient.id);
                  setSelectedAppointmentId("");
                }}
              >
                <Text style={[styles.choiceText, { color: theme.colors.text }, selectedPatientId === patient.id && styles.choiceTextActive]}>
                  {fullPatientName(patient)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.text }]}>Cita relacionada opcional</Text>
          <View style={styles.selectorWrap}>
            {patientAppointments.map((appointment) => (
              <Pressable
                key={appointment.id}
                style={[
                  styles.choice,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  selectedAppointmentId === appointment.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedAppointmentId(appointment.id)}
              >
                <Text style={[styles.choiceText, { color: theme.colors.text }, selectedAppointmentId === appointment.id && styles.choiceTextActive]}>
                  {new Date(appointment.inicia_at).toLocaleDateString("es-MX")}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} placeholder="Título" placeholderTextColor={theme.colors.muted} value={title} onChangeText={setTitle} />
          <TextInput style={[styles.textarea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} placeholder="Contenido clínico" placeholderTextColor={theme.colors.muted} value={content} onChangeText={setContent} multiline />
          <TextInput style={[styles.textarea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} placeholder="Observaciones" placeholderTextColor={theme.colors.muted} value={observations} onChangeText={setObservations} multiline />

          <Pressable style={[styles.primaryButtonFull, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Guardar expediente</Text>
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
  card: { gap: 6 },
  noteTitle: { color: colors.text, fontSize: typography.cardTitle, fontWeight: fontWeights.bold },
  meta: { color: colors.muted },
  body: { color: colors.text, lineHeight: 20 },
  primaryButtonText: { color: "#fff", fontWeight: fontWeights.bold },
  modalContent: { backgroundColor: colors.background, gap: 12, padding: spacing.page, paddingBottom: 40 },
  label: { color: colors.text, fontWeight: fontWeights.bold, marginTop: 6 },
  selectorWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  choiceText: { color: colors.text, fontWeight: fontWeights.semibold },
  choiceTextActive: { color: "#fff" },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: typography.body, minHeight: 52, paddingHorizontal: 14 },
  textarea: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: typography.body, minHeight: 120, padding: 14, textAlignVertical: "top" },
  primaryButtonFull: { alignItems: "center", backgroundColor: colors.primary, borderRadius: 16, height: 54, justifyContent: "center", marginTop: 8 },
  secondaryButton: { alignItems: "center", borderColor: colors.border, borderRadius: 16, borderWidth: 1, height: 52, justifyContent: "center" },
  secondaryButtonText: { color: colors.text, fontWeight: fontWeights.bold },
});
