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

export const updateCoach = async (coachData: Partial<Coach>) => {
  try {
    const response = await api.put(`/Coaches/${coachData.id}`, {
      id: coachData.id,
      bio: coachData.bio,
      certifications: coachData.certifications,
      yearsOfExperience: coachData.experienceYears,
      profilePicture: coachData.profilePicture,
      bannerPicture: coachData.bannerPicture || coachData.bannerUrl,
    });
    const { data } = response.data;
    return data;
  } catch (error) {
    console.error("Error al actualizar el perfil del coach", error);
    throw error;
  }
};
