import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { messagingService } from "../services/messagingService";
import api from "../services/api";
import AvatarZoom from "../components/AvatarZoom";
import LoadingSpinner from "../components/LoadingSpinner";
import useAuthStore from "../store/authStore";
import useMessagingStore from "../store/messagingStore";

function MessagesPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  // Legge dallo store globale — aggiornato in tempo reale dal WebSocket in Navbar
  const conversations = useMessagingStore((state) => state.conversations);
  const initialized = useMessagingStore((state) => state.initialized);
  const typingUsers = useMessagingStore((state) => state.typingUsers);
  const removeConversation = useMessagingStore((state) => state.removeConversation);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [deleteConvTarget, setDeleteConvTarget] = useState(null);

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
        const res = await api.get("/users/search", { params: { q: search } });
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

  const handleDeleteConv = async (convId) => {
    try {
      await messagingService.deleteConversation(convId);
      removeConversation(convId);
    } catch {
      // ignora
    } finally {
      setDeleteConvTarget(null);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const iso = String(dateStr).includes("Z") || String(dateStr).includes("+") ? dateStr : dateStr + "Z";
    const date = new Date(iso);
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

        {/* Barra ricerca */}
        <div className="relative mb-4">
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-xl px-4 py-2 focus-within:border-blue-400 transition">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Cerca un utente per iniziare una chat..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.trim() && setShowResults(true)}
              className="flex-1 outline-none text-sm bg-transparent" />
            {searching && <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
            {search && <button onClick={() => { setSearch(""); setShowResults(false); }}
              className="text-gray-400 hover:text-gray-600 transition flex-shrink-0">✕</button>}
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
              {searchResults.map((user) => (
                <button key={user.id} onClick={() => { setSearch(""); setShowResults(false); handleStartChat(user.id); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition text-left">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="font-semibold text-sm text-gray-800">@{user.username}</p>
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

        {/* Lista conversazioni dallo store */}
        {!initialized ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Nessun messaggio</h2>
            <p className="text-gray-500">Cerca un utente qui sopra per iniziare una conversazione</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {conversations.map((conv) => {
              const typing = typingUsers[conv.id];
              return (
                <div key={conv.id} className="flex items-center group hover:bg-gray-50 transition">
                  <button
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    className="flex-1 flex items-center space-x-3 px-4 py-4 text-left min-w-0">
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
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        {typing?.isTyping ? (
                          <span className="text-xs text-blue-500 flex items-center space-x-1">
                            <span>sta scrivendo</span>
                            <span className="flex space-x-0.5 ml-1">
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </span>
                          </span>
                        ) : (
                          <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                            {conv.lastMessage || "Nessun messaggio ancora"}
                          </p>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 flex-shrink-0 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  {/* Elimina chat — hover desktop / sempre mobile */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConvTarget(conv.id); }}
                    className="flex-shrink-0 px-3 opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CONFERMA ELIMINA CHAT */}
      {deleteConvTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setDeleteConvTarget(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Elimina conversazione</h3>
              <p className="text-sm text-gray-500">
                La chat verrà rimossa dalla tua lista. L'altro utente potrà ancora vederla.
              </p>
              <div className="flex w-full space-x-3 pt-2">
                <button onClick={() => setDeleteConvTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition">
                  Annulla
                </button>
                <button onClick={() => handleDeleteConv(deleteConvTarget)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition">
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;