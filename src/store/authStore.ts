import { set } from "react-hook-form";
import { Auth, UserAuth } from "@/types/auth";
import { User } from "@/types/user";
import { create } from "zustand";

export const useAuthStore = create<Auth>((set) => ({
  // 1. Iniciamos en NULL para evitar la "Mock Data" fantasma
  user: JSON.parse(localStorage.getItem("pyrosfit_user")!),
  token: JSON.parse(localStorage.getItem("pyrosfit_token")!), // Intentamos recuperar el token al arrancar
  isLoading: true,

  // 2. Acción para el Login exitoso
  setAuth: (user: UserAuth, token: string) => {
    localStorage.setItem("pyrosfit_token", JSON.stringify(token));
    localStorage.setItem("pyrosfit_user", JSON.stringify(user));
    set({ user, token, isLoading: false });
  },

  // 3. Acción para actualizar datos (como en el Perfil)
  //   updateUser: (userData) =>
  //     set((state) => ({
  //       user: state.user ? { ...state.user, ...userData } : null,
  //     })),

  logout: () => {
    localStorage.removeItem("pyrosfit_token");
    localStorage.removeItem("pyrosfit_user");
    set({ user: null, token: null, isLoading: false });
  },

  setLoading: (status) => set({ isLoading: status }),
}));
