import api from "./api";

// ============================================
// GET - Notifiche (paginate)
// ============================================
export const fetchNotifications = async (page = 0, size = 20) => {
  try {
    const response = await api.get("/notifications", {
      params: { page, size },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore fetch notifiche:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore caricamento notifiche",
      data: { content: [], last: true },
    };
  }
};

// ============================================
// GET - Notifiche non lette
// ============================================
export const fetchUnreadNotifications = async (page = 0, size = 20) => {
  try {
    const response = await api.get("/notifications/unread", {
      params: { page, size },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore fetch notifiche non lette:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore caricamento notifiche",
      data: { content: [], last: true },
    };
  }
};

// ============================================
// GET - Conteggio notifiche non lette
// ============================================
export const fetchUnreadCount = async () => {
  try {
    const response = await api.get("/notifications/count");

    return {
      success: true,
      count: response.data.unreadCount || 0,
    };
  } catch (error) {
    console.error("❌ Errore fetch count:", error);
    return {
      success: false,
      count: 0,
    };
  }
};

// ============================================
// PUT - Marca notifica come letta
// ============================================
export const markAsRead = async (notificationId) => {
  try {
    await api.put(`/notifications/${notificationId}/read`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ Errore marca come letta:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore",
    };
  }
};

// ============================================
// PUT - Marca tutte come lette
// ============================================
export const markAllAsRead = async () => {
  try {
    await api.put("/notifications/read-all");

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ Errore marca tutte:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore",
    };
  }
};

// ============================================
// DELETE - Elimina notifica
// ============================================
export const deleteNotification = async (notificationId) => {
  try {
    await api.delete(`/notifications/${notificationId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ Errore elimina notifica:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore eliminazione",
    };
  }
};