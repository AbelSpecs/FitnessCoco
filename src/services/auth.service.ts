import { CoachStudent, LoginCredentials, RegisterCredentials } from "@/types/auth";
import axios from "axios";
// import api from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const register = async (credentials: RegisterCredentials) => {
  try {
    const response = await api.post("/Users/RegisterUser", credentials);

    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al registrar", error);
    throw error;
  }
};

export const associateCoach = async (info: CoachStudent) => {
  try {
    const response = await api.post("/CoachStudents", info);

    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al asociar con el coach", error);
    throw error;
  }
};

export const login = async (credentials: LoginCredentials) => {
  try {
    const response = await api.post("/Users/Login", credentials);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al hacer login", error);
    throw error;
  }
};
