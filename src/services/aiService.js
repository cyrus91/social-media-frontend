import api from './api';

export const aiService = {
  /**
   * Genera caption per post con immagini
   */
  generateCaption: async (partialText = '', imageUrls = [], tone = 'friendly') => {
    const response = await api.post('/ai/generate-caption',
      { imageUrls },
      { params: { partialText, tone } }
    );
    return response.data;
  },

  /**
   * Migliora testo esistente
   */
  improveText: async (text, context = 'social media post') => {
    const response = await api.post('/ai/improve-text', null, {
      params: { text, context }
    });
    return response.data;
  },

  /**
   * Suggerisci risposta a commento
   */
  suggestReply: async (comment, postContext = '') => {
    const response = await api.post('/ai/suggest-reply', null, {
      params: { comment, postContext }
    });
    return response.data;
  },

  /**
   * Genera hashtags rilevanti
   */
  suggestHashtags: async (content) => {
    const response = await api.post('/ai/suggest-hashtags', null, {
      params: { content }
    });
    return response.data;
  }
};