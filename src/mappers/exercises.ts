import { GetDailyStudentExerciseDto } from "@/dtos/exerciseDto";
import { Exercise, History, MuscleGroupSelect } from "@/types/exercises";
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

