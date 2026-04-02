import { create } from "zustand";
import api from "../services/api";

const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try { return JSON.parse(userStr); } catch { return null; }
  }
  return null;
};

const useAuthStore = create((set) => ({
  user: getCurrentUser(),
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),

  login: (user, token) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    set({ user, token, isAuthenticated: true });
  },

  // Usato dopo OAuth2 callback — salva token e carica profilo dal server
  loginWithTokens: async (token, refreshToken) => {
    localStorage.setItem("token", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    const profileRes = await api.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = profileRes.data;
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    const currentUser = getCurrentUser();
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));

export default useAuthStore;