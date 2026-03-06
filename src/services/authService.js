import api from "./api";

// Login
export const login = async (username, password) => {
  console.log("🔐 Tentativo login:", username);

  try {
    console.log("📤 Invio richiesta POST /auth/login");
    const response = await api.post("/auth/login", { username, password });

    console.log("✅ Risposta ricevuta:", response.data);

    // Normalizza response (backend ritorna "refreshToken" invece di "token")
    const normalizedData = {
      user: response.data.user,
      token: response.data.refreshToken || response.data.token, // ← FIX!
      tokenType: response.data.type || "Bearer",
    };

    console.log("📦 Data normalizzata:", normalizedData);

    return {
      success: true,
      data: normalizedData,
    };
  } catch (error) {
    console.error("❌ Errore login:", error);
    console.error("📦 Error response:", error.response);

    return {
      success: false,
      error: error.response?.data?.message || "Credenziali non valide",
    };
  }
};

// Register
export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);

    // Dopo la registrazione, fai login automatico
    const { token, user } = response.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Errore durante la registrazione",
    };
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

// Controlla se l'utente è loggato
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Ottieni utente corrente
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};
