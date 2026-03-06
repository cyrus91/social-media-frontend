import { create } from 'zustand'

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

const useAuthStore = create((set) => ({
  user: getCurrentUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (user, token) => {
    console.log('💾 Salvataggio user e token in localStorage')
    console.log('👤 User:', user)
    console.log('🔑 Token:', token)
    
    // Salva in localStorage
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    
    console.log('✅ User salvato:', localStorage.getItem('user'))
    console.log('✅ Token salvato:', localStorage.getItem('token'))
    
    // Aggiorna state
    set({
      user,
      token,
      isAuthenticated: true,
    })
  },
  
  logout: () => {
    console.log('🚪 Logout - Rimozione dati da localStorage')
    
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