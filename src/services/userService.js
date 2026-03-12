import api from "./api";

// ============================================
// GET - Profilo utente per username
// ============================================
export const fetchUserProfile = async (username) => {
  try {
    console.log("🔍 Fetch profilo:", username);

    const response = await api.get(`/users/${username}`);

    console.log("✅ Profilo ricevuto:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore nel fetch del profilo:", error);
    console.error("📦 Error response:", error.response);

    // NON propagare errori 401 (potrebbe essere endpoint pubblico senza token)
    if (error.response?.status === 401) {
      console.warn("⚠️ 401 Unauthorized - Profilo pubblico non accessibile");
    }

    return {
      success: false,
      error:
        error.response?.data?.message || "Errore nel caricamento del profilo",
    };
  }
};

// ============================================
// GET - Profilo utente per ID
// ============================================
export const fetchUserById = async (userId) => {
  try {
    const response = await api.get(`/users/id/${userId}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Errore nel fetch del profilo:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Errore nel caricamento del profilo",
    };
  }
};

// ============================================
// PUT - Aggiorna profilo
// ============================================
export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put("/users/profile", profileData);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        "Errore nell'aggiornamento del profilo",
    };
  }
};

// ============================================
// POST - Follow utente
// ============================================
export const followUser = async (userId) => {
  try {
    const response = await api.post(`/follows/${userId}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Errore nel follow:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore nel follow",
    };
  }
};

// ============================================
// DELETE - Unfollow utente
// ============================================
export const unfollowUser = async (userId) => {
  try {
    await api.delete(`/follows/${userId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Errore nell'unfollow:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore nell'unfollow",
    };
  }
};

// ============================================
// GET - Check se segui un utente
// ============================================
export const checkIsFollowing = async (userId) => {
  try {
    const response = await api.get(`/follows/is-following/${userId}`);

    return {
      success: true,
      data: response.data, // Probabilmente { isFollowing: true/false }
    };
  } catch (error) {
    console.error("Errore nel check following:", error);
    return {
      success: false,
      data: { isFollowing: false },
    };
  }
};

// ============================================
// GET - Lista followers
// ============================================
export const fetchFollowers = async (userId, page = 0, size = 20) => {
  try {
    const response = await api.get(`/follows/followers/${userId}`, {
      params: { page, size },
    });

    // Gestisci Page object
    const data = response.data.content || response.data || [];

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Errore nel fetch followers:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Errore nel caricamento followers",
    };
  }
};

// ============================================
// GET - Lista following
// ============================================
export const fetchFollowing = async (userId, page = 0, size = 20) => {
  try {
    const response = await api.get(`/follows/following/${userId}`, {
      params: { page, size },
    });

    // Gestisci Page object
    const data = response.data.content || response.data || [];

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Errore nel fetch following:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Errore nel caricamento following",
    };
  }
};

// ============================================
// GET - Ricerca utenti
// ============================================
export const searchUsers = async (query) => {
  try {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    console.log("🔍 Ricerca utenti:", query);

    const response = await api.get(`/users/search`, {
      params: { q: query.trim() },
    });

    console.log("✅ Risultati ricerca:", response.data.length);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore nella ricerca utenti:", error);
    return {
      success: false,
      data: [],
      error: error.response?.data?.message || "Errore nella ricerca",
    };
  }
};

// ============================================
// PUT - Aggiorna Bio
// ============================================
export const updateBio = async (bio) => {
  try {
    console.log("📝 Aggiornamento bio:", bio);

    const response = await api.put(`/users/me/bio`, { bio });

    console.log("✅ Bio aggiornata:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore aggiornamento bio:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore aggiornamento bio",
    };
  }
};

// ============================================
// POST - Upload Avatar
// ============================================
export const uploadAvatar = async (file) => {
  try {
    console.log("📸 Upload avatar:", file.name);

    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/users/me/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Avatar caricato:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore upload avatar:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore upload avatar",
    };
  }
};

// ============================================
// DELETE - Rimuovi Avatar
// ============================================
export const deleteAvatar = async () => {
  try {
    console.log("🗑️ Rimozione avatar");

    const response = await api.delete(`/users/me/avatar`);

    console.log("✅ Avatar rimosso:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore rimozione avatar:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore rimozione avatar",
    };
  }
};

// ============================================
// PUT - Aggiorna Profilo Completo
// ============================================
export const updateProfile = async (profileData) => {
  try {
    console.log("🔧 Aggiornamento profilo:", profileData);

    const response = await api.put(`/users/me`, profileData);

    console.log("✅ Profilo aggiornato:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore aggiornamento profilo:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore aggiornamento profilo",
    };
  }
};

// ============================================
// DELETE - Elimina account
// ============================================
export const deleteAccount = async () => {
  try {
    console.log("🗑️ Richiesta eliminazione account");

    await api.delete("/users/me");

    console.log("✅ Account eliminato");

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ Errore eliminazione account:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore eliminazione account",
    };
  }
};
