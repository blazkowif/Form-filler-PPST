// =============================================================
// src/context/AuthContext.jsx — Global Authentication State
// =============================================================
// Uses sessionStorage (NOT localStorage) so each browser tab
// maintains its own independent login session. This allows
// testing multiple roles simultaneously in different tabs.
// =============================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

// Keys used in sessionStorage
const TOKEN_KEY = "ppst_token";
const USER_KEY  = "ppst_user";

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // Restore Session on Page Refresh (from sessionStorage)
  // sessionStorage persists across F5 refreshes but NOT across
  // new tabs — each tab starts fresh, enabling multi-role testing
  // ==========================================================
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = sessionStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
        setToken(storedToken);
      } catch (error) {
        console.warn("Session restoration failed:", error.message);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ==========================================================
  // login()
  // ==========================================================
  const login = useCallback(async (matric_staff_id, password) => {
    try {
      const response = await authAPI.login(matric_staff_id, password);
      const { token: newToken, user: newUser } = response.data;

      // Store in sessionStorage — tab-isolated
      sessionStorage.setItem(TOKEN_KEY, newToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, message };
    }
  }, []);

  // ==========================================================
  // logout()
  // ==========================================================
  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth() must be used within an <AuthProvider>");
  }
  return context;
};

export default AuthContext;
