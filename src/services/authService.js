import api from './api'

// ============================================
// POST - Login
// ============================================
export const login = async (username, password) => {
  console.log('🔐 Tentativo login:', username)
  
  try {
    console.log('📤 Invio richiesta POST /auth/login')
    const response = await api.post('/auth/login', { 
      username, 
      password 
    })
    
    console.log('✅ Risposta login completa:', response.data)
    
    // Estrai TUTTI i token dalla response
    const accessToken = response.data.accessToken
    const token = response.data.token
    const refreshToken = response.data.refreshToken
    
    console.log('🔑 accessToken:', accessToken?.substring(0, 30) + '...')
    console.log('🔑 token:', token?.substring(0, 30) + '...')
    console.log('🔑 refreshToken:', refreshToken?.substring(0, 30) + '...')
    
    // Priorità: accessToken > token > refreshToken
    const finalToken = accessToken || token || refreshToken
    
    if (!finalToken) {
      console.error('❌ NESSUN TOKEN TROVATO NELLA RESPONSE!')
      return {
        success: false,
        error: 'Nessun token ricevuto dal server',
      }
    }
    
    console.log('✅ Token selezionato:', finalToken.substring(0, 30) + '...')
    console.log('📏 Lunghezza token:', finalToken.length)
    console.log('🏷️ Tipo token:', finalToken.startsWith('eyJ') ? 'JWT' : 'UUID')
    
    // Normalizza response
    const normalizedData = {
      user: response.data.user,
      token: finalToken,
      tokenType: response.data.type || 'Bearer',
    }
    
    console.log('📦 Data normalizzata:', normalizedData)
    
    return {
      success: true,
      data: normalizedData,
    }
  } catch (error) {
    console.error('❌ Errore login:', error)
    console.error('📦 Error response:', error.response?.data)
    
    return {
      success: false,
      error: error.response?.data?.message || 'Credenziali non valide',
    }
  }
}

// ============================================
// POST - Register
// ============================================
export const register = async (username, email, password) => {
  console.log('📝 Tentativo registrazione:', { username, email })
  
  try {
    console.log('📤 Invio richiesta POST /auth/register')
    
    const payload = {
      username: String(username),
      email: String(email),
      password: String(password),
    }
    
    console.log('📦 Payload:', payload)
    
    const response = await api.post('/auth/register', payload)
    
    console.log('✅ Risposta register completa:', response.data)
    
    // Estrai TUTTI i token dalla response
    const accessToken = response.data.accessToken
    const token = response.data.token
    const refreshToken = response.data.refreshToken
    
    console.log('🔑 accessToken:', accessToken?.substring(0, 30) + '...')
    console.log('🔑 token:', token?.substring(0, 30) + '...')
    console.log('🔑 refreshToken:', refreshToken?.substring(0, 30) + '...')
    
    // Priorità: accessToken > token > refreshToken
    const finalToken = accessToken || token || refreshToken
    
    if (!finalToken) {
      console.error('❌ NESSUN TOKEN TROVATO NELLA RESPONSE!')
      return {
        success: false,
        error: 'Nessun token ricevuto dal server',
      }
    }
    
    console.log('✅ Token selezionato:', finalToken.substring(0, 30) + '...')
    console.log('📏 Lunghezza token:', finalToken.length)
    console.log('🏷️ Tipo token:', finalToken.startsWith('eyJ') ? 'JWT' : 'UUID')
    
    // Normalizza response
    const normalizedData = {
      user: response.data.user,
      token: finalToken,
      tokenType: response.data.type || 'Bearer',
    }
    
    console.log('📦 Data normalizzata:', normalizedData)
    
    return {
      success: true,
      data: normalizedData,
    }
  } catch (error) {
    console.error('❌ Errore registrazione:', error)
    console.error('📦 Error response:', error.response?.data)
    
    return {
      success: false,
      error: error.response?.data?.message || 'Errore nella registrazione',
    }
  }
}

// ============================================
// POST - Logout
// ============================================
export const logout = async () => {
  try {
    await api.post('/auth/logout')
    return { success: true }
  } catch (error) {
    console.error('Errore logout:', error)
    return { success: false }
  }
}