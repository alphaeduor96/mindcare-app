import { useState, useEffect } from "react";
import * as api from "../services/api";

interface AuthUser extends api.User {
  access_token?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem("mindcare_user");
    const storedToken = localStorage.getItem("mindcare_token");

    if (storedUser && storedToken) {
      setUser({ ...JSON.parse(storedUser), access_token: storedToken });
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);

      setUser({ ...response.user, access_token: response.access_token });
      localStorage.setItem("mindcare_user", JSON.stringify(response.user));
      localStorage.setItem("mindcare_token", response.access_token);
      if (response.refresh_token) {
        localStorage.setItem("mindcare_refresh_token", response.refresh_token);
      }

      return response.user;
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    rol: api.User["rol"];
    telefono?: string;
  }) => {
    try {
      const response = await api.auth.signup(data);

      setUser({ ...response.user, access_token: response.access_token });
      localStorage.setItem("mindcare_user", JSON.stringify(response.user));
      localStorage.setItem("mindcare_token", response.access_token);
      if (response.refresh_token) {
        localStorage.setItem("mindcare_refresh_token", response.refresh_token);
      }

      return response.user;
    } catch (error: any) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mindcare_user");
    localStorage.removeItem("mindcare_token");
    localStorage.removeItem("mindcare_refresh_token");
  };

  const updateUser = async (updates: Partial<api.User>) => {
    if (!user) return;

    try {
      const updatedUser = await api.usuarios.update(user.id, updates);
      setUser({ ...updatedUser, access_token: user.access_token });
      localStorage.setItem("mindcare_user", JSON.stringify(updatedUser));
    } catch (error: any) {
      console.error("Update user failed:", error);
      throw error;
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateUser,
  };
}
