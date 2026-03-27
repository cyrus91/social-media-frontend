import { create } from "zustand";

const useMessagingStore = create((set) => ({
  conversations: [],
  unreadCount: 0,
  initialized: false,
  typingUsers: {},

  setConversations: (conversations) => set({
    conversations,
    initialized: true,
    unreadCount: conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  }),

  updateConversationPreview: (conversationId, lastMessage, lastMessageAt, incrementUnread = false) => {
    set((state) => {
      const idx = state.conversations.findIndex(c => c.id === conversationId);
      if (idx === -1) return state;
      const conv = state.conversations[idx];
      const updated = {
        ...conv,
        lastMessage,
        lastMessageAt,
        unreadCount: incrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount
      };
      const newConvs = [updated, ...state.conversations.filter(c => c.id !== conversationId)];
      return {
        conversations: newConvs,
        unreadCount: newConvs.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      };
    });
  },

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

  updateOnlineStatus: (userId, online) => {
    set((state) => ({
      conversations: state.conversations.map(c =>
        c.otherUserId === userId ? { ...c, otherOnline: online } : c
      )
    }));
  },

  // Typing indicator per MessagesPage
  setTyping: (conversationId, username, isTyping) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: isTyping ? { username, isTyping: true } : undefined
      }
    }));
  },

  // Rimuove conversazione dalla lista (eliminazione lato utente)
  removeConversation: (conversationId) => {
    set((state) => {
      const newConvs = state.conversations.filter(c => c.id !== conversationId);
      return {
        conversations: newConvs,
        unreadCount: newConvs.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      };
    });
  },

  reset: () => set({ conversations: [], unreadCount: 0, initialized: false, typingUsers: {} })
}));

export default useMessagingStore;