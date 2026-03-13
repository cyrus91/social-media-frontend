import api from "./api";

// ============================================
// POST - Follow utente
// ============================================
export const followUser = async (followedId) => {
  try {
    console.log(`👥 Follow user ${followedId}`);

    const response = await api.post("/follows", {
      followedId: followedId,
    });

    console.log(" Follow riuscito:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore follow:", error);
    console.error("Response data:", error.response?.data);
    console.error("Status:", error.response?.status);

    return {
      success: false,
      error: error.response?.data?.message || "Errore nel follow",
    };
  }
};

// ============================================
// DELETE - Unfollow utente
// ============================================
export const unfollowUser = async (followedId) => {
  try {
    console.log(`👋 Unfollow user ${followedId}`);

    const response = await api.delete(`/follows/user/${followedId}`);

    console.log(" Unfollow riuscito");

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore unfollow:", error);
    console.error("Response data:", error.response?.data);
    console.error("Status:", error.response?.status);

    return {
      success: false,
      error: error.response?.data?.message || "Errore nell'unfollow",
    };
  }
};

// ============================================
// GET - Check se seguo un utente
// ============================================
export const checkIfFollowing = async (followedId) => {
  try {
    console.log(`🔍 Check if following user ${followedId}`);

    const response = await api.get(`/follows/is-following/${followedId}`);

    console.log(" Following status:", response.data);

    return {
      success: true,
      isFollowing: response.data.isFollowing,
    };
  } catch (error) {
    console.error("❌ Errore check following:", error);

    return {
      success: false,
      isFollowing: false,
    };
  }
};

// ============================================
// GET - Lista followers di un utente
// ============================================
export const getFollowers = async (userId) => {
  try {
    const response = await api.get(`/follows/user/${userId}/followers`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore fetch followers:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore caricamento followers",
      data: [],
    };
  }
};

// ============================================
// GET - Lista following di un utente
// ============================================
export const getFollowing = async (userId) => {
  try {
    const response = await api.get(`/follows/user/${userId}/following`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore fetch following:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore caricamento following",
      data: [],
    };
  }
};

// ============================================
// GET - Conta followers
// ============================================
export const getFollowersCount = async (userId) => {
  try {
    const response = await api.get(`/follows/user/${userId}/followers/count`);
    return {
      success: true,
      count: response.data.count,
    };
  } catch (error) {
    console.error("❌ Errore count followers:", error);
    return {
      success: false,
      count: 0,
    };
  }
};

// ============================================
// GET - Conta following
// ============================================
export const getFollowingCount = async (userId) => {
  try {
    const response = await api.get(`/follows/user/${userId}/following/count`);
    return {
      success: true,
      count: response.data.count,
    };
  } catch (error) {
    console.error("❌ Errore count following:", error);
    return {
      success: false,
      count: 0,
    };
  }
};
