import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import NotAuthorizedPage from "../pages/NotAuthorizedPage";

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  // Non autenticato → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Autenticato ma non admin → 403
  if (user?.role !== "ADMIN") {
    return <NotAuthorizedPage />;
  }

  return children;
}

export default AdminRoute;