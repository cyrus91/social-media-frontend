import { useState } from 'react';
import { aiService } from '../services/aiService';
import toast from 'react-hot-toast';

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateCaption = async (partialText, imageUrls, tone) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.generateCaption(partialText, imageUrls, tone);
      return result.suggestion;
    } catch (err) {
      console.error('AI caption generation failed:', err);
      const errorMsg = err.response?.data?.message || 'Errore nella generazione della caption';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const improveText = async (text, context) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.improveText(text, context);
      return result.suggestion;
    } catch (err) {
      console.error('AI text improvement failed:', err);
      const errorMsg = err.response?.data?.message || 'Errore nel miglioramento del testo';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const suggestReply = async (comment, postContext) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.suggestReply(comment, postContext);
      return result.suggestion;
    } catch (err) {
      console.error('AI reply suggestion failed:', err);
      const errorMsg = err.response?.data?.message || 'Errore nella generazione della risposta';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const suggestHashtags = async (content) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.suggestHashtags(content);
      return result.hashtags || [];
    } catch (err) {
      console.error('AI hashtag suggestion failed:', err);
      const errorMsg = err.response?.data?.message || 'Errore nella generazione degli hashtag';
      setError(errorMsg);
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateCaption,
    improveText,
    suggestReply,
    suggestHashtags
  };
};