import api from './api';

export const aiService = {
  /**
   * Genera caption per post con immagini
   * @param {string} partialText - Testo parziale/idea iniziale
   * @param {string[]} imageUrls - Array di URL immagini
   * @param {string} tone - Tono: friendly/professional/funny/inspirational
   * @returns {Promise<{suggestion: string, model: string}>}
   */
  generateCaption: async (partialText = '', imageUrls = [], tone = 'friendly') => {
    const response = await api.post('/api/ai/generate-caption', 
      { imageUrls },
      { params: { partialText, tone } }
    );
    return response.data;
  },

  /**
   * Migliora testo esistente
   * @param {string} text - Testo da migliorare
   * @param {string} context - Contesto (es: "social media post")
   * @returns {Promise<{suggestion: string, model: string}>}
   */
  improveText: async (text, context = 'social media post') => {
    const response = await api.post('/api/ai/improve-text', null, {
      params: { text, context }
    });
    return response.data;
  },

  /**
   * Suggerisci risposta a commento
   * @param {string} comment - Commento originale
   * @param {string} postContext - Contesto del post
   * @returns {Promise<{suggestion: string, model: string}>}
   */
  suggestReply: async (comment, postContext = '') => {
    const response = await api.post('/api/ai/suggest-reply', null, {
      params: { comment, postContext }
    });
    return response.data;
  },

  /**
   * Genera hashtags rilevanti
   * @param {string} content - Contenuto del post
   * @returns {Promise<{hashtags: string[], model: string}>}
   */
  suggestHashtags: async (content) => {
    const response = await api.post('/api/ai/suggest-hashtags', null, {
      params: { content }
    });
    return response.data;
  }
};