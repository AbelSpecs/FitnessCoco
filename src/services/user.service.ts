import { User } from "@/types/user";

import axios from "axios";

const API_URL = "http://localhost:5221/api/v1/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// export const postUser = (userData: User) => {
//   try {
//     const data = JSON.stringify(userData);
//     localStorage.setItem("userProfile", data);
//     console.log("Perfil guardado exitosamente");
//   } catch (error) {
//     console.error("Error al guardar en localStorage:", error);
//   }
// };

export const updateUser = async (userData: User) => {
  try {
    const {
      id,
      firstName,
      age,
      streak,
      parqCompleted,
      planType,
      parqValidUntil,
      studentId,
      coachId,
      ...dataToSend
    } = userData;

    const newDataToSend = { id: studentId, student: { userId: id, ...dataToSend } };
    const response = await api.put(`Students/${studentId}`, newDataToSend);

    console.log(response);
    return response;
  } catch (error) {
    console.error("Error al guardar en localStorage:", error);
  }
};

// export const getUser = () => {
//   try {
//     const userData = localStorage.getItem("userProfile");
//     if (!userData) return null;
//     return JSON.parse(userData) as User;
//   } catch (error) {
//     console.error("Error al obtener el perfil del usuario", error);
//     return null;
//   }
// };

export const getFinalUser = async (id: number) => {
  try {
    const response = await api.get(`Users/${id}/details`);
    const { data } = response.data;
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    return null;
  }
};

export const getUser = async (id: number) => {
  try {
    const response = await api.get(`Users/${id}`);
    const { data } = response.data;
    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    return null;
  }
};

export const getStudent = async (id: number) => {
  try {
    const response = await api.get(`Students/user/${id}`);
    const { data } = response.data;
    console.log(response);
    return data;
  } catch (error) {
    console.error("Error al obtener el perfil del usuario", error);
    return null;
  }
};

export const getCoach = async (id: number) => {
  const response = await api.get(`Coaches/user/${id}`);

  console.log(response);

  return response.data;
};

export const getQr = async (id: number) => {
  const response = await api.get(`Qrs/GenerateQr/${id}`);
  console.log(response);

  return response.data;
};

export const cleanUser = () => {
  localStorage.removeItem("userProfile");
};
