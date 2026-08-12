import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../state/ThemeContext";

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {detail ? <Text style={[styles.detail, { color: theme.colors.muted }]}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 28,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  detail: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
