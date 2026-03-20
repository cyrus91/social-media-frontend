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

const WS_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "https://social-media-backend-production-1d40.up.railway.app";

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

            // Incrementa badge
            setUnreadCount((prev) => prev + 1);

            // Aggiungi in cima alla lista se il dropdown è aperto
            setNotifications((prev) => [notification, ...prev]);

            // Toast di notifica
            toast(
              `${notification.actorUsername} ${notification.message}`,
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
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={`relative text-gray-700 hover:text-blue-600 transition p-2 rounded-full hover:bg-gray-100 ${
          props.isMobile ? "w-full flex items-center justify-start space-x-3" : ""
        }`}>
        {props.isMobile && <span className="text-lg">🔔</span>}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {props.isMobile && (
          <span className="text-gray-700 font-semibold flex-1 text-left">
            Notifiche {connected && <span className="text-xs text-green-500">● live</span>}
          </span>
        )}

        {/* Badge rosso */}
        {unreadCount > 0 && (
          <span className={`absolute bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
            props.isMobile ? "right-2 top-1/2 -translate-y-1/2" : "top-1 right-1"
          }`}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800">Notifiche</h3>
              {connected && (
                <span className="text-xs text-green-500 font-medium">● live</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead}
                className="text-xs text-blue-500 hover:text-blue-600 font-semibold">
                Segna tutte come lette
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}

          {/* Empty state */}
          {!loading && notifications.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-gray-500">Nessuna notifica</p>
            </div>
          )}

          {/* Notifications list */}
          {!loading && notifications.length > 0 && (
            <div>
              {notifications.map((notification) => (
                <button key={notification.id} onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 hover:bg-gray-50 transition text-left border-b border-gray-100 ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}>
                  <div className="flex items-start space-x-3">
                    {notification.actorAvatarUrl ? (
                      <img src={notification.actorAvatarUrl} alt={notification.actorUsername}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {notification.actorUsername?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <p className="text-sm text-gray-800 font-medium">{notification.actorUsername}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;