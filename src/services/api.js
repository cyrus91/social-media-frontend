import axios from 'axios'
import useAuthStore from '../store/authStore'

const API_BASE_URL = 'https://social-media-backend-1hw4.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  // ❌ NON FORZARE Content-Type qui! Lascia che axios lo gestisca automaticamente
  // headers: {
  //   'Content-Type': 'application/json',
  // },
})

// ============================================
// REQUEST INTERCEPTOR - Aggiunge JWT token
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    
    console.log('📤 Request:', config.method?.toUpperCase(), config.url)
    console.log('🔑 Token presente:', !!token)
    console.log('📋 Content-Type:', config.headers['Content-Type'])
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ Token aggiunto:', token.substring(0, 20) + '...')
    } else {
      console.warn('⚠️ Nessun token trovato in localStorage!')
    }
    
    // ✅ Se NON è FormData, imposta Content-Type a JSON
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================
// RESPONSE INTERCEPTOR - Gestisce errori 401
// ============================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const requestMethod = error.config?.method?.toUpperCase() || 'GET'
      const currentPath = window.location.pathname
      
      console.log('🔒 401 Unauthorized ricevuto')
      console.log('📍 Request:', requestMethod, requestUrl)
      console.log('🌐 Current path:', currentPath)
      console.log('📦 Error response:', error.response?.data)
      
      // ============================================
      // ENDPOINT PUBBLICI GET (NON FARE LOGOUT!)
      // ============================================
      const publicGetEndpoints = [
        '/users/',
        '/users/id/',
        '/posts/',
        '/posts',
        '/comments/',
      ]
      
      // Check se è un endpoint pubblico GET
      const isPublicGetEndpoint = requestMethod === 'GET' && 
        publicGetEndpoints.some(endpoint => requestUrl.includes(endpoint))
      
      // Check se siamo già nella pagina di login/register
      const isAuthPage = currentPath === '/login' || currentPath === '/register'
      
      // ============================================
      // DECISIONE: FARE LOGOUT O NO?
      // ============================================
      
      // NON fare logout se:
      // 1. È una GET request su endpoint pubblico
      // 2. Siamo già nella pagina di auth
      const shouldLogout = !isPublicGetEndpoint && !isAuthPage
      
      if (shouldLogout) {
        console.warn('🚪 Logout forzato - Token invalido o mancante')
        console.warn('📋 Motivo 401:', error.response?.data?.message || 'Unknown')
        
        useAuthStore.getState().logout()
        
        // Redirect solo se non siamo già in login
        if (!isAuthPage) {
          setTimeout(() => {
            window.location.href = '/login'
          }, 100)
        }
      } else {
        console.log('ℹ️ 401 ignorato - GET request su endpoint pubblico')
      }
    }
    
    return Promise.reject(error)
  }
)

export default api