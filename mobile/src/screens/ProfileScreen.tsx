import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../components/Card";
import { ScreenHeader } from "../components/ScreenHeader";
import { savePushToken } from "../api/supabase";
import { registerForPushNotifications } from "../notifications";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";
import { colors, fontWeights, spacing, typography } from "../theme";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const theme = useTheme();

  async function handleLogout() {
    Alert.alert("Cerrar sesión", "¿Quieres salir de MindCare?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => {
          logout();
        },
      },
    ]);
  }

  async function handleEnablePush() {
    if (!user?.id) return;
    try {
      const token = await registerForPushNotifications();
      await savePushToken(user.id, token);
      Alert.alert("Notificaciones activas", "El dispositivo quedó registrado para push notifications.");
    } catch (error: any) {
      Alert.alert("No se activaron", error?.message || "Revisa permisos del dispositivo.");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Perfil" />
      <Card style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="person-outline" size={34} color="#fff" />
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>{user?.nombre} {user?.apellido}</Text>
        <Text style={[styles.meta, { color: theme.colors.muted }]}>{user?.email}</Text>
        <Text style={[styles.role, { color: theme.colors.primaryDark }]}>Psicólogo</Text>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Primera versión móvil</Text>
        <Text style={[styles.detail, { color: theme.colors.muted }]}>
          Esta app ya inicia sesión contra Supabase y lee citas/pacientes reales para el panel de psicólogo.
        </Text>
      </Card>

      <Pressable onPress={theme.toggleTheme} style={[styles.secondaryAction, { borderColor: theme.colors.border }]}>
        <Text style={[styles.secondaryActionText, { color: theme.colors.text }]}>
          Cambiar a modo {theme.mode === "dark" ? "claro" : "oscuro"}
        </Text>
      </Pressable>

      <Pressable onPress={handleEnablePush} style={[styles.secondaryAction, { borderColor: theme.colors.border }]}>
        <Text style={[styles.secondaryActionText, { color: theme.colors.text }]}>
          Activar notificaciones push
        </Text>
      </Pressable>

      <Pressable onPress={handleLogout} style={[styles.logout, { backgroundColor: theme.colors.danger }]}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.screenGap,
    padding: spacing.page,
  },
  profile: {
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  name: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: fontWeights.bold,
  },
  meta: {
    color: colors.muted,
  },
  role: {
    color: colors.primaryDark,
    fontWeight: fontWeights.bold,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle,
    fontWeight: fontWeights.bold,
    marginBottom: 8,
  },
  detail: {
    color: colors.muted,
    lineHeight: 20,
  },
  logout: {
    alignItems: "center",
    backgroundColor: colors.danger,
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    marginTop: "auto",
  },
  logoutText: {
    color: "#fff",
    fontSize: typography.body,
    fontWeight: fontWeights.bold,
  },
  secondaryAction: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
  },
  secondaryActionText: {
    fontSize: typography.body,
    fontWeight: fontWeights.bold,
  },
});
