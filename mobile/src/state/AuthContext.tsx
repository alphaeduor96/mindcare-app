import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { getStoredUser, loginWithSupabase, logout as logoutSession } from "../api/supabase";
import { User } from "../types";

interface AuthContextValue {
  booting: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getStoredUser()
      .then(setUser)
      .finally(() => setBooting(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      booting,
      user,
      login: async (email, password) => {
        const loggedUser = await loginWithSupabase(email, password);
        setUser(loggedUser);
      },
      logout: async () => {
        await logoutSession();
        await AsyncStorage.removeItem("mindcare_psychologist_profile_id");
        setUser(null);
      },
    }),
    [booting, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
