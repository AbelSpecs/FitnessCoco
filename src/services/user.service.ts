import { User } from "@/types/user";

import axios from "axios";
// import api from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const updateUser = async (userData: User) => {
  try {
    const { id, firstName, age, streak, parqCompleted, planType, parqValidUntil, ...dataToSend } =
      userData;

    const newDataToSend = { id: userData.student?.id, student: { userId: id, ...dataToSend } };
    const response = await api.put(`/Students/${userData.student?.id}`, newDataToSend);

    return response;
  } catch (error) {
    console.error("Error al guardar en localStorage:", error);
  }
};

export const getUserDetails = async (id: number) => {
  try {
    const response = await api.get(`/Users/${id}/details`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    return null;
  }
};

export const getUser = async (id: number) => {
  try {
    const response = await api.get(`/Users/${id}`);
    const { data } = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    return null;
  }
};

export const getStudent = async (id: number) => {
  try {
    const response = await api.get(`/Students/user/${id}`);
    const { data } = response.data;

    if (!data) return null;

    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    return null;
  }
};

export const getCoach = async (id: number) => {
  const response = await api.get(`/Coaches/user/${id}`);

  return response.data;
};

export const getQr = async (id: number) => {
  const response = await api.get(`/Qrs/GenerateQr/${id}`);

  return response.data;
};
