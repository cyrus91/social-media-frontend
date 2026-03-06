import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

function LoginPage() {
  const navigate = useNavigate()
  const authLogin = useAuthStore((state) => state.login)  
  
  // State
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('🚀 Form submitted')
    
    setError('')
    setLoading(true)
    
    try {
      console.log('📞 Chiamata login service...')
      const result = await login(username, password)
      
      console.log('📦 Risultato login:', result)
      
      if (result.success) {
        console.log('✅ Login OK!')
        
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
        console.log('❌ Login fallito:', result.error)
        setError(result.error)
        setLoading(false)
      }
    } catch (err) {
      console.error('💥 Errore imprevisto:', err)
      setError('Errore imprevisto nel login')
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Bentornato! 👋
          </h1>
          <p className="text-gray-600">
            Accedi al tuo account
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
          
        </form>
        
        {/* Register link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Non hai un account?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold">
              Registrati
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  )
}

export default LoginPage