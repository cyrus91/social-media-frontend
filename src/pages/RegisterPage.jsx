import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/authService'
import useAuthStore from '../store/authStore'

function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  
  // State del form
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
  })
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }
  
  // Validazione
  const validate = () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError('Compila tutti i campi obbligatori')
      return false
    }
    
    if (formData.username.length < 3) {
      setError('Username deve essere almeno 3 caratteri')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('Password deve essere almeno 6 caratteri')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono')
      return false
    }
    
    // Email regex base
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Email non valida')
      return false
    }
    
    return true
  }
  
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validazione
    if (!validate()) {
      return
    }
    
    setLoading(true)
    
    // Prepara dati per API (rimuove confirmPassword)
    const { confirmPassword, ...userData } = formData
    
    // Chiama API
    const result = await register(userData)
    
    if (result.success) {
      // Registrazione riuscita!
      setUser(result.data.user)
      navigate('/feed') // Redirect al feed
    } else {
      // Registrazione fallita
      setError(result.error)
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Crea un account 🎉
          </h1>
          <p className="text-gray-600">
            Unisciti alla community!
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="Il tuo username"
              disabled={loading}
            />
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="nome@esempio.com"
              disabled={loading}
            />
          </div>
          
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="Almeno 6 caratteri"
              disabled={loading}
            />
          </div>
          
          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Conferma Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="Ripeti la password"
              disabled={loading}
            />
          </div>
          
          {/* Bio (opzionale) */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio (opzionale)
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Parlaci di te..."
              disabled={loading}
            />
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
          
        </form>
        
        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
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