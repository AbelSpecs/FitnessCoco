import { get } from "http";
import { Coach, Student, User } from "@/types/user";

import axios from "axios";
// import api from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createStudent = async (studentData: Student) => {
  try {
    const response = await api.post("/Students", studentData);

    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al crear el perfil del cliente", error);
    return null;
  }
};

export const updateStudent = async (userData: User) => {
  try {
    const {
      id,
      firstName,
      lastName,
      gender,
      age,
      streak,
      planType,
      parqCompleted,
      parqValidUntil,
      coach,
      isStudent,
      ...dataToSend
    } = userData;

    console.log(dataToSend);

    const newDataToSend = { id: userData.student?.id, ...dataToSend };
    console.log(newDataToSend);

    const response = await api.put(`/Students/${userData.student?.id}`, newDataToSend);

    return response;
  } catch (error) {
    console.error("Error al guardar:", error);
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

export const getStudentById = async (id: number) => {
  try {
    const response = await api.get(`Students/${id}`);
    const { data } = response.data;

    if (!data) return null;

    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
  }
};

export const getStudents = async () => {
  try {
    const response = await api.get(`/Students`);
    const { data } = response.data;

    if (!data) return null;

    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    return null;
  }
};
