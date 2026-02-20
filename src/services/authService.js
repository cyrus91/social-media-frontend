import api from './api'

// Login
export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', {
      username,
      password,
    })
    
    // Salva token e user nel localStorage
    const { token, user } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Errore durante il login',
    }
  }
}

// Register
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData)
    
    // Dopo la registrazione, fai login automatico
    const { token, user } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    
    return { success: true, data: response.data }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Errore durante la registrazione',
    }
  }
}

// Logout
export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

// Controlla se l'utente è loggato
export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

// Ottieni utente corrente
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}