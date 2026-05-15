import { set } from "react-hook-form";
import { Auth, UserAuth } from "@/types/auth";
import { User } from "@/types/user";
import { create } from "zustand";

export const useAuthStore = create<Auth>((set) => ({
  user: JSON.parse(localStorage.getItem("pyrosfit_user")!),
  token: JSON.parse(localStorage.getItem("pyrosfit_token")!),

  setAuth: (user: UserAuth, token: string) => {
    localStorage.setItem("pyrosfit_token", JSON.stringify(token));
    localStorage.setItem("pyrosfit_user", JSON.stringify(user));
    set({ user, token });
  },

  getAuth: () => {
    JSON.parse(localStorage.getItem("pyrosfit_token")!);
  },

  logout: () => {
    localStorage.removeItem("pyrosfit_token");
    localStorage.removeItem("pyrosfit_user");
    set({ user: null, token: null });
  },
}));
