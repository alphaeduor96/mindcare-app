import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../state/AuthContext";
import { colors } from "../theme";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Faltan datos", "Ingresa email y contraseña.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert("No se pudo iniciar sesión", error?.message || "Revisa tus credenciales.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Ionicons name="calendar-outline" size={34} color="#fff" />
        </View>
        <Text style={styles.title}>MindCare</Text>
        <Text style={styles.subtitle}>App para psicólogos</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="tu@email.com"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={email}
        />

        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
            value={password}
          />
          <Pressable onPress={() => setShowPassword((visible) => !visible)} style={styles.eye}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.muted} />
          </Pressable>
        </View>

        <Pressable disabled={loading} onPress={handleLogin} style={styles.button}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  brand: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 22,
    height: 72,
    justifyContent: "center",
    marginBottom: 16,
    width: 72,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    marginTop: 6,
  },
  form: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    height: 52,
    paddingHorizontal: 14,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 52,
  },
  eye: {
    padding: 14,
    position: "absolute",
    right: 0,
    top: 0,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
    marginTop: 22,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
