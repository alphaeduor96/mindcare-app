import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../theme";
import { useTheme } from "../state/ThemeContext";

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.radius,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
});
