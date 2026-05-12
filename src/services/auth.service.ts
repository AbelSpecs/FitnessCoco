import { LoginCredentials, RegisterCredentials } from "@/types/auth";
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
  const response = await api.post("/Users/RegisterUser", credentials);
  const { data } = response.data;

  return data;
};

export const login = async (credentials: LoginCredentials) => {
  const response = await api.post("/Users/Login", credentials);
  const { data } = response.data;

  return data;
};
