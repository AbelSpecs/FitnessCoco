import {
  AdjustStreakDto,
  RiskRadarStudentDto,
  StreakHistoryLogDto,
  StreakLeaderboardItemDto,
  StudentStreakDto,
  UseFreezeShieldDto,
  WorkoutCompletedDto,
} from "@/dtos/streakDto";
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
    const { data } = response;

    return data?.data ?? data ?? response.data;
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
export const getCoachRiskRadar = async (
  coachId: number | string,
): Promise<RiskRadarStudentDto[]> => {
  try {
    const response = await api.get(`/Streaks/coach/${coachId}/risk-radar`);
    const { data } = response;

    return data?.data ?? data ?? response.data;
  } catch (error) {
    console.error(`Error al obtener el radar de riesgo del coach ${coachId}`, error);
    throw error;
  }
};

/**
 * Obtiene el historial de logs y eventos de racha de un estudiante.
 * Endpoint: GET /api/v1/Streaks/student/{studentId}/history
 *
 * @param studentId - ID del estudiante
 * @param limit - Cantidad máxima de registros a retornar (por defecto 30)
 * @returns Lista de eventos e historial de racha del alumno
 */
export const getStudentStreakHistory = async (
  studentId: number | string,
  limit: number = 30,
): Promise<StreakHistoryLogDto[]> => {
  try {
    const response = await api.get(`/Streaks/student/${studentId}/history`, {
      params: { limit },
    });
    const { data } = response;

    return data?.data ?? data ?? response.data;
  } catch (error) {
    console.error(`Error al obtener el historial de racha del estudiante ${studentId}`, error);
    throw error;
  }
};

/**
 * Utiliza un escudo de congelación para proteger la racha del estudiante ante inactividad.
 * Endpoint: POST /api/v1/Streaks/student/{studentId}/use-freeze-shield
 *
 * @param studentId - ID del estudiante
 * @param shieldDate - Fecha opcional para la que se aplica el escudo
 * @returns Respuesta de confirmación del uso del escudo
 */
export const useFreezeShield = async (
  studentId: number | string,
  shieldDate?: string,
) => {
  try {
    const payload: UseFreezeShieldDto = shieldDate ? { shieldDate } : {};
    const response = await api.post(`/Streaks/student/${studentId}/use-freeze-shield`, payload);
    const { data } = response;

    return data?.data ?? data ?? response.data;
  } catch (error) {
    console.error(`Error al usar escudo de congelación para el estudiante ${studentId}`, error);
    throw error;
  }
};

/**
 * Obtiene el ranking global de rachas de la plataforma.
 * Endpoint: GET /api/v1/Streaks/leaderboard
 *
 * @param limit - Cantidad máxima de alumnos en el ranking (por defecto 50)
 * @returns Lista del leaderboard global de rachas
 */
export const getGlobalStreakLeaderboard = async (
  limit: number = 50,
): Promise<StreakLeaderboardItemDto[]> => {
  try {
    const response = await api.get("/Streaks/leaderboard", {
      params: { limit },
    });
    const { data } = response;

    return data?.data ?? data ?? response.data;
  } catch (error) {
    console.error("Error al obtener el ranking global de rachas", error);
    throw error;
  }
};

/**
 * Obtiene el ranking (leaderboard) de rachas de los alumnos de un coach.
 * Endpoint: GET /api/v1/Streaks/coach/{coachId}/leaderboard
 *
 * @param coachId - ID del coach
 * @param limit - Cantidad máxima de alumnos en el ranking (por defecto 50)
 * @returns Lista del leaderboard de alumnos del coach
 */
export const getCoachStreakLeaderboard = async (
  coachId: number | string,
  limit: number = 50,
): Promise<StreakLeaderboardItemDto[]> => {
  try {
    const response = await api.get(`/Streaks/coach/${coachId}/leaderboard`, {
      params: { limit },
    });
    const { data } = response;

    return data?.data ?? data ?? response.data;
  } catch (error) {
    console.error(`Error al obtener el ranking de alumnos del coach ${coachId}`, error);
    throw error;
  }
};

/**
 * Permite ajustar manualmente la racha y escudos de un alumno (uso por Coach o Administrador).
 * Endpoint: POST /api/v1/Streaks/student/{studentId}/adjust
 *
 * @param studentId - ID del estudiante
 * @param adjustData - Valores a ajustar (currentStreak, longestStreak, freezeShields, reason)
 * @returns Respuesta con la información de racha actualizada
 */
export const adjustStudentStreak = async (
  studentId: number | string,
  adjustData: AdjustStreakDto,
) => {
  try {
    const response = await api.post(`/Streaks/student/${studentId}/adjust`, adjustData);
    const { data } = response;

    return data?.data ?? data ?? response.data;
  } catch (error) {
    console.error(`Error al ajustar la racha del estudiante ${studentId}`, error);
    throw error;
  }
};


