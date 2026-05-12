import axios from "axios";
import { useAuthStore } from "../store/authStore";
// Obtenemos la URL base desde las variables de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para peticiones (Inyectar el Token)
api.interceptors.request.use(
  (config) => {
    const isPublicRoute = config.url?.includes("login") || config.url?.includes("register");
    // Obtenemos el token directamente del store de Zustand
    if (!isPublicRoute) {
      const token = useAuthStore.getState().token || localStorage.getItem("pyrosfit_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
// Interceptor para respuestas (Manejo de errores globales)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si el token expira, cerramos sesión automáticamente
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
export default api;
