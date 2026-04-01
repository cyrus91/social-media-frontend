import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  fetchUnreadCount,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notificationService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const WS_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "https://zany-karlotte-hobby-app-f20c3361.koyeb.app";

// Suono campanellina — diverso dal suono messaggi
// Due note veloci ascendenti, più "ding" che "ping"
function playNotificationBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Ding-dong: due note (Mi6 → La6), suono campanella classico
    playNote(1318, ctx.currentTime, 0.3);
    playNote(1760, ctx.currentTime + 0.15, 0.4);
  } catch { /* silenzioso se non supportato */ }
}

function NotificationBell(props) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const dropdownRef = useRef(null);
  const stompClientRef = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "LIKE": return "❤️";
      case "COMMENT": return "💬";
      case "FOLLOW": return "👤";
      case "REACTION": return "😊";
      case "MENTION": return "🔖";
      default: return "🔔";
    }
  };

  // Carica count iniziale
  useEffect(() => {
    const loadCount = async () => {
      const result = await fetchUnreadCount();
      if (result.success) setUnreadCount(result.count);
    };
    loadCount();
  }, []);

  // Connessione WebSocket STOMP
  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const client = new Client({
      // Usa SockJS come transport
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ WebSocket connesso");
        setConnected(true);

        // Sottoscrivi al canale notifiche dell'utente
        client.subscribe(`/queue/notifications/${user.id}`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log("🔔 Nuova notifica real-time:", notification);

            // Suono campanellina
            playNotificationBell();

            // Incrementa badge
            setUnreadCount((prev) => prev + 1);

            // Aggiungi in cima alla lista se il dropdown è aperto
            setNotifications((prev) => [notification, ...prev]);

            // Toast di notifica
            toast(
              notification.message,
              {
                icon: getNotificationIcon(notification.type),
                duration: 4000,
              }
            );
          } catch (e) {
            console.error("Errore parsing notifica WebSocket:", e);
          }
        });
      },
      onDisconnect: () => {
        console.log("🔌 WebSocket disconnesso");
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error("❌ STOMP error:", frame);
        setConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user?.id]);

  // Fallback polling ogni 30s (solo se WebSocket non connesso)
  useEffect(() => {
    if (connected) return;

    const interval = setInterval(async () => {
      const result = await fetchUnreadCount();
      if (result.success) setUnreadCount(result.count);
    }, 30000);

    return () => clearInterval(interval);
  }, [connected]);

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const result = await fetchNotifications(0, 10);
    if (result.success) {
      setNotifications(result.data.content || []);
    }
    setLoading(false);
  };

  const handleToggle = async () => {
    if (!isOpen) await loadNotifications();
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }

    setIsOpen(false);

    if (notification.type === "FOLLOW" && notification.actorUsername) {
      navigate(`/profile/${notification.actorUsername}`);
    } else if (notification.postId) {
      navigate(`/post/${notification.postId}`);
    } else if (notification.actorUsername) {
      navigate(`/profile/${notification.actorUsername}`);
    }

    if (props.onClose) props.onClose();
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Tutte le notifiche sono state lette");
    }
  };

  const formatDate = (dateString) => {
    let date;
    if (dateString.includes("Z") || dateString.includes("+")) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString.replace("T", " "));
    }

    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 0) return "Adesso";
    if (diffSecs < 10) return "Adesso";
    if (diffSecs < 60) return `${diffSecs}s fa`;
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays === 1) return "Ieri";
    if (diffDays < 7) return `${diffDays}g fa`;

    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <style>{`
        @keyframes nx-pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          50% { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }
      `}</style>
      <button
        onClick={handleToggle}
        style={{
          position: "relative", padding: "7px", borderRadius: "var(--nx-radius-sm)",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--nx-text-muted)", transition: "all var(--nx-transition)",
          display: props.isMobile ? "flex" : "flex", alignItems: "center",
          gap: props.isMobile ? "10px" : undefined,
          width: props.isMobile ? "100%" : undefined,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
        {props.isMobile && <span style={{ fontSize: "18px" }}>🔔</span>}
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {props.isMobile && (
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--nx-text)", flex: 1, textAlign: "left" }}>
            Notifiche {connected && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "7px", height: "7px", background: "#10B981", borderRadius: "50%", display: "inline-block", animation: "nx-pulse-glow 2s infinite", flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 600 }}>live</span>
              </span>}
          </span>
        )}
        {/* Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: props.isMobile ? "50%" : "2px",
            right: props.isMobile ? "8px" : "2px",
            transform: props.isMobile ? "translateY(-50%)" : undefined,
            background: "var(--nx-grad-btn)",
            color: "#fff", fontSize: "10px", fontWeight: 700,
            width: "16px", height: "16px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid var(--nx-surface)",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: "340px",
          background: "var(--nx-surface)",
          border: "1px solid var(--nx-border)",
          borderRadius: "var(--nx-radius-lg)",
          boxShadow: "var(--nx-shadow-lg)",
          maxHeight: "380px", overflowY: "auto", zIndex: 60,
        }}>
          {/* Header */}
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid var(--nx-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "sticky", top: 0, background: "var(--nx-surface)", zIndex: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontWeight: 700, fontSize: "14px", color: "var(--nx-text)" }}>Notifiche</h3>
              {connected && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "7px", height: "7px", background: "#10B981", borderRadius: "50%", display: "inline-block", animation: "nx-pulse-glow 2s infinite", flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 600 }}>live</span>
              </span>}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead}
                style={{ fontSize: "11px", fontWeight: 600, color: "#7c3aed", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                Segna tutte come lette
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ padding: "32px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: "24px", height: "24px", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          )}

          {/* Empty */}
          {!loading && notifications.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔔</div>
              <p style={{ fontSize: "13px", color: "var(--nx-text-muted)" }}>Nessuna notifica</p>
            </div>
          )}

          {/* List */}
          {!loading && notifications.length > 0 && notifications.map((notification) => (
            <button key={notification.id} onClick={() => handleNotificationClick(notification)}
              style={{
                width: "100%", display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "12px 16px", background: notification.isRead ? "none" : "rgba(124,58,237,0.05)",
                border: "none", borderBottom: "1px solid var(--nx-border)", cursor: "pointer",
                textAlign: "left", transition: "background var(--nx-transition)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = notification.isRead ? "none" : "rgba(124,58,237,0.05)"}>
              {notification.actorAvatarUrl ? (
                <img src={notification.actorAvatarUrl} alt={notification.actorUsername}
                  style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div className="nx-avatar-gradient" style={{ width: "38px", height: "38px", fontSize: "13px", flexShrink: 0 }}>
                  {notification.actorUsername?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "14px" }}>{getNotificationIcon(notification.type)}</span>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--nx-text)" }}>{notification.actorUsername}</p>
                </div>
                <p style={{ fontSize: "12px", color: "var(--nx-text-muted)", marginBottom: "2px" }}>{notification.message}</p>
                <p style={{ fontSize: "11px", color: "var(--nx-text-subtle)" }}>{formatDate(notification.createdAt)}</p>
              </div>
              {!notification.isRead && (
                <div style={{ width: "8px", height: "8px", background: "#7c3aed", borderRadius: "50%", flexShrink: 0, marginTop: "4px" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;