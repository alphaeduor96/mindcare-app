import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fontWeights, radii, spacing, typography } from "../theme";
import { useTheme } from "../state/ThemeContext";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
};

export function ScreenHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon = "add",
  onAction,
}: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.muted }]}>{subtitle}</Text> : null}
      </View>
      {onAction ? (
        <Pressable style={[styles.action, { backgroundColor: theme.colors.primary }]} onPress={onAction}>
          <Ionicons name={actionIcon} size={17} color="#fff" />
          {actionLabel ? <Text style={styles.actionText}>{actionLabel}</Text> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: spacing.controlHeight,
    paddingTop: 35,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: typography.screenTitle,
    fontWeight: fontWeights.black,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.medium,
    marginTop: 2,
  },
  action: {
    alignItems: "center",
    borderRadius: radii.medium,
    flexDirection: "row",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  actionText: {
    color: "#fff",
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.bold,
  },
});
