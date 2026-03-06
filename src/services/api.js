import axios from "axios";
import useAuthStore from "../store/authStore";

const API_BASE_URL = "https://social-media-backend-1hw4.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ============================================
// REQUEST INTERCEPTOR - Aggiunge JWT token
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ============================================
// RESPONSE INTERCEPTOR - Gestisce errori 401
// ============================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      const requestMethod = error.config?.method?.toUpperCase() || "GET";
      const currentPath = window.location.pathname;

      console.log("🔒 401 Unauthorized:", requestMethod, requestUrl);

      // ============================================
      // SKIP COMPLETAMENTE SE È UNA RISORSA STATICA
      // ============================================
      if (
        requestUrl.includes("/uploads/") ||
        requestUrl.includes("cloudinary.com")
      ) {
        console.log("⏩ SKIP - Risorsa statica");
        return Promise.reject(error);
      }

      // ============================================
      // ENDPOINT PUBBLICI GET (NON FARE LOGOUT!)
      // ============================================
      const publicGetEndpoints = [
        "/users",
        "/posts",
        "/comments",
        "/follows", // ✅ AGGIUNTO!
      ];

      const isPublicGetEndpoint =
        requestMethod === "GET" &&
        publicGetEndpoints.some((endpoint) => requestUrl.startsWith(endpoint));

      const isAuthPage =
        currentPath === "/login" || currentPath === "/register";

      const shouldLogout = !isPublicGetEndpoint && !isAuthPage;

      console.log("📋 Is Public GET?", isPublicGetEndpoint);
      console.log("🚪 Should Logout?", shouldLogout);

      if (shouldLogout) {
        console.warn("🚪 Logout forzato");
        useAuthStore.getState().logout();

        if (!isAuthPage) {
          setTimeout(() => {
            window.location.href = "/login";
          }, 100);
        }
      } else {
        console.log("✅ 401 ignorato");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
