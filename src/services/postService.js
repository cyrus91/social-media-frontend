import api from "./api";

// ============================================
// GET - Fetch tutti i post (con paginazione)
// ============================================
export const fetchPosts = async (page = 0, size = 10) => {
  try {
    // Chiama GET /api/posts?page=0&size=10
    const response = await api.get("/posts", {
      params: { page, size },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Errore nel fetch dei post:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore nel caricamento dei post",
    };
  }
};

// ============================================
// GET - Feed personalizzato
// ============================================
export const fetchFeed = async (page = 0, size = 10) => {
  try {
    console.log(`📥 Fetching feed - page: ${page}, size: ${size}`);

    const response = await api.get("/posts/feed", {
      params: { page, size },
    });

    console.log(" Feed ricevuto:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore fetch feed:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore caricamento feed",
      data: { content: [], last: true },
    };
  }
};

// ============================================
// GET - Fetch post di un utente specifico
// ============================================
export const fetchUserPosts = async (userId) => {
  try {
    const response = await api.get(`/posts/user/${userId}`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Errore nel caricamento dei post",
    };
  }
};

// ============================================
// GET - Feed Esplora
// ============================================
export const fetchExplorePosts = async (page = 0, size = 10) => {
  try {
    console.log(`📥 Fetching explore - page: ${page}, size: ${size}`);

    const response = await api.get("/posts/explore", {
      params: { page, size },
    });

    console.log(" Explore ricevuto:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore fetch explore:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore caricamento explore",
      data: { content: [], last: true },
    };
  }
};

// ============================================
// POST - Crea un nuovo post
// ============================================
export const createPost = async (content, image) => {
  try {
    console.log("📝 postService.createPost called");
    console.log("📦 Content:", content, "Type:", typeof content);
    console.log("🖼️ Image:", image);

    const formData = new FormData();

    //  ASSICURATI CHE content SIA STRINGA
    if (content) {
      if (typeof content === "object") {
        console.error("❌ Content è un oggetto! Converto in stringa...");
        formData.append("content", JSON.stringify(content)); // Fallback
      } else {
        formData.append("content", String(content)); //  Converti in stringa
      }
    }

    if (image) {
      formData.append("image", image);
    }

    // Debug FormData
    for (let pair of formData.entries()) {
      console.log(
        "📋 FormData:",
        pair[0],
        "=",
        pair[1],
        "Type:",
        typeof pair[1],
      );
    }

    const response = await api.post("/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(" Post creato:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore nella creazione del post:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore nella creazione del post",
    };
  }
};

// ============================================
// PUT - Modifica un post esistente
// ============================================
export const updatePost = async (postId, postData) => {
  try {
    const response = await api.put(`/posts/${postId}`, postData);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Errore nella modifica del post",
    };
  }
};

// ============================================
// DELETE - Elimina un post
// ============================================
export const deletePost = async (postId) => {
  try {
    await api.delete(`/posts/${postId}`);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message || "Errore nella eliminazione del post",
    };
  }
};

// ============================================
// POST - Like/Unlike un post
// ============================================
export const toggleLike = async (postId) => {
  try {
    const response = await api.post(`/posts/${postId}/like`);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || "Errore nel like",
    };
  }
};

// ============================================
// POST - Crea post con immagini multiple
// ============================================
export const createPostWithImages = async (content, images) => {
  try {
    const formData = new FormData();

    if (content) {
      formData.append("content", content);
    }

    // Aggiungi tutte le immagini con la stessa chiave "images"
    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await api.post("/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Errore creazione post:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Errore nella creazione del post",
    };
  }
};
