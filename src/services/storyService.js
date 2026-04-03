import api from "./api";

const BASE = "/stories";

// ============================================
// GET - Feed storie (seguiti + proprie)
// ============================================
export const fetchFeedStories = async () => {
  try {
    const res = await api.get(`${BASE}/feed`);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Error fetching feed stories:", error);
    return { success: false, data: [] };
  }
};

// ============================================
// GET - Storie di un utente specifico
// ============================================
export const fetchUserStories = async (userId) => {
  try {
    const res = await api.get(`${BASE}/user/${userId}`);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Error fetching user stories:", error);
    return { success: false, data: [] };
  }
};

// ============================================
// POST - Crea storia (multipart)
// ============================================
export const createStory = async (mediaFile, caption = "") => {
  try {
    const formData = new FormData();
    formData.append("media", mediaFile);
    if (caption?.trim()) formData.append("caption", caption.trim());
    const res = await api.post(BASE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, data: res.data };
  } catch (e) {
    return {
      success: false,
      error: e.response?.data?.message || "Errore nel caricamento",
    };
  }
};

// ============================================
// POST - Segna storia come vista
// ============================================
export const markStoryViewed = async (storyId) => {
  try {
    await api.post(`${BASE}/${storyId}/view`);
  } catch { /* silenzioso */ }
};

// ============================================
// GET - Chi ha visto la storia
// ============================================
export const fetchStoryViewers = async (storyId) => {
  try {
    const res = await api.get(`${BASE}/${storyId}/viewers`);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Error fetching story viewers:", error);
    return { success: false, data: [] };
  }
};

// ============================================
// DELETE - Elimina storia
// ============================================
export const deleteStory = async (storyId) => {
  try {
    await api.delete(`${BASE}/${storyId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting story:", error);
    return { success: false };
  }
};