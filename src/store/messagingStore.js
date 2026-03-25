import { create } from "zustand";

/**
 * Store globale per la messaggistica.
 * Condiviso tra Navbar, MessagesPage e ChatPage.
 * Garantisce che tutti i componenti abbiano lo stesso stato aggiornato
 * senza polling e senza refresh.
 */
const useMessagingStore = create((set) => ({
  conversations: [],
  unreadCount: 0,
  initialized: false,

  // Carica tutte le conversazioni
  setConversations: (conversations) => set({
    conversations,
    initialized: true,
    unreadCount: conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  }),

  // Aggiorna o inserisce in testa una conversazione quando arriva/invia un messaggio
  updateConversationPreview: (conversationId, lastMessage, lastMessageAt, incrementUnread = false) => {
    set((state) => {
      const idx = state.conversations.findIndex(c => c.id === conversationId);
      if (idx === -1) return state; // conversazione non in lista, ignora

      const conv = state.conversations[idx];
      const updated = {
        ...conv,
        lastMessage,
        lastMessageAt,
        unreadCount: incrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount
      };
      // Porta in cima alla lista
      const newConvs = [
        updated,
        ...state.conversations.filter(c => c.id !== conversationId)
      ];
      return {
        conversations: newConvs,
        unreadCount: newConvs.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      };
    });
  },

  // Segna conversazione come letta (azzera unread)
  markConversationRead: (conversationId) => {
    set((state) => {
      const newConvs = state.conversations.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      return {
        conversations: newConvs,
        unreadCount: newConvs.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      };
    });
  },

  // Aggiorna lo stato online di un utente in tutte le conversazioni
  updateOnlineStatus: (userId, online) => {
    set((state) => ({
      conversations: state.conversations.map(c =>
        c.otherUserId === userId ? { ...c, otherOnline: online } : c
      )
    }));
  },

  reset: () => set({ conversations: [], unreadCount: 0, initialized: false })
}));

export default useMessagingStore;