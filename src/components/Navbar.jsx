import { Link } from 'react-router-dom'
import { logout } from '../services/authService'
import useAuthStore from '../store/authStore'

function Navbar() {
  const user = useAuthStore((state) => state.user)
  
  const handleLogout = () => {
    if (window.confirm('Sei sicuro di voler uscire?')) {
      logout()
    }
  }
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/feed" className="flex items-center space-x-2">
            <span className="text-2xl">📱</span>
            <span className="text-xl font-bold text-gray-800">Social App</span>
          </Link>
          
          {/* Menu */}
          <div className="flex items-center space-x-6">
            <Link
              to="/feed"
              className="text-gray-600 hover:text-blue-500 font-medium transition"
            >
              Feed
            </Link>
            
            <Link
              to={`/profile/${user?.username}`}
              className="text-gray-600 hover:text-blue-500 font-medium transition"
            >
              Profilo
            </Link>
            
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              
              {/* Avatar placeholder */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition duration-300"
            >
              Esci
            </button>
          </div>
          
        </div>
      </div>
    </nav>
  )
}

export default Navbar