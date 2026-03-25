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
    return res.data; // array diretto, non più Page { content: [...] }
  },

  sendMessage: async (conversationId, content) => {
    const res = await api.post(`/messages/conversations/${conversationId}/messages`, { content });
    return res.data;
  },

  sendMessageWithImage: async (conversationId, content, imageFile) => {
    const formData = new FormData();
    if (content) formData.append('content', content);
    formData.append('image', imageFile);
    const res = await api.post(
      `/messages/conversations/${conversationId}/messages/image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  markAsRead: async (conversationId) => {
    await api.put(`/messages/conversations/${conversationId}/read`);
  },

  getUnreadCount: async () => {
    const res = await api.get('/messages/unread-count');
    return res.data.count;
  }
};