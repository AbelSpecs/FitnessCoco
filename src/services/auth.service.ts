import { LoginCredentials, RegisterCredentials } from "@/types/auth";
import axios from "axios";

const API_URL = "https://api.pyrosfit.com/api/v1/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const register = async (credentials: RegisterCredentials) => {
  const response = await api.post("Users/RegisterUser", credentials);
  const { data } = response.data;

  console.log(response);

  return response.data;
};

export const login = async (credentials: LoginCredentials) => {
  const response = await api.post("Users/Login", credentials);
  const { data } = response.data;

  return data;
};

export const logout = () => {
  localStorage.removeItem("pyrosfit_token");
};
