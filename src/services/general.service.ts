import api from "./api";

export const getCountries = async () => {
  try {
    const response = await api.get(`/Countries`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los paises", error);
    throw error;
  }
};

export const getCities = async (countryId: number) => {
  try {
    const response = await api.get(`/Cities/${countryId}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener las ciudades", error);
    throw error;
  }
};

export const getQr = async (id: number) => {
  try {
    const response = await api.get(`/Qrs/GenerateQr/${id}`);

    return response.data;
  } catch (error) {
    console.error("Error al obtener el qr", error);
    throw error;
  }
};
