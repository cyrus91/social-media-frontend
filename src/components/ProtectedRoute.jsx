import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  // Se non sei loggato, redirect a /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Se sei loggato, mostra il componente
  return children
}

export default ProtectedRoute