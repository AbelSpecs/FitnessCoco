import { Coach, Student, User } from "@/types/user";

import api from "./api";

export const createCoach = async (coachData: Coach) => {
  try {
    const response = await api.post("/Coaches", coachData);

    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al crear el perfil del coach", error);
    throw error;
  }
};

export const getCoach = async (id: number) => {
  try {
    const response = await api.get(`/Coaches/user/${id}`);
    const { data } = response.data;
    return data;
  } catch (error) {
    console.error("Error al traer el perfil del coach", error);
    throw error;
  }
};

export const getCoachStudents = async (coachId: number) => {
  try {
    const response = await api.get(`/Coaches/studentsList/${coachId}`);
    const { data } = response.data;

    return data.students;
  } catch (error) {
    console.error("Error al traer los clientes del coach", error);
    throw error;
  }
};
