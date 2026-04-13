import api from "./api";

const BASE = "/polls";

export const getPollByPost = async (postId) => {
  try {
    const res = await api.get(`${BASE}/post/${postId}`);
    return { success: true, data: res.data };
  } catch {
    return { success: false, data: null };
  }
};

export const votePoll = async (pollId, optionId) => {
  try {
    const res = await api.post(`${BASE}/${pollId}/vote`, { optionId });
    return { success: true, data: res.data };
  } catch (error) {
    if (error.response?.status === 409)
      return { success: false, alreadyVoted: true };
    return { success: false };
  }
};

export const createPollForPost = async (postId, pollData) => {
  try {
    const res = await api.post(`${BASE}/post/${postId}`, pollData);
    return { success: true, data: res.data };
  } catch {
    return { success: false };
  }
};