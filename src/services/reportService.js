import api from "./api";

const BASE = "/reports";

export const reportPost = async (postId, reason, notes = "") => {
  try {
    await api.post(BASE, { postId, reason, notes });
    return { success: true };
  } catch (error) {
    if (error.response?.status === 409) return { success: false, alreadyReported: true };
    return { success: false };
  }
};

export const getReports = async (status = null, page = 0, size = 20) => {
  try {
    const params = { page, size };
    if (status) params.status = status;
    const res = await api.get(BASE, { params });
    return { success: true, data: res.data };
  } catch {
    return { success: false, data: null };
  }
};

export const updateReportStatus = async (reportId, status) => {
  try {
    const res = await api.patch(`${BASE}/${reportId}/status`, { status });
    return { success: true, data: res.data };
  } catch {
    return { success: false };
  }
};

export const getPendingCount = async () => {
  try {
    const res = await api.get(`${BASE}/pending/count`);
    return res.data.count;
  } catch {
    return 0;
  }
};