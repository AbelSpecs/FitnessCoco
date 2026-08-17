import { GetDailyStudentExerciseDto } from "@/dtos/exerciseDto";
import { RiskRadarStudentDto, StreakHistoryLogDto } from "@/dtos/streakDto";
import { Exercise, History, MuscleGroupSelect } from "@/types/exercises";
import { StudentInfo } from "@/types/user";
import { determineDate } from "@/utils/determineDate";
import { calculateRoutineDurationInMin } from "@/helpers/studentsHelper";

export const exercisesMapper = (
  apiRoutines: GetDailyStudentExerciseDto[],
  muscleGroups?: MuscleGroupSelect[],
) => {
  const routinesToMap = apiRoutines;

  return routinesToMap.map((item: GetDailyStudentExerciseDto) => {
    const completeDay = determineDate(item.scheduledDate).day;
    const shortDay = determineDate(item.scheduledDate).short;
    const muscleGroupId = muscleGroups
      ? muscleGroups.find((m) => m.name === item.muscleGroupName)?.id
      : 0;

    const exerciseMapped: Exercise = {
      dailyExerciseId: item.id,
      exerciseId: item.exerciseId,
      coachId: item.coachId,
      studentId: item.studentId,
      exerciseName: item.exerciseName,
      muscleGroupId: muscleGroupId,
      muscleGroupName: item.muscleGroupName,
      coachNotes: item.coachNotes,
      studentNotes: item.studentNotes,
      isCompleted: item.isCompleted,
      scheduledDate: item.scheduledDate,
      day: completeDay,
      short: shortDay,
      dailyExerciseSets: item.dailyExerciseSets.map((set) => set),
    };

    return exerciseMapped;
  });
};

/**
 * Transforma un arreglo de ejercicios diarios obtenidos del backend (`historyExercises`)
 * agrupándolos por fecha de programación (`scheduledDate`) para generar el historial de actividad reciente.
 *
 * Cada elemento del historial resultante contiene:
 * - `name`: Los nombres de los grupos musculares trabajados (unidos por '&') o "Rutina" como fallback.
 * - `date`: La fecha asignada al entrenamiento en formato YYYY-MM-DD.
 * - `min`: La duración estimada en minutos calculada a partir de los sets de ejercicios.
 *
 * @param historyExercises Lista de DTOs de ejercicios diarios asignados al estudiante.
 * @returns Un arreglo de objetos tipo `History` formateado para el estado del Dashboard.
 */
export const historyExercisesMapper = (
  historyExercises: GetDailyStudentExerciseDto[],
): History[] => {
  if (!historyExercises || historyExercises.length === 0) {
    return [];
  }

  const grouped: Record<string, GetDailyStudentExerciseDto[]> = {};

  historyExercises.forEach((ex: GetDailyStudentExerciseDto) => {
    const dateKey = ex.scheduledDate;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(ex);
  });

  return Object.entries(grouped).map(([dateStr, exercises]) => {
    const muscleGroups = Array.from(
      new Set(exercises.map((e) => e.muscleGroupName).filter(Boolean)),
    );
    const name = muscleGroups.length > 0 ? muscleGroups.join(" & ") : "Rutina";
    const min = calculateRoutineDurationInMin(exercises as any) || 45;

    return {
      name,
      date: dateStr,
      min,
    };
  });
};

/**
 * Transforma un arreglo de logs del historial de racha (`StreakHistoryLogDto`) obtenidos de la API
 * en objetos tipo `History` compatibles con la vista del Dashboard.
 *
 * @param streakHistoryLogs Lista de DTOs del historial de racha
 * @returns Arreglo de objetos `History` ({ name, date, min })
 */
export const streakHistoryMapper = (streakHistoryLogs: StreakHistoryLogDto[]): History[] => {
  if (!streakHistoryLogs || streakHistoryLogs.length === 0) {
    return [];
  }

  return streakHistoryLogs.map((log) => {
    const rawDate = log.activityDate || log.createdAt || "";
    const formattedDate = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;

    return {
      name: log.activityTypeName || "Entrenamiento",
      date: formattedDate,
      min: 45,
    };
  });
};

/**
 * Combina y mapea los logs del historial de racha (`streakHistoryLogs`)
 * y los ejercicios completados (`lastCompletedExercises`) en una única lista unificada de `History[]`.
 *
 * @param streakHistoryLogs Lista de DTOs del historial de racha
 * @param lastCompletedExercises Lista de DTOs de ejercicios completados recientemente
 * @returns Lista combinada y sin duplicados de actividades recientes
 */
export const combinedHistoryMapper = (
  streakHistoryLogs?: StreakHistoryLogDto[],
  lastCompletedExercises?: GetDailyStudentExerciseDto[],
): History[] => {
  const mappedStreakLogs = streakHistoryLogs ? streakHistoryMapper(streakHistoryLogs) : [];
  const mappedExercises = lastCompletedExercises ? historyExercisesMapper(lastCompletedExercises) : [];

  const combined = [...mappedStreakLogs, ...mappedExercises];

  // Filtrar duplicados con la misma fecha y nombre de actividad
  return combined.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.date === item.date && t.name === item.name),
  );
};

/**
 * Mapea los datos del radar de riesgo de abandono del coach (`RiskRadarStudentDto[]`)
 * a la estructura de visualización `StudentInfo[]` para el Churn Risk Radar.
 *
 * @param riskRadarList Lista de DTOs del radar de riesgo
 * @returns Lista de alumnos con formato de iniciales, riesgo y texto de inactividad
 */
export const riskRadarStudentsMapper = (
  riskRadarList?: RiskRadarStudentDto[],
): StudentInfo[] => {
  if (!riskRadarList || riskRadarList.length === 0) {
    return [];
  }

  return riskRadarList.map((item) => {
    const studentName = item.studentName || `Alumno #${item.studentId}`;
    const nameParts = studentName.trim().split(/\s+/);
    const initials =
      nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : studentName.slice(0, 2).toUpperCase();

    const daysInactive = item.daysInactive ?? 0;
    let lastWorkout = "";
    if (daysInactive === 0) {
      lastWorkout = "Hoy";
    } else if (daysInactive === 1) {
      lastWorkout = "Ayer";
    } else if (daysInactive >= 999) {
      lastWorkout = "Sin actividad";
    } else {
      lastWorkout = `Hace ${daysInactive} días`;
    }

    let risk: "high" | "medium" | "low" = "low";
    if (item.riskLevel === 2) {
      risk = "high";
    } else if (item.riskLevel === 1) {
      risk = "medium";
    } else {
      risk = "low";
    }

    return {
      studentId: item.studentId.toString(),
      name: studentName,
      initials,
      streak: item.currentStreak ?? 0,
      lastWorkout,
      inactivity: daysInactive >= 999 ? 30 : daysInactive,
      risk,
    };
  });
};

