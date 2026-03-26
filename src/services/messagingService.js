import api from './api';

export const messagingService = {

  getConversations: async () => {
    const res = await api.get('/messages/conversations');
    return res.data;
  },

  getOrCreateConversation: async (otherUserId) => {
    const res = await api.post(`/messages/conversations/${otherUserId}`);
    return res.data;
  },

  getMessages: async (conversationId) => {
    const res = await api.get(`/messages/conversations/${conversationId}/messages`);
    return res.data;
  },

  sendMessage: async (conversationId, content, replyToId = null) => {
    const res = await api.post(`/messages/conversations/${conversationId}/messages`,
      { content, replyToId });
    return res.data;
  },

  sendMessageWithImage: async (conversationId, content, imageFile, replyToId = null) => {
    const formData = new FormData();
    if (content) formData.append('content', content);
    formData.append('image', imageFile);
    if (replyToId) formData.append('replyToId', replyToId);
    const res = await api.post(
      `/messages/conversations/${conversationId}/messages/image`,
      formData, { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  sendVoiceMessage: async (conversationId, audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');
    const res = await api.post(
      `/messages/conversations/${conversationId}/messages/voice`,
      formData, { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  markAsRead: async (conversationId) => {
    await api.put(`/messages/conversations/${conversationId}/read`);
  },

  getUnreadCount: async () => {
    const res = await api.get('/messages/unread-count');
    return res.data.count;
  },

  deleteMessage: async (messageId) => {
    await api.delete(`/messages/messages/${messageId}`);
  },

  toggleReaction: async (messageId, emoji) => {
    const res = await api.post(`/messages/messages/${messageId}/reactions`, { emoji });
    return res.data;
  },

  setDisappearing: async (conversationId, hours) => {
    await api.put(`/messages/conversations/${conversationId}/disappearing`, { hours });
  },
};