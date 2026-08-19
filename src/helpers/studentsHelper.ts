import { CoachStudentsDto, StudentDto } from "@/dtos/userDto";
import { GetDailyStudentExerciseDto } from "@/dtos/exerciseDto";

export const countActiveClients = (studentsData: CoachStudentsDto[]) => {
  return studentsData.length;
};

export const countPorcentageStudents = (
  studentsListData: StudentDto[],
  studentsData: CoachStudentsDto[],
) => {
  const porcentage = (studentsData.length / studentsListData.length) * 100;
  return porcentage;
};

export const calculateWeeklyStreak = (exercises: GetDailyStudentExerciseDto[] = []) => {
  const completedDays = new Set<string>();
  exercises.forEach((ex) => {
    if (ex.isCompleted) {
      completedDays.add(ex.scheduledDate);
    }
  });
  return completedDays.size;
};

// export const calculateWeeklyVolume = (exercises: GetDailyStudentExerciseDto[] = []) => {
//   let totalVolume = 0;
//   exercises.forEach((ex) => {
//     if (ex.isCompleted && ex.dailyExerciseSets) {
//       ex.dailyExerciseSets.forEach((set) => {
//         if (set.isAchieved) {
//           totalVolume += (Number(set.actualWeight) || 0) * (Number(set.actualReps) || 0);
//         }
//       });
//     }
//   });
//   return totalVolume;
// };

export const calculateMaxWeightLifted = (exercises: GetDailyStudentExerciseDto[] = []): number => {
  let maxWeight = 0;

  exercises.forEach((ex) => {
    if (ex.dailyExerciseSets && ex.dailyExerciseSets.length > 0) {
      ex.dailyExerciseSets.forEach((set) => {
        const actualWeight = Number(set.actualWeight) || 0;

        if (actualWeight > maxWeight) {
          maxWeight = actualWeight;
        }
      });
    }
  });

  return maxWeight;
};

export const calculateRoutineDurationInSeconds = (
  exercises: GetDailyStudentExerciseDto[] = [],
): number => {
  let totalSeconds = 0;
  exercises.forEach((ex) => {
    if (ex.dailyExerciseSets) {
      ex.dailyExerciseSets.forEach((set) => {
        // Asume 45 segundos de ejecución por set
        totalSeconds += 45;
        if (set.restTime) {
          const restStr = String(set.restTime).trim();
          if (restStr.includes(":")) {
            const parts = restStr.split(":").map(Number);
            if (parts.length === 3) {
              totalSeconds += (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
            } else if (parts.length === 2) {
              totalSeconds += (parts[0] || 0) * 60 + (parts[1] || 0);
            }
          } else {
            const num = Number(restStr);
            if (!isNaN(num) && num > 0) {
              totalSeconds += num;
            }
          }
        }
      });
    }
  });
  return totalSeconds > 0 ? totalSeconds : 1;
};

export const calculateRoutineDurationInMin = (exercises: GetDailyStudentExerciseDto[] = []) => {
  const seconds = calculateRoutineDurationInSeconds(exercises);
  return Math.max(1, Math.round(seconds / 60));
};

/**
 * Formatea una duración en segundos para diferenciar segundos (s), minutos (min) y horas (h).
 * Ejemplos:
 * - 1 -> "1 s"
 * - 45 -> "45 s"
 * - 120 -> "2 min"
 * - 150 -> "2 min 30 s"
 * - 3600 -> "1 h"
 * - 3660 -> "1 h 1 min"
 */
export const formatDuration = (totalSeconds: number = 1): string => {
  if (!totalSeconds || totalSeconds <= 0) return "1 s";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  }

  return `${seconds} s`;
};

