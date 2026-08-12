import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { createPatient } from "../api/supabase";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ScreenHeader } from "../components/ScreenHeader";
import { usePsychologistData } from "../hooks/usePsychologistData";
import { useTheme } from "../state/ThemeContext";
import { colors, fontWeights, spacing, typography } from "../theme";
import { formatCurrency, fullPatientName } from "../utils/format";

export function PatientsScreen() {
  const theme = useTheme();
  const { profileId, patients, loading, error, reload } = usePsychologistData();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    tarifa: "",
    notas: "",
  });

  const filteredPatients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return patients;

    return patients.filter((patient) =>
      [fullPatientName(patient), patient.email, patient.telefono]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [patients, query]);

  async function handleCreatePatient() {
    if (!profileId || !form.nombre.trim() || !form.apellido.trim() || !form.telefono.trim()) {
      Alert.alert("Faltan datos", "Nombre, apellido y teléfono son requeridos.");
      return;
    }

    try {
      await createPatient(profileId, form);
      setModalOpen(false);
      setForm({ nombre: "", apellido: "", email: "", telefono: "", tarifa: "", notas: "" });
      await reload();
    } catch (createError: any) {
      Alert.alert("No se guardó", createError?.message || "Revisa permisos de Supabase.");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />}
    >
      <ScreenHeader title="Pacientes" actionLabel="Nuevo" actionIcon="person-add-outline" onAction={() => setModalOpen(true)} />
      <TextInput
        onChangeText={setQuery}
        placeholder="Buscar paciente"
        placeholderTextColor={theme.colors.muted}
        style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
        value={query}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : filteredPatients.length === 0 ? (
        <EmptyState title="Sin pacientes" detail="Los pacientes reales del psicólogo aparecerán aquí." />
      ) : (
        filteredPatients.map((patient) => (
          <Card key={patient.id} style={styles.card}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.purple }]}>
              <Text style={styles.avatarText}>
                {fullPatientName(patient)
                  .split(" ")
                  .map((piece) => piece[0])
                  .join("")
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={[styles.name, { color: theme.colors.text }]}>{fullPatientName(patient)}</Text>
              <Text style={[styles.meta, { color: theme.colors.muted }]}>{patient.telefono || "Sin teléfono"}</Text>
              <Text style={[styles.meta, { color: theme.colors.muted }]}>{patient.email || "Sin email"}</Text>
              <Text style={[styles.fee, { color: theme.colors.primaryDark }]}>
                Tarifa: {formatCurrency(patient.metadata?.tarifa_sesion_centavos || 0)}
              </Text>
            </View>
          </Card>
        ))
      )}

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Nuevo paciente</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} placeholder="Nombre" placeholderTextColor={theme.colors.muted} value={form.nombre} onChangeText={(value) => setForm({ ...form, nombre: value })} />
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} placeholder="Apellido" placeholderTextColor={theme.colors.muted} value={form.apellido} onChangeText={(value) => setForm({ ...form, apellido: value })} />
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} keyboardType="email-address" autoCapitalize="none" placeholder="Email" placeholderTextColor={theme.colors.muted} value={form.email} onChangeText={(value) => setForm({ ...form, email: value })} />
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} keyboardType="phone-pad" placeholder="Teléfono" placeholderTextColor={theme.colors.muted} value={form.telefono} onChangeText={(value) => setForm({ ...form, telefono: value })} />
          <TextInput style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} keyboardType="numeric" placeholder="Tarifa por sesión" placeholderTextColor={theme.colors.muted} value={form.tarifa} onChangeText={(value) => setForm({ ...form, tarifa: value })} />
          <TextInput style={[styles.textarea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]} multiline placeholder="Notas" placeholderTextColor={theme.colors.muted} value={form.notas} onChangeText={(value) => setForm({ ...form, notas: value })} />
          <Pressable style={[styles.primaryButtonFull, { backgroundColor: theme.colors.primary }]} onPress={handleCreatePatient}>
            <Text style={styles.primaryButtonText}>Guardar paciente</Text>
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
  content: {
    backgroundColor: colors.background,
    gap: spacing.screenGap,
    padding: spacing.page,
    paddingBottom: 36,
  },
  title: {
    color: colors.text,
    fontSize: typography.modalTitle,
    fontWeight: fontWeights.black,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: fontWeights.bold,
  },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    height: 52,
    paddingHorizontal: 16,
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
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  avatarText: {
    color: "#fff",
    fontWeight: fontWeights.bold,
  },
  patientInfo: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: fontWeights.bold,
  },
  meta: {
    color: colors.muted,
    marginTop: 3,
  },
  fee: {
    color: colors.primaryDark,
    fontWeight: fontWeights.bold,
    marginTop: 8,
  },
  modalContent: {
    backgroundColor: colors.background,
    gap: 12,
    padding: spacing.page,
    paddingBottom: 40,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  textarea: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 100,
    padding: 14,
    textAlignVertical: "top",
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
