import { User } from "@/types/user";

export const postUser = (userData: User) => {
  try {
    const data = JSON.stringify(userData);
    localStorage.setItem("userProfile", data);
    console.log("Perfil guardado exitosamente");
  } catch (error) {
    console.error("Error al guardar en localStorage:", error);
  }
};

export const getUser = () => {
  try {
    const userData = localStorage.getItem("userProfile");
    if (!userData) return null;
    return JSON.parse(userData) as User;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    return null;
  }
};

export const cleanUser = () => {
  localStorage.removeItem("userProfile");
};
