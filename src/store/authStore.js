import { create } from 'zustand'

// ============================================
// HELPER FUNCTION (DEVE ESSERE PRIMA!)
// ============================================
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch (e) {
      console.error('Errore nel parsing user:', e)
      return null
    }
  }
  return null
}

// ============================================
// ZUSTAND STORE
// ============================================
const useAuthStore = create((set) => ({
  // State
  user: getCurrentUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  // Actions
  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    
    set({
      user,
      token,
      isAuthenticated: true,
    })
  },
  
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  },
  
  updateUser: (userData) => {
    const currentUser = getCurrentUser()
    const updatedUser = { ...currentUser, ...userData }
    
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    set({
      user: updatedUser,
    })
  },
}))

export default useAuthStore