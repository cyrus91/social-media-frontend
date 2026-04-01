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

  const conversations = useMessagingStore((state) => state.conversations);
  const initialized = useMessagingStore((state) => state.initialized);
  const typingUsers = useMessagingStore((state) => state.typingUsers);
  const removeConversation = useMessagingStore(
    (state) => state.removeConversation,
  );

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [deleteConvTarget, setDeleteConvTarget] = useState(null);

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
        setSearchResults(
          (res.data || []).filter((u) => u.id !== currentUser?.id),
        );
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, currentUser?.id]);

  const handleStartChat = async (userId) => {
    try {
      const conv = await messagingService.getOrCreateConversation(userId);
      navigate(`/messages/${conv.id}`);
    } catch (error) {
      console.error("Errore nel caricamento della conversazione:", error);
    }
  };

  const handleDeleteConv = async (convId) => {
    try {
      await messagingService.deleteConversation(convId);
      removeConversation(convId);
    } catch (error) {
      console.error("Errore nel caricamento della conversazione:", error);
    } finally {
      setDeleteConvTarget(null);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const iso =
      String(dateStr).includes("Z") || String(dateStr).includes("+")
        ? dateStr
        : dateStr + "Z";
    const date = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0)
      return date.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diffDays === 1) return "Ieri";
    if (diffDays < 7)
      return date.toLocaleDateString("it-IT", { weekday: "short" });
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  return (
    <div className="nx-page">
      <style>{`
        @keyframes nx-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
      <Navbar />

      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "24px 16px 60px",
        }}>
        <h1
          style={{
            fontWeight: 800,
            fontSize: "20px",
            color: "var(--nx-text)",
            marginBottom: "16px",
          }}>
          Messaggi
        </h1>

        {/* Barra ricerca */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--nx-surface)",
              border: "1.5px solid var(--nx-border)",
              borderRadius: "var(--nx-radius-lg)",
              padding: "9px 14px",
              transition:
                "border-color var(--nx-transition), box-shadow var(--nx-transition)",
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(124,58,237,0.08)";
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = "var(--nx-border)";
              e.currentTarget.style.boxShadow = "none";
            }}>
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="var(--nx-text-subtle)"
              viewBox="0 0 24 24"
              style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Cerca un utente per iniziare una chat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => search.trim() && setShowResults(true)}
              style={{
                flex: 1,
                outline: "none",
                fontSize: "13px",
                background: "transparent",
                color: "var(--nx-text)",
                border: "none",
              }}
            />
            {searching && (
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid rgba(124,58,237,0.25)",
                  borderTopColor: "#7c3aed",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  flexShrink: 0,
                }}
              />
            )}
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setShowResults(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--nx-text-subtle)",
                  fontSize: "14px",
                  flexShrink: 0,
                  display: "flex",
                }}>
                ✕
              </button>
            )}
          </div>

          {/* Dropdown risultati */}
          {showResults && searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "var(--nx-surface)",
                border: "1px solid var(--nx-border)",
                borderRadius: "var(--nx-radius-lg)",
                boxShadow: "var(--nx-shadow-lg)",
                zIndex: 20,
                overflow: "hidden",
              }}>
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSearch("");
                    setShowResults(false);
                    handleStartChat(user.id);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background var(--nx-transition)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(124,58,237,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      className="nx-avatar-gradient"
                      style={{
                        width: "32px",
                        height: "32px",
                        fontSize: "11px",
                        flexShrink: 0,
                      }}>
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "13px",
                      color: "var(--nx-text)",
                    }}>
                    @{user.username}
                  </p>
                </button>
              ))}
            </div>
          )}
          {showResults &&
            search.trim() &&
            searchResults.length === 0 &&
            !searching && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  background: "var(--nx-surface)",
                  border: "1px solid var(--nx-border)",
                  borderRadius: "var(--nx-radius-lg)",
                  boxShadow: "var(--nx-shadow-lg)",
                  zIndex: 20,
                  padding: "14px 16px",
                  fontSize: "13px",
                  color: "var(--nx-text-muted)",
                }}>
                Nessun utente trovato
              </div>
            )}
        </div>

        {/* Lista conversazioni */}
        {!initialized ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "48px 0",
            }}>
            <LoadingSpinner />
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              background: "var(--nx-surface)",
              border: "1px solid var(--nx-border)",
              borderRadius: "var(--nx-radius-lg)",
              padding: "48px 24px",
              textAlign: "center",
              boxShadow: "var(--nx-shadow-sm)",
            }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
            <h2
              style={{
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--nx-text)",
                marginBottom: "6px",
              }}>
              Nessun messaggio
            </h2>
            <p style={{ fontSize: "13px", color: "var(--nx-text-muted)" }}>
              Cerca un utente qui sopra per iniziare una conversazione
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "var(--nx-surface)",
              border: "1px solid var(--nx-border)",
              borderRadius: "var(--nx-radius-lg)",
              overflow: "hidden",
              boxShadow: "var(--nx-shadow-sm)",
            }}>
            {conversations.map((conv, i) => {
              const typing = typingUsers[conv.id];
              return (
                <div
                  key={conv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom:
                      i < conversations.length - 1
                        ? "1px solid var(--nx-border)"
                        : "none",
                  }}
                  className="group">
                  <button
                    onClick={() => navigate(`/messages/${conv.id}`)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      minWidth: 0,
                      transition: "background var(--nx-transition)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(124,58,237,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <AvatarZoom
                        src={conv.otherAvatarUrl}
                        username={conv.otherUsername}
                        size="md"
                      />
                      {conv.otherOnline && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: "10px",
                            height: "10px",
                            background: "#22c55e",
                            border: "2px solid var(--nx-surface)",
                            borderRadius: "50%",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "2px",
                        }}>
                        <p
                          style={{
                            fontWeight: conv.unreadCount > 0 ? 800 : 600,
                            fontSize: "13px",
                            color: "var(--nx-text)",
                          }}>
                          @{conv.otherUsername}
                        </p>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--nx-text-subtle)",
                            flexShrink: 0,
                            marginLeft: "8px",
                          }}>
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}>
                        {typing?.isTyping ? (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#7c3aed",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}>
                            sta scrivendo
                            <span
                              style={{
                                display: "flex",
                                gap: "2px",
                                marginLeft: "2px",
                              }}>
                              {[0, 150, 300].map((delay) => (
                                <span
                                  key={delay}
                                  style={{
                                    width: "4px",
                                    height: "4px",
                                    background: "#7c3aed",
                                    borderRadius: "50%",
                                    animation: "nx-bounce 1s ease-in-out infinite",
                                    animationDelay: `${delay}ms`,
                                  }}
                                />
                              ))}
                            </span>
                          </span>
                        ) : (
                          <p
                            style={{
                              fontSize: "12px",
                              color:
                                conv.unreadCount > 0
                                  ? "var(--nx-text)"
                                  : "var(--nx-text-muted)",
                              fontWeight: conv.unreadCount > 0 ? 600 : 400,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                            {conv.lastMessage || "Nessun messaggio ancora"}
                          </p>
                        )}
                        {conv.unreadCount > 0 && (
                          <span
                            style={{
                              marginLeft: "8px",
                              flexShrink: 0,
                              background:
                                "var(--nx-grad-btn)",
                              color: "#fff",
                              fontSize: "10px",
                              fontWeight: 700,
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Elimina chat */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConvTarget(conv.id);
                    }}
                    style={{
                      flexShrink: 0,
                      padding: "0 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--nx-text-subtle)",
                      transition: "color var(--nx-transition), opacity var(--nx-transition)",
                      opacity: 0,
                      display: "flex",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--nx-text-subtle)"; e.currentTarget.style.opacity = "0"; }}>
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal elimina chat */}
      {deleteConvTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setDeleteConvTarget(null)}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            style={{
              position: "relative",
              background: "var(--nx-surface)",
              border: "1px solid var(--nx-border)",
              borderRadius: "var(--nx-radius-xl)",
              boxShadow: "var(--nx-shadow-lg)",
              padding: "28px 24px",
              maxWidth: "340px",
              width: "100%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "rgba(239,68,68,0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}>
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="#ef4444"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3
              style={{
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--nx-text)",
                marginBottom: "8px",
              }}>
              Elimina conversazione
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--nx-text-muted)",
                marginBottom: "20px",
              }}>
              La chat verrà rimossa dalla tua lista. L'altro utente potrà ancora
              vederla.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setDeleteConvTarget(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: "var(--nx-surface-2)",
                  border: "1px solid var(--nx-border)",
                  borderRadius: "var(--nx-radius)",
                  cursor: "pointer",
                  color: "var(--nx-text)",
                  transition: "all var(--nx-transition)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--nx-border)")
                }>
                Annulla
              </button>
              <button
                onClick={() => handleDeleteConv(deleteConvTarget)}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background: "#ef4444",
                  border: "none",
                  borderRadius: "var(--nx-radius)",
                  cursor: "pointer",
                  color: "#fff",
                  transition: "opacity var(--nx-transition)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;