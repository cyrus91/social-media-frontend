import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import useAuthStore from "../store/authStore";
import useMessagingStore from "../store/messagingStore";
import { messagingService } from "../services/messagingService";

const WS_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "https://zany-karlotte-hobby-app-f20c3361.koyeb.app";

const subscribers = new Set();
let incomingMessageHandler = null;

// ============================================
// NOTIFICA SONORA (Web Audio API)
// ============================================
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // fallback silenzioso
  }
}

// ============================================
// TAB TITLE LAMPEGGIANTE
// ============================================
const originalTitle = document.title;
let blinkInterval = null;
let blinkCount = 0;

function startTabBlink(senderUsername) {
  if (blinkInterval) { blinkCount = 0; return; }
  blinkCount = 0;
  const newMsg = `💬 Nuovo messaggio da @${senderUsername}`;
  blinkInterval = setInterval(() => {
    document.title = document.title === originalTitle ? newMsg : originalTitle;
    blinkCount++;
    if (blinkCount >= 10) {
      clearInterval(blinkInterval);
      blinkInterval = null;
      document.title = newMsg;
    }
  }, 800);
}

function stopTabBlink() {
  if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; }
  document.title = originalTitle;
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) stopTabBlink();
});

// ============================================
// NOTIFICHE BROWSER NATIVE (desktop + Android)
// ============================================

// Richiede il permesso una volta sola — va chiamato su interazione utente
export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

function showBrowserNotification(senderUsername, content) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!document.hidden) return;

  const notification = new Notification(`💬 @${senderUsername}`, {
    body: content || "Ti ha inviato un messaggio",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: `msg-${senderUsername}`,
    renotify: true,
    silent: false,
    vibrate: [100, 50, 100], // vibrazione via OS — funziona anche a schermo bloccato
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  setTimeout(() => notification.close(), 5000);
}

// ============================================
// EXPORTS HANDLER
// ============================================

export function setIncomingMessageHandler(handler) {
  incomingMessageHandler = handler;
}
export function clearIncomingMessageHandler() {
  incomingMessageHandler = null;
}

// ============================================
// HOOK PRINCIPALE
// ============================================

export function useMessagingWebSocket() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { setConversations, updateConversationPreview, updateOnlineStatus } = useMessagingStore();
  const clientRef = useRef(null);

  useEffect(() => {
    if (!user || !token) return;

    messagingService.getConversations().then(setConversations).catch(() => {});

    if (clientRef.current?.active) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        // 1. Messaggi in arrivo
        client.subscribe(`/queue/messages/${user.id}`, (frame) => {
          const msg = JSON.parse(frame.body);
          const preview = msg.imageUrl ? "📷 Foto" : msg.content;
          updateConversationPreview(msg.conversationId, preview, msg.createdAt, true);

          if (incomingMessageHandler) incomingMessageHandler(msg);

          // Notifiche solo se l'utente non è attivo sulla tab
          if (document.hidden) {
            playNotificationSound();
            startTabBlink(msg.senderUsername || "qualcuno");
            showBrowserNotification(
              msg.senderUsername || "qualcuno",
              msg.imageUrl ? "📷 Ha inviato una foto" : msg.content
            );
          }
        });

        // 2. Read receipts
        client.subscribe(`/queue/read-receipt/${user.id}`, (frame) => {
          const receipt = JSON.parse(frame.body);
          subscribers.forEach(fn => fn("READ_RECEIPT", receipt));
        });

        // 3. Online status
        client.subscribe("/topic/online-status", (frame) => {
          const status = JSON.parse(frame.body);
          updateOnlineStatus(status.userId, status.online);
          subscribers.forEach(fn => fn("ONLINE_STATUS", status));
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      stopTabBlink();
    };
  }, [user?.id, token]);
}

export function useMessagingEvents(callback) {
  useEffect(() => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  }, [callback]);
}

export function notifyMessageSent(msg) {
  const preview = msg.imageUrl ? "📷 Foto" : msg.content;
  useMessagingStore.getState().updateConversationPreview(
    msg.conversationId, preview, msg.createdAt, false
  );
}