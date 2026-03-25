import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import useAuthStore from "../store/authStore";
import useMessagingStore from "../store/messagingStore";
import { messagingService } from "../services/messagingService";

const WS_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "https://zany-karlotte-hobby-app-f20c3361.koyeb.app";

let globalConnected = false;
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

  useEffect(() => {
    if (!user || !token) return;

    messagingService.getConversations().then(setConversations).catch(() => {});

    if (globalConnected) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        globalConnected = true;

        client.subscribe(`/queue/messages/${user.id}`, (frame) => {
          const msg = JSON.parse(frame.body);
          const preview = msg.imageUrl ? "📷 Foto" : msg.content;
          updateConversationPreview(msg.conversationId, preview, msg.createdAt, true);
          // incomingMessageHandler è una variabile di modulo — sempre aggiornata
          if (incomingMessageHandler) incomingMessageHandler(msg);
        });

        client.subscribe(`/queue/read-receipt/${user.id}`, (frame) => {
          const receipt = JSON.parse(frame.body);
          subscribers.forEach(fn => fn("READ_RECEIPT", receipt));
        });

        client.subscribe("/topic/online-status", (frame) => {
          const status = JSON.parse(frame.body);
          updateOnlineStatus(status.userId, status.online);
          subscribers.forEach(fn => fn("ONLINE_STATUS", status));
        });
      },
      onDisconnect: () => { globalConnected = false; },
      onStompError: () => { globalConnected = false; }
    });

    client.activate();

    return () => {
      client.deactivate();
      globalConnected = false;
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