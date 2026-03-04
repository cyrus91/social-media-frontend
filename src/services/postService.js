import api from './api'

// ============================================
// GET - Fetch tutti i post (con paginazione)
// ============================================
export const fetchPosts = async (page = 0, size = 10) => {
  try {
    // Chiama GET /api/posts?page=0&size=10
    const response = await api.get('/posts', {
      params: { page, size }
    })
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error('Errore nel fetch dei post:', error)
    return {
      success: false,
      error: error.response?.data?.message || 'Errore nel caricamento dei post',
    }
  }
}

// ============================================
// GET - Fetch post di un utente specifico
// ============================================
export const fetchUserPosts = async (userId) => {
  try {
    const response = await api.get(`/posts/user/${userId}`)
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Errore nel caricamento dei post',
    }
  }
}

// ============================================
// GET - Feed "Esplora" (utenti non seguiti)
// ============================================
export const fetchExplorePosts = async (page = 0, size = 10) => {
  try {
    const response = await api.get('/posts/explore', {
      params: { page, size }
    })
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error('Errore nel fetch dei post esplora:', error)
    return {
      success: false,
      error: error.response?.data?.message || 'Errore nel caricamento dei post',
    }
  }
}

// ============================================
// POST - Crea un nuovo post
// ============================================
export const createPost = async (postData) => {
  try {
    const response = await api.post('/posts', postData)
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Errore nella creazione del post',
    }
  }
}

// ============================================
// PUT - Modifica un post esistente
// ============================================
export const updatePost = async (postId, postData) => {
  try {
    const response = await api.put(`/posts/${postId}`, postData)
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Errore nella modifica del post',
    }
  }
}

// ============================================
// DELETE - Elimina un post
// ============================================
export const deletePost = async (postId) => {
  try {
    await api.delete(`/posts/${postId}`)
    
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Errore nella eliminazione del post',
    }
  }
}

// ============================================
// POST - Like/Unlike un post
// ============================================
export const toggleLike = async (postId) => {
  try {
    const response = await api.post(`/posts/${postId}/like`)
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Errore nel like',
    }
  }
}