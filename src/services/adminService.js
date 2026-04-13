import api from "./api";

const BASE = "/admin";

export const fetchAdminStats = async () => {
  try {
    const res = await api.get(`${BASE}/stats`);
    return { success: true, data: res.data };
  } catch {
    return { success: false, data: null };
  }
};

export const fetchAdminUsers = async (page = 0, size = 50) => {
  try {
    const res = await api.get(`${BASE}/users`, { params: { page, size } });
    return { success: true, data: res.data };
  } catch {
    return { success: false, data: null };
  }
};

export const fetchAdminPosts = async (page = 0, size = 50) => {
  try {
    const res = await api.get(`${BASE}/posts`, { params: { page, size } });
    return { success: true, data: res.data };
  } catch {
    return { success: false, data: null };
  }
};

export const toggleBanUser = async (userId) => {
  try {
    const res = await api.put(`${BASE}/users/${userId}/ban`);
    return { success: true, data: res.data };
  } catch {
    return { success: false };
  }
};

export const changeUserRole = async (userId, role) => {
  try {
    const res = await api.put(`${BASE}/users/${userId}/role`, null, { params: { role } });
    return { success: true, data: res.data };
  } catch {
    return { success: false };
  }
};

export const deleteAdminUser = async (userId) => {
  try {
    await api.delete(`${BASE}/users/${userId}`);
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const deleteAdminPost = async (postId) => {
  try {
    await api.delete(`${BASE}/posts/${postId}`);
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const deleteAdminComment = async (commentId) => {
  try {
    await api.delete(`${BASE}/comments/${commentId}`);
    return { success: true };
  } catch {
    return { success: false };
  }
};