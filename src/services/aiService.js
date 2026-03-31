import api from './api';

export const aiService = {
  generateCaptionVision: async (base64Images = [], tone = 'friendly', partialText = '') => {
    const response = await api.post('/ai/generate-caption-vision', {
      images: base64Images,
      tone,
      partialText,
    });
    return response.data;
  },

  generateCaption: async (partialText = '', imageUrls = [], tone = 'friendly') => {
    const response = await api.post('/ai/generate-caption',
      { imageUrls },
      { params: { partialText, tone } }
    );
    return response.data;
  },

  improveText: async (text, context = 'social media post') => {
    const response = await api.post('/ai/improve-text', null, {
      params: { text, context }
    });
    return response.data;
  },

  suggestReply: async (comment, postContext = '') => {
    const response = await api.post('/ai/suggest-reply', null, {
      params: { comment, postContext }
    });
    return response.data;
  },

  // Il backend restituisce List<String> direttamente
  suggestHashtags: async (content) => {
    const response = await api.post('/ai/suggest-hashtags', null, {
      params: { content }
    });
    // response.data è già un array di stringhe
    return Array.isArray(response.data) ? response.data : [];
  }
};