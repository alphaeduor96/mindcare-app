import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Card } from "../components/Card";
import { ScreenHeader } from "../components/ScreenHeader";
import { savePushToken } from "../api/supabase";
import { registerForPushNotifications } from "../notifications";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";
import { colors, fontWeights, spacing, typography } from "../theme";

type MoreItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  action: () => void;
};

function MenuRow({ item }: { item: MoreItem }) {
  const theme = useTheme();

  return (
    <Pressable style={styles.row} onPress={item.action}>
      <View style={[styles.iconBox, { backgroundColor: `${theme.colors.primary}20` }]}>
        <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.rowDetail, { color: theme.colors.muted }]}>{item.detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
    </Pressable>
  );
}

export function MoreScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const theme = useTheme();

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

  function handleLogout() {
    Alert.alert("Cerrar sesión", "¿Quieres salir de MindCare?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: logout },
    ]);
  }

  const operationItems: MoreItem[] = [
    {
      icon: "wallet-outline",
      title: "Pagos",
      detail: "Registra y consulta pagos de citas",
      action: () => navigation.navigate("Pagos"),
    },
    {
      icon: "document-text-outline",
      title: "Expedientes",
      detail: "Notas clínicas y seguimiento",
      action: () => navigation.navigate("Expedientes"),
    },
    {
      icon: "today-outline",
      title: "Calendario completo",
      detail: "Vista mensual de agenda",
      action: () => navigation.navigate("Calendario"),
    },
  ];

  const accountItems: MoreItem[] = [
    {
      icon: theme.mode === "dark" ? "sunny-outline" : "moon-outline",
      title: `Modo ${theme.mode === "dark" ? "claro" : "oscuro"}`,
      detail: "Cambia la apariencia de la app",
      action: theme.toggleTheme,
    },
    {
      icon: "notifications-outline",
      title: "Notificaciones",
      detail: "Activa recordatorios push",
      action: handleEnablePush,
    },
    {
      icon: "person-circle-outline",
      title: "Perfil",
      detail: `${user?.nombre || ""} ${user?.apellido || ""}`.trim() || "Mi cuenta",
      action: () => navigation.navigate("Perfil"),
    },
  ];

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Más" />
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="person-outline" size={30} color="#fff" />
        </View>
        <View style={styles.heroText}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {user?.nombre} {user?.apellido}
          </Text>
          <Text style={[styles.email, { color: theme.colors.muted }]}>{user?.email}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Operación</Text>
      <Card style={styles.menuCard}>
        {operationItems.map((item) => <MenuRow key={item.title} item={item} />)}
      </Card>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cuenta</Text>
      <Card style={styles.menuCard}>
        {accountItems.map((item) => <MenuRow key={item.title} item={item} />)}
      </Card>

      <Pressable style={styles.logout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.screenGap,
    padding: spacing.page,
    paddingBottom: 36,
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 4,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  heroText: {
    flex: 1,
  },
  name: {
    fontSize: typography.cardTitle,
    fontWeight: fontWeights.black,
  },
  email: {
    fontSize: typography.bodySmall,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.sectionTitle,
    fontWeight: fontWeights.bold,
    marginTop: 4,
  },
  menuCard: {
    padding: 4,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 70,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 16,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.cardTitle,
    fontWeight: fontWeights.black,
  },
  rowDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  logout: {
    alignItems: "center",
    backgroundColor: colors.danger,
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    height: 54,
    justifyContent: "center",
    marginTop: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
