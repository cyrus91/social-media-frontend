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
import { useMessagingWebSocket } from "./hooks/useMessagingWebSocket";

// Componente interno che inizializza il WebSocket messaggistica globale
// Deve stare dentro BrowserRouter
function AppInner() {
  useMessagingWebSocket();
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/post/:postId" element={<PostPage />} />
      <Route path="/hashtag/:tag" element={<HashtagPage />} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/messages/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
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