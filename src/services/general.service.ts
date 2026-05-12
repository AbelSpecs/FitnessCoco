import axios from "axios";

const API_URL = "https://api.pyrosfit.com/api/v1/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getCountries = async () => {
  try {
    const response = await api.get(`Countries`);
    const { data } = response.data;
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error al obtener los paises", error);
    return null;
  }
};

export const getCities = async (countryId: number) => {
  try {
    const response = await api.get(`Cities/${countryId}`);
    const { data } = response.data;
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error al obtener las ciudades", error);
    return null;
  }
};
