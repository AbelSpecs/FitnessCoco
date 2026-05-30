export interface DailyStudentExerciseDto {
  assign: {
    coachId: number;
    studentId: number;
    exerciseId: number;
    scheduledDate: string;
    sets: number;
    reps: string;
    weight: number;
    restTime: string;
    coachNotes: string;
  };
}

export interface GetDailyStudentExerciseDto {
  coachId: number;
  studentId: number;
  exerciseId: number;
  scheduledDate: string;
  sets: number;
  reps: string;
  weight: number;
  restTime: string;
  coachNotes: string;
}

export interface ExerciseDto {
  exercise: {
    coachId: number;
    name: string;
    description: string;
    muscleGroup: string;
    videoUrl: string;
    isCustom: boolean;
  };
}

export interface GetExerciseDto {
  id: number;
  coachId: number;
  name: string;
  description: string;
  muscleGroup: string;
  videoUrl: string;
  isCustom: boolean;
}
