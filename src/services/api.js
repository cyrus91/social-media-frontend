import axios from "axios";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ============================================
// REQUEST INTERCEPTOR - Aggiunge JWT token
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (!config.headers["Content-Type"])
      config.headers["Content-Type"] = "application/json";
    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================
// REFRESH TOKEN LOGIC
// ============================================
let isRefreshing = false;
let failedQueue = []; // richieste in attesa durante il refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

const forceLogout = () => {
  useAuthStore.getState().logout();
  toast.error("Sessione scaduta. Effettua di nuovo il login.", {
    duration: 4000,
    id: "session-expired", // evita toast duplicati
  });
  setTimeout(() => {
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, 1500); // lascia il tempo al toast di essere letto
};

// ============================================
// RESPONSE INTERCEPTOR - Refresh automatico
// ============================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignora risorse statiche e Cloudinary
    const requestUrl = originalRequest?.url || "";
    if (
      requestUrl.includes("/uploads/") ||
      requestUrl.includes("cloudinary.com")
    ) {
      return Promise.reject(error);
    }

    // Non tentare il refresh se siamo già sull'endpoint di refresh/login
    const isAuthEndpoint =
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem("refreshToken");

      // Nessun refresh token disponibile → logout immediato
      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      // Se c'è già un refresh in corso, metti in coda
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Tenta il refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        const newToken = res.data.accessToken;
        const newRefreshToken = res.data.refreshToken;

        // Salva i nuovi token
        localStorage.setItem("token", newToken);
        if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
        useAuthStore.setState({ token: newToken });

        // Aggiorna header default e sblocca la coda
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        // Riprova la richiesta originale con il nuovo token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh fallito → sessione scaduta, logout
        processQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;