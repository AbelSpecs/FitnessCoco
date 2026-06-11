// DailyStundentExerciseDto

export interface DailyStudentExerciseDto {
  assign: {
    coachId: number;
    studentId: number;
    exerciseId: number;
    scheduledDate: string;
    dailyExerciseSets: DailyExerciseSetsDto[];
    exerciseName?: string;
    muscleGroupName?: string;
    coachNotes?: string;
  };
}

export interface UpdateDailyStudentExerciseDto {
  isCompleted: boolean;
  studentNotes: string;
}

export interface GetDailyStudentExerciseDto {
  id: number;
  coachId: number;
  studentId: number;
  exerciseId: number;
  scheduledDate: string;
  dailyExerciseSets: GetDailyExerciseSetsDto[];
  exerciseName: string;
  muscleGroupName: string;
  coachNotes: string;
}

// ExerciseDto
export interface ExerciseDto {
  exercise: {
    coachId: number;
    name: string;
    description: string;
    muscleGroupId: number;
    videoUrl?: string;
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

// DailyExercisesSetsDto
export interface DailyExerciseSetsDto {
  // set: {
  id?: number;
  dailyStudentExerciseId?: number;
  setNumber: number;
  targetReps: number;
  targetWeight: number;
  restTime: string;
  actualReps?: number;
  actualWeight?: number;
  isAchieved: boolean;
  // };
}

export interface GetDailyExerciseSetsDto {
  id: number;
  dailyStudentExerciseId: number;
  setNumber: string;
  targetReps: string;
  targetWeight: string;
  restTime: string;
  actualReps: number;
  actualWeight: number;
  isAchieved: boolean;
}

export interface GetMuscleGroupDto {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}
