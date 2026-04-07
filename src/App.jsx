import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import ExplorePage from "./pages/ExplorePage";
import PostPage from "./pages/PostPage";
import { Toaster } from "react-hot-toast";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import HashtagPage from "./pages/HashtagPage";
import AdminPage from "./pages/AdminPage";
import AdminRoute from "./components/AdminRoute";
import MessagesPage from "./pages/MessagesPage";
import ChatPage from "./pages/ChatPage";
import OAuth2CallbackPage from "./pages/OAuth2CallbackPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BookmarksPage from "./pages/BookmarksPage";
import { useMessagingWebSocket, requestNotificationPermission } from "./hooks/useMessagingWebSocket";
import useAuthStore from "./store/authStore";

// Componente interno che inizializza il WebSocket messaggistica globale
// Deve stare dentro BrowserRouter
function AppInner() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useMessagingWebSocket();

  // Richiedi permesso notifiche browser al primo click dopo il login
  // I browser richiedono che la richiesta avvenga su un'interazione utente
  useEffect(() => {
    if (!isAuthenticated) return;
    const ask = () => {
      requestNotificationPermission();
      document.removeEventListener("click", ask);
    };
    document.addEventListener("click", ask, { once: true });
    return () => document.removeEventListener("click", ask);
  }, [isAuthenticated]);
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/post/:postId" element={<PostPage />} />
      <Route path="/hashtag/:tag" element={<HashtagPage />} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/messages/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: { background: "#363636", color: "#fff" },
          success: {
            duration: 3000,
            iconTheme: { primary: "#10b981", secondary: "#fff" },
          },
          error: {
            duration: 4000,
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;