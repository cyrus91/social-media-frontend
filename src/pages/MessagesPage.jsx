import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { messagingService } from "../services/messagingService";
import AvatarZoom from "../components/AvatarZoom";
import LoadingSpinner from "../components/LoadingSpinner";

function MessagesPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await messagingService.getConversations();
        setConversations(data);
      } catch (e) {
        console.error("Errore caricamento conversazioni:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Ieri";
    if (diffDays < 7) return date.toLocaleDateString("it-IT", { weekday: "short" });
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">💬 Messaggi</h1>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Nessun messaggio</h2>
            <p className="text-gray-500">Inizia una conversazione dal profilo di un utente</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="w-full flex items-center space-x-3 px-4 py-4 hover:bg-gray-50 transition text-left">
                {/* Avatar con indicatore online */}
                <div className="relative flex-shrink-0">
                  <AvatarZoom src={conv.otherAvatarUrl} username={conv.otherUsername} size="md" />
                  {conv.otherOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Info conversazione */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold text-sm ${conv.unreadCount > 0 ? "text-gray-900" : "text-gray-700"}`}>
                      @{conv.otherUsername}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                      {conv.lastMessage || "Nessun messaggio ancora"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;