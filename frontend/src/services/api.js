// =============================================================
// src/services/api.js — Centralized Axios API Client
// =============================================================
// Uses sessionStorage (per-tab) so multiple roles can be tested
// simultaneously in different browser tabs.
// =============================================================

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach JWT from sessionStorage (tab-isolated)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("ppst_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout only THIS tab on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("ppst_token");
      sessionStorage.removeItem("ppst_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login:  (matric_staff_id, password) =>
    api.post("/auth/login", { matric_staff_id, password }),
  getMe: () => api.get("/auth/me"),
};

export default api;
