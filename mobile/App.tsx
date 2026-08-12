import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./src/state/AuthContext";
import { ThemeProvider, useTheme } from "./src/state/ThemeContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { AppointmentsScreen } from "./src/screens/AppointmentsScreen";
import { PatientsScreen } from "./src/screens/PatientsScreen";
import { CalendarScreen } from "./src/screens/CalendarScreen";
import { RecordsScreen } from "./src/screens/RecordsScreen";
import { PaymentsScreen } from "./src/screens/PaymentsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { MoreScreen } from "./src/screens/MoreScreen";
import { LoadingScreen } from "./src/screens/LoadingScreen";

export type PsychologistTabsParamList = {
  Inicio: undefined;
  Agenda: undefined;
  Pacientes: undefined;
  Mas: undefined;
  Calendario: undefined;
  Expedientes: undefined;
  Pagos: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<PsychologistTabsParamList>();

function PsychologistTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof PsychologistTabsParamList, keyof typeof Ionicons.glyphMap> = {
            Inicio: "home-outline",
            Agenda: "calendar-outline",
            Pacientes: "people-outline",
            Mas: "apps-outline",
            Calendario: "today-outline",
            Expedientes: "document-text-outline",
            Pagos: "wallet-outline",
            Perfil: "person-circle-outline",
          };
          return <Ionicons name={icons[route.name]} color={color} size={size} />;
        },
        tabBarLabel: route.name === "Mas" ? "Más" : route.name,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardScreen} />
      <Tab.Screen name="Agenda" component={AppointmentsScreen} />
      <Tab.Screen name="Pacientes" component={PatientsScreen} />
      <Tab.Screen name="Mas" component={MoreScreen} />
      <Tab.Screen
        name="Calendario"
        component={CalendarScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Expedientes"
        component={RecordsScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Pagos"
        component={PaymentsScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { booting, user } = useAuth();
  const theme = useTheme();

  if (booting) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      {user?.rol === "psicologo" ? <PsychologistTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
