import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import useAuthStore from "../store/authStore";
import useMessagingStore from "../store/messagingStore";
import { messagingService } from "../services/messagingService";

const WS_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "https://zany-karlotte-hobby-app-f20c3361.koyeb.app";

const subscribers = new Set();
let incomingMessageHandler = null;

export function setIncomingMessageHandler(handler) {
  incomingMessageHandler = handler;
}
export function clearIncomingMessageHandler() {
  incomingMessageHandler = null;
}

export function useMessagingWebSocket() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { setConversations, updateConversationPreview, updateOnlineStatus } = useMessagingStore();
  // Teniamo riferimento al client per questa istanza — non globale
  const clientRef = useRef(null);

  useEffect(() => {
    if (!user || !token) return;

    // Carica conversazioni iniziali
    messagingService.getConversations().then(setConversations).catch(() => {});

    // Se c'è già un client attivo per questo utente, non ne crea uno nuovo
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