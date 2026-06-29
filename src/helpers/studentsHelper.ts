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

export const calculateWeeklyVolume = (exercises: GetDailyStudentExerciseDto[] = []) => {
  let totalVolume = 0;
  exercises.forEach((ex) => {
    if (ex.isCompleted && ex.dailyExerciseSets) {
      ex.dailyExerciseSets.forEach((set) => {
        if (set.isAchieved) {
          totalVolume += (Number(set.actualWeight) || 0) * (Number(set.actualReps) || 0);
        }
      });
    }
  });
  return totalVolume;
};

export const calculateRoutineDurationInMin = (exercises: GetDailyStudentExerciseDto[] = []) => {
  let totalSeconds = 0;
  exercises.forEach((ex) => {
    if (ex.dailyExerciseSets) {
      ex.dailyExerciseSets.forEach((set) => {
        // Asume 45 segundos de ejecución por set (45s)
        totalSeconds += 45;

        if (set.restTime) {
          const parts = set.restTime.split(":").map(Number);
          if (parts.length === 3) {
            totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
          } else if (parts.length === 2) {
            totalSeconds += parts[0] * 60 + parts[1];
          }
        }
      });
    }
  });
  return Math.round(totalSeconds / 60);
};
