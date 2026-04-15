import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

function ProtectedRoute({ children }) {
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Utente bannato — forza logout e redirect con messaggio
  if (user?.banned) {
    logout();
    return <Navigate to="/login?banned=1" replace />;
  }

  return children;
}

export default ProtectedRoute;