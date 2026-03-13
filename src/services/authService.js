import api from "./api";

// ============================================
// POST - Login
// ============================================
export const login = async (credentials) => {
  try {
    console.log("🔐 Tentativo di login per:", credentials.username);

    const response = await api.post("/auth/login", credentials);

    console.log(" Login riuscito:", response.data);

    const { token, user } = response.data;

    //  Carica profilo completo per avere avatar
    try {
      const profileResponse = await api.get(`/users/${user.username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Usa i dati completi del profilo (include avatarUrl!)
      const fullUser = profileResponse.data;

      console.log(" Profilo completo caricato:", fullUser);

      return {
        success: true,
        token,
        user: fullUser, //  Include avatarUrl!
      };
    } catch (error) {
      console.warn("⚠️ Impossibile caricare profilo completo, uso dati base");
      return {
        success: true,
        token,
        user, // Fallback ai dati base
      };
    }
  } catch (error) {
    console.error("❌ Errore login:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || "Errore durante il login",
    };
  }
};

// ============================================
// POST - Register
// ============================================
export const register = async (username, email, password) => {
  console.log("📝 Tentativo registrazione:", { username, email });

  try {
    console.log("📤 Invio richiesta POST /auth/register");

    const payload = {
      username: String(username),
      email: String(email),
      password: String(password),
    };

    console.log("📦 Payload:", payload);

    const response = await api.post("/auth/register", payload);

    console.log(" Risposta register completa:", response.data);

    // Estrai TUTTI i token dalla response
    const accessToken = response.data.accessToken;
    const token = response.data.token;
    const refreshToken = response.data.refreshToken;

    console.log("🔑 accessToken:", accessToken?.substring(0, 30) + "...");
    console.log("🔑 token:", token?.substring(0, 30) + "...");
    console.log("🔑 refreshToken:", refreshToken?.substring(0, 30) + "...");

    // Priorità: accessToken > token > refreshToken
    const finalToken = accessToken || token || refreshToken;

    if (!finalToken) {
      console.error("❌ NESSUN TOKEN TROVATO NELLA RESPONSE!");
      return {
        success: false,
        error: "Nessun token ricevuto dal server",
      };
    }

    console.log(" Token selezionato:", finalToken.substring(0, 30) + "...");

    const user = response.data.user;

    //  AGGIUNGI QUESTO: Carica profilo completo per avere avatar
    try {
      const profileResponse = await api.get(`/users/${user.username}`, {
        headers: { Authorization: `Bearer ${finalToken}` },
      });

      // Usa i dati completi del profilo (include avatarUrl!)
      const fullUser = profileResponse.data;

      console.log(" Profilo completo caricato dopo register:", fullUser);

      return {
        success: true,
        token: finalToken,
        user: fullUser, //  Include avatarUrl!
      };
    } catch (error) {
      console.warn(
        "⚠️ Impossibile caricare profilo completo dopo register, uso dati base",
      );
      return {
        success: true,
        token: finalToken,
        user, // Fallback ai dati base
      };
    }
  } catch (error) {
    console.error("❌ Errore registrazione:", error);
    console.error("📦 Error response:", error.response?.data);

    return {
      success: false,
      error: error.response?.data?.message || "Errore nella registrazione",
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
  } catch (error) {
    console.error("Errore logout:", error);
    return { success: false };
  }
};
