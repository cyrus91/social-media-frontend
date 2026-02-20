import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/authService'
import useAuthStore from '../store/authStore'

function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  
  // State del form
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('') // Pulisce errore quando l'utente scrive
  }
  
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // Validazione base
    if (!formData.username || !formData.password) {
      setError('Inserisci username e password')
      setLoading(false)
      return
    }
    
    // Chiama API
    const result = await login(formData.username, formData.password)
    
    if (result.success) {
      // Login riuscito!
      setUser(result.data.user)
      navigate('/feed') // Redirect al feed
    } else {
      // Login fallito
      setError(result.error)
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bentornato! 👋
          </h1>
          <p className="text-gray-600">
            Accedi al tuo account
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Il tuo username"
              disabled={loading}
            />
          </div>
          
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="La tua password"
              disabled={loading}
            />
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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