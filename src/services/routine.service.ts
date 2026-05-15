import axios from "axios";
// import api from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getRoutine = async (id: number) => {
  try {
    const response = await api.get(`/Exercises/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    return null;
  }
};

export const getExercises = async (id: number) => {
  try {
    const response = await api.get(`/DailyStudentExercises/student/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    return null;
  }
};
