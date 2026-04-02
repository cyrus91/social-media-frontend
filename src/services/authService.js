import api from "./api";

// ============================================
// POST - Login
// ============================================
export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    const { token, user } = response.data;

    // Carica profilo completo per avere avatar
    try {
      const profileResponse = await api.get(`/users/${user.username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, token, user: profileResponse.data };
    } catch {
      return { success: true, token, user };
    }
  } catch (error) {
    const errorData = error.response?.data;

    // Email non verificata
    if (error.response?.status === 403 && errorData?.error === "EMAIL_NOT_VERIFIED") {
      return {
        success: false,
        emailNotVerified: true,
        error: "Devi verificare la tua email prima di accedere",
      };
    }

    return {
      success: false,
      error: errorData?.message || "Username o password errati",
    };
  }
};

// ============================================
// POST - Register
// ============================================
export const register = async (username, email, password) => {
  try {
    const response = await api.post("/auth/register", {
      username: String(username),
      email: String(email),
      password: String(password),
    });

    // type === "pending_verification" = registrazione ok, email da verificare
    if (response.data.type === "pending_verification") {
      return {
        success: true,
        pendingVerification: true,
        user: response.data.user,
      };
    }

    return { success: true, user: response.data.user };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Errore nella registrazione",
    };
  }
};

// ============================================
// GET - Verifica Email
// ============================================
export const verifyEmail = async (token) => {
  try {
    await api.get(`/auth/verify-email?token=${token}`);
    return { success: true };
  } catch (error) {
    const errorData = error.response?.data;
    return {
      success: false,
      expired: errorData?.error === "TOKEN_EXPIRED",
      error: errorData?.message || "Token non valido",
    };
  }
};

// ============================================
// POST - Reinvia Email Verifica
// ============================================
export const resendVerification = async (email) => {
  try {
    await api.post("/auth/resend-verification", { email });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Errore nell'invio dell'email",
    };
  }
};

// ============================================
// POST - Logout
// ============================================
export const logout = async () => {
  try {
    await api.post("/auth/logout");
    return { success: true };
  } catch {
    return { success: false };
  }
};
// ============================================
// POST - Richiedi reset password
// ============================================
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return { success: true, message: response.data.message };
  } catch (error) {
    const errorData = error.response?.data;
    return {
      success: false,
      oauthAccount: errorData?.error === "OAUTH2_ACCOUNT",
      error: errorData?.message || "Errore nella richiesta di reset",
    };
  }
};

// ============================================
// POST - Reimposta password con token
// ============================================
export const resetPassword = async (token, newPassword) => {
  try {
    await api.post("/auth/reset-password", { token, newPassword });
    return { success: true };
  } catch (error) {
    const errorData = error.response?.data;
    return {
      success: false,
      expired: error.response?.status === 410,
      error: errorData?.error || "Token non valido o scaduto",
    };
  }
};

// ============================================
// POST - Cambia password (autenticato)
// ============================================
export const changePassword = async (currentPassword, newPassword) => {
  try {
    await api.post("/auth/change-password", { currentPassword, newPassword });
    return { success: true };
  } catch (error) {
    const errorData = error.response?.data;
    return {
      success: false,
      wrongPassword: errorData?.error === "WRONG_PASSWORD",
      oauthAccount: errorData?.error === "OAUTH2_ACCOUNT",
      error: errorData?.message || errorData?.error || "Errore nel cambio password",
    };
  }
};