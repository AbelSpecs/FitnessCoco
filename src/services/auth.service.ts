import {
  CoachStudent,
  ConfirmEmailPayload,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordPayload,
} from "@/types/auth";
import api from "./api";

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

export const confirmEmail = async (payload: ConfirmEmailPayload) => {
  try {
    const code = payload.code || payload.token || "";
    const response = await api.post("/Users/ConfirmEmail", {
      code,
      token: code,
      userId: payload.userId ? Number(payload.userId) : undefined,
    });

    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("Error al confirmar correo", error);
    throw error;
  }
};

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  try {
    const response = await api.post("/Users/ForgotPassword", {
      email: payload.email.trim(),
    });

    return response.data;
  } catch (error) {
    console.error("Error al solicitar recuperación de contraseña:", error);
    throw error;
  }
};

export const resetPassword = async (payload: ResetPasswordPayload) => {
  try {
    const code = payload.code || payload.token || "";
    const response = await api.post("/Users/ResetPassword", {
      code,
      token: code,
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword ?? payload.newPassword,
      ...(payload.userId ? { userId: Number(payload.userId) } : {}),
    });

    return response.data;
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    throw error;
  }
};

