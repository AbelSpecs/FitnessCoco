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
