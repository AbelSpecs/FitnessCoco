import { Coach, Student, User } from "@/types/user";

import api from "./api";

export const createStudent = async (studentData: Student) => {
  try {
    const response = await api.post("/Students", { student: studentData });

    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al crear el perfil del cliente", error);
    throw error;
  }
};

export const getUserDetails = async (id: number) => {
  try {
    const response = await api.get(`/Users/${id}/details`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    throw error;
  }
};

export const getUser = async (id: number) => {
  try {
    const response = await api.get(`/Users/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    throw error;
  }
};

export const updateProfilePictures = async (
  userId: number,
  payload: { profilePicture?: string | null; bannerPicture?: string | null },
) => {
  try {
    const response = await api.put(`/Users/${userId}/profilePictures`, {
      userId,
      profilePicture: payload.profilePicture ?? null,
      bannerPicture: payload.bannerPicture ?? null,
    });

    const { data } = response.data;
    return data;
  } catch (error) {
    console.error("Error al actualizar fotos de perfil/banner del usuario", error);
    throw error;
  }
};
