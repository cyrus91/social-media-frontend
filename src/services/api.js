import axios from 'axios'
import useAuthStore from "../store/authStore";

// Base URL del backend
const API_BASE_URL = 'https://social-media-backend-1hw4.onrender.com/api'

// Crea istanza axios con configurazione base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor: aggiunge automaticamente il JWT token a ogni richiesta
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor: gestisce errori di autenticazione
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      
      // NON fare logout se l'errore è su endpoint pubblici
      const publicEndpoints = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/posts',
        '/api/users',
        '/api/comments'
      ]
      
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        error.config.url.includes(endpoint)
      )
      
      // Fai logout SOLO se:
      // 1. NON è un endpoint pubblico
      // 2. NON sei già nella pagina di login
      if (!isPublicEndpoint && currentPath !== '/login' && currentPath !== '/register') {
        console.warn('401 Unauthorized - Logout forzato')
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default api