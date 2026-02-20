import { create } from 'zustand'
import { getCurrentUser, isAuthenticated } from '../services/authService'

const useAuthStore = create((set) => ({
  // State
  user: getCurrentUser(),
  isAuthenticated: isAuthenticated(),
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: true }),
  
  clearUser: () => set({ user: null, isAuthenticated: false }),
  
  updateUser: (userData) => set((state) => ({
    user: { ...state.user, ...userData }
  })),
}))

export default useAuthStore