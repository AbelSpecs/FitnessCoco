import axios from "axios";
// import api from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getCountries = async () => {
  try {
    const response = await api.get(`/Countries`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los paises", error);
    return null;
  }
};

export const getCities = async (countryId: number) => {
  try {
    const response = await api.get(`/Cities/${countryId}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener las ciudades", error);
    return null;
  }
};
