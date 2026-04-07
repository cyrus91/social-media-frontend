import api from "./api";

const BASE = "/bookmarks";

export const toggleBookmark = async (postId) => {
  try {
    const res = await api.post(`${BASE}/${postId}/toggle`);
    return { success: true, bookmarked: res.data.bookmarked };
  } catch {
    return { success: false };
  }
};

export const getMyBookmarks = async (page = 0, size = 10) => {
  try {
    const res = await api.get(BASE, { params: { page, size } });
    return { success: true, data: res.data };
  } catch {
    return { success: false, data: null };
  }
};