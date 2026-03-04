import api from "./api";

// ============================================
// GET - Fetch commenti di un post
// ============================================
export const fetchCommentsByPost = async (postId) => {
  try {
    const response = await api.get(`/comments/post/${postId}`);

    // Il backend ritorna Page object, estraiamo l'array "content"
    const data = response.data.content || response.data || [];

    return {
      success: true,
      data: data, // Ora è un array!
    };
  } catch (error) {
    console.error("Errore nel fetch dei commenti:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Errore nel caricamento dei commenti",
    };
  }
};

// ============================================
// POST - Crea nuovo commento
// ============================================
export const createComment = async (postId, content) => {
  try {
    const response = await api.post("/comments", {
      postId,
      content,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Errore nella creazione del commento:", error);
    return {
      success: false,
      error:
        error.response?.data?.message || "Errore nella creazione del commento",
    };
  }
};

// ============================================
// DELETE - Elimina commento
// ============================================
export const deleteComment = async (commentId) => {
  try {
    await api.delete(`/comments/${commentId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Errore nella eliminazione del commento:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        "Errore nella eliminazione del commento",
    };
  }
};
