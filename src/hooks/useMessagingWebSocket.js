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
// SUONO NOTIFICA (forte — tab in background)
// ============================================
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  } catch { /* silenzioso */ }
}

// SUONO LEGGERO (in chat)
export function playLightSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  } catch { /* silenzioso */ }
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
  const msg = `💬 Nuovo messaggio da @${senderUsername}`;
  blinkInterval = setInterval(() => {
    document.title = document.title === originalTitle ? msg : originalTitle;
    if (++blinkCount >= 10) {
      clearInterval(blinkInterval); blinkInterval = null;
      document.title = msg;
    }
  }, 800);
}

function stopTabBlink() {
  if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; }
  document.title = originalTitle;
}

document.addEventListener("visibilitychange", () => { if (!document.hidden) stopTabBlink(); });

// ============================================
// NOTIFICHE BROWSER NATIVE
// ============================================
export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

function showBrowserNotification(senderUsername, content) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!document.hidden) return;
  const n = new Notification(`💬 @${senderUsername}`, {
    body: content || "Ti ha inviato un messaggio",
    icon: "/favicon.ico", badge: "/favicon.ico",
    tag: `msg-${senderUsername}`, renotify: true, silent: false,
  });
  n.onclick = () => { window.focus(); n.close(); };
  setTimeout(() => n.close(), 5000);
}

// ============================================
// HANDLER EXPORTS
// ============================================
export function setIncomingMessageHandler(handler) { incomingMessageHandler = handler; }
export function clearIncomingMessageHandler() { incomingMessageHandler = null; }

// Riferimento al client STOMP per inviare typing da ChatPage
let globalStompClient = null;
export function sendTypingEvent(conversationId, isTyping) {
  if (globalStompClient?.active) {
    globalStompClient.publish({
      destination: "/app/typing",
      body: JSON.stringify({ conversationId, isTyping }),
    });
  }
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
        globalStompClient = client;

        // 1. Messaggi in arrivo
        client.subscribe(`/queue/messages/${user.id}`, (frame) => {
          const msg = JSON.parse(frame.body);
          const preview = msg.audioUrl ? "🎤 Vocale"
                        : msg.imageUrl ? "📷 Foto"
                        : msg.deletedForAll ? "Messaggio eliminato"
                        : msg.content;
          updateConversationPreview(msg.conversationId, preview, msg.createdAt, true);
          if (incomingMessageHandler) incomingMessageHandler({ type: "NEW_MESSAGE", payload: msg });
          if (document.hidden) {
            playNotificationSound();
            startTabBlink(msg.senderUsername || "qualcuno");
            showBrowserNotification(msg.senderUsername || "qualcuno",
              msg.audioUrl ? "🎤 Ha inviato un vocale"
              : msg.imageUrl ? "📷 Ha inviato una foto"
              : msg.content);
          } else if (!incomingMessageHandler) {
            playNotificationSound();
          }
        });

        // 2. Read receipts
        client.subscribe(`/queue/read-receipt/${user.id}`, (frame) => {
          const receipt = JSON.parse(frame.body);
          subscribers.forEach(fn => fn("READ_RECEIPT", receipt));
          if (incomingMessageHandler) incomingMessageHandler({ type: "READ_RECEIPT", payload: receipt });
        });

        // 3. Online status
        client.subscribe("/topic/online-status", (frame) => {
          const status = JSON.parse(frame.body);
          updateOnlineStatus(status.userId, status.online);
          if (incomingMessageHandler) incomingMessageHandler({ type: "ONLINE_STATUS", payload: status });
        });

        // 4. Typing
        client.subscribe(`/queue/typing/${user.id}`, (frame) => {
          const typing = JSON.parse(frame.body);
          if (incomingMessageHandler) incomingMessageHandler({ type: "TYPING", payload: typing });
        });

        // 5. Messaggio eliminato
        client.subscribe(`/queue/message-deleted/${user.id}`, (frame) => {
          const data = JSON.parse(frame.body);
          if (incomingMessageHandler) incomingMessageHandler({ type: "MESSAGE_DELETED", payload: data });
          // Aggiorna preview conversazione
          messagingService.getConversations().then(setConversations).catch(() => {});
        });

        // 6. Reazioni
        client.subscribe(`/queue/reaction/${user.id}`, (frame) => {
          const updatedMsg = JSON.parse(frame.body);
          if (incomingMessageHandler) incomingMessageHandler({ type: "REACTION", payload: updatedMsg });
        });

        // 7. Disappearing messages
        client.subscribe(`/queue/disappearing/${user.id}`, (frame) => {
          const data = JSON.parse(frame.body);
          if (incomingMessageHandler) incomingMessageHandler({ type: "DISAPPEARING", payload: data });
        });
      },
      onDisconnect: () => { globalStompClient = null; },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      globalStompClient = null;
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
  const preview = msg.audioUrl ? "🎤 Vocale" : msg.imageUrl ? "📷 Foto" : msg.content;
  useMessagingStore.getState().updateConversationPreview(msg.conversationId, preview, msg.createdAt, false);
}