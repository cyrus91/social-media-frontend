import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { messagingService } from "../services/messagingService";
import api from "../services/api";
import AvatarZoom from "../components/AvatarZoom";
import LoadingSpinner from "../components/LoadingSpinner";
import useAuthStore from "../store/authStore";

function MessagesPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

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

  // Debounce ricerca utenti
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get("/users/search", { params: { query: search } });
        // Escludi te stesso
        setSearchResults((res.data || []).filter(u => u.id !== currentUser?.id));
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleStartChat = async (userId) => {
    try {
      const conv = await messagingService.getOrCreateConversation(userId);
      navigate(`/messages/${conv.id}`);
    } catch (e) {
      console.error("Errore apertura chat:", e);
    }
  };

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

        {/* Barra di ricerca nuova chat */}
        <div className="relative mb-4">
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-xl px-4 py-2 focus-within:border-blue-400 transition">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cerca un utente per iniziare una chat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.trim() && setShowResults(true)}
              className="flex-1 outline-none text-sm bg-transparent"
            />
            {searching && (
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            {search && (
              <button onClick={() => { setSearch(""); setShowResults(false); }}
                className="text-gray-400 hover:text-gray-600 transition flex-shrink-0">
                ✕
              </button>
            )}
          </div>

          {/* Risultati ricerca */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSearch("");
                    setShowResults(false);
                    handleStartChat(user.id);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition text-left">
                  <div className="relative flex-shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username}
                        className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && search.trim() && searchResults.length === 0 && !searching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 px-4 py-3 text-sm text-gray-500">
              Nessun utente trovato
            </div>
          )}
        </div>

        {/* Lista conversazioni */}
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Nessun messaggio</h2>
            <p className="text-gray-500">Cerca un utente qui sopra per iniziare una conversazione</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="w-full flex items-center space-x-3 px-4 py-4 hover:bg-gray-50 transition text-left">
                <div className="relative flex-shrink-0">
                  <AvatarZoom src={conv.otherAvatarUrl} username={conv.otherUsername} size="md" />
                  {conv.otherOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
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