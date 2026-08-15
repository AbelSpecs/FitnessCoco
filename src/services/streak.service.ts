import { RiskRadarStudentDto, StudentStreakDto, WorkoutCompletedDto } from "@/dtos/streakDto";
import api from "./api";

/**
 * Obtiene el estado actual de la racha (streak) y escudos congeladores de un estudiante.
 * Endpoint: GET /api/v1/Streaks/student/{studentId}
 *
 * @param studentId - ID del estudiante
 * @returns Datos del estado de la racha del alumno
 */
export const getStudentStreak = async (studentId: number | string): Promise<StudentStreakDto> => {
  try {
    const response = await api.get(`/Streaks/student/${studentId}`);
    const { data } = response;

    return data?.data ?? data ?? response.data;
  } catch (error) {
    console.error(`Error al obtener la racha del estudiante ${studentId}`, error);
    throw error;
  }
};


/**
 * Registra un entrenamiento completado para calcular y actualizar la racha (streak) del estudiante.
 * Endpoint: POST /api/v1/Streaks/workout-completed
 *
 * @param workoutData - Datos del entrenamiento completado
 * @returns Respuesta con la información actualizada de la racha
 */
export const postWorkoutCompleted = async (workoutData: WorkoutCompletedDto) => {
  try {
    const response = await api.post("/Streaks/workout-completed", workoutData);
    const { data } = response.data;

    return data ?? response.data;
  } catch (error) {
    console.error("Error al registrar entrenamiento completado", error);
    throw error;
  }
};

/**
 * Obtiene el radar de riesgo de pérdida de racha para los clientes de un entrenador.
 * Endpoint: GET /api/v1/Streaks/coach/{coachId}/risk-radar
 *
 * @param coachId - ID del entrenador (coach)
 * @returns Datos del radar de riesgo para los clientes del coach
 */
export const getCoachRiskRadar = async (coachId: number | string): Promise<RiskRadarStudentDto> => {
  try {
    const response = await api.get(`/Streaks/coach/${coachId}/risk-radar`);
    const { data } = response;

    return data;
  } catch (error) {
    console.error(`Error al obtener el radar de riesgo del coach ${coachId}`, error);
    throw error;
  }
};
