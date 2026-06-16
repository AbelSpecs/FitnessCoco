import { GetDailyStudentExerciseDto } from "@/dtos/exerciseDto";
import { Exercise } from "@/types/exercises";
import { determineDate } from "@/utils/determineDate";

export const exercisesMapper = (apiRoutines: GetDailyStudentExerciseDto[]) => {
  const routinesToMap = apiRoutines;

  return routinesToMap.map((item: GetDailyStudentExerciseDto) => {
    const completeDay = determineDate(item.scheduledDate).day;
    const shortDay = determineDate(item.scheduledDate).short;

    const exerciseMapped: Exercise = {
      dailyExerciseId: item.id,
      exerciseId: item.exerciseId,
      coachId: item.coachId,
      studentId: item.studentId,
      exerciseName: item.exerciseName,
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
