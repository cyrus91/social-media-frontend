import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/authService'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

function RegisterPage() {
  const navigate = useNavigate()
  const authLogin = useAuthStore((state) => state.login)
  
  // State
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('🚀 Form registrazione submitted')
    console.log('📝 Dati:', { username, email, password })
    
    // Validazione
    setError('')
    
    if (!username || !email || !password) {
      setError('Tutti i campi sono obbligatori')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Le password non coincidono')
      return
    }
    
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      return
    }
    
    setLoading(true)
    
    try {
      console.log('📞 Chiamata register service...')
      
      // ✅ IMPORTANTE: Passa SOLO i valori, non eventi o oggetti DOM!
      const result = await register(
        username.trim(),
        email.trim(),
        password
      )
      
      console.log('📦 Risultato registrazione:', result)
      
      if (result.success) {
        console.log('✅ Registrazione OK!')
        
        const token = result.data.token || result.data.refreshToken
        
        if (!token) {
          console.error('❌ Token mancante!')
          setError('Errore: token mancante')
          setLoading(false)
          return
        }
        
        console.log('🔑 Token:', token)
        console.log('👤 User:', result.data.user)
        
        // Salva nello store
        authLogin(result.data.user, token)
        
        toast.success(`Benvenuto, ${result.data.user.username}!`)
        
        console.log('🚀 Navigazione a /feed')
        navigate('/feed')
      } else {
        console.log('❌ Registrazione fallita:', result.error)
        setError(result.error)
        setLoading(false)
      }
    } catch (err) {
      console.error('💥 Errore imprevisto:', err)
      setError('Errore imprevisto nella registrazione')
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Crea Account 🎉
          </h1>
          <p className="text-gray-600">
            Unisciti alla community!
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Il tuo username"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            />
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="La tua email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            />
          </div>
          
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="La tua password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            />
          </div>
          
          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Conferma Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Conferma password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            />
          </div>
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
          
        </form>
        
        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Hai già un account?{' '}
            <Link to="/login" className="text-purple-500 hover:text-purple-600 font-semibold">
              Accedi
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  )
}

export default RegisterPage