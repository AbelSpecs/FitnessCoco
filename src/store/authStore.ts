import { Auth } from "@/types/auth";
import { create } from "zustand";

export const useAuthStore = create<Auth>((set) => ({
  // 1. Iniciamos en NULL para evitar la "Mock Data" fantasma
  user: null,
  token: JSON.parse(localStorage.getItem("pyrosfit_token")!).token, // Intentamos recuperar el token al arrancar
  isLoading: true,

  // 2. Acción para el Login exitoso
  setAuth: (data) => {
    localStorage.setItem("fityei_user", JSON.stringify(data));
    set({ user, token, isLoading: false });
  },

  // 3. Acción para actualizar datos (como en el Perfil)
  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),

  // 4. Limpiar sesión (Logout)
  logout: () => {
    localStorage.removeItem("fityei_user");
    set({ user: null, token: null, isLoading: false });
  },

  setLoading: (status) => set({ isLoading: status }),
}));
