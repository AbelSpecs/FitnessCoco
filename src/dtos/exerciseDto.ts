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
  coachId: number;
  studentId: number;
  exerciseId: number;
  scheduledDate: string;
  dailyExerciseSets: DailyExerciseSetsDto[];
  exerciseName?: string;
  muscleGroupName?: string;
  coachNotes?: string;
}

export interface UpdateCompleteDailyStudentExerciseDto {
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
  studentNotes: string;
  isCompleted: boolean;
}

// ExerciseDto
export interface ExerciseCreateDto {
  coachId?: number | null;
  name: string;
  description?: string | null;
  muscleGroupId: number;
  videoUrl?: string | null;
  isCustom: boolean;
}

export interface ExerciseDto {
  exercise: ExerciseCreateDto;
}

export interface ExerciseUpdateDto {
  coachId?: number | null;
  name: string;
  description?: string | null;
  muscleGroupId: number;
  videoUrl?: string | null;
  isCustom: boolean;
}

export interface GetExerciseDto {
  id: number;
  coachId?: number | null;
  name: string;
  description?: string | null;
  muscleGroupId: number;
  muscleGroup: string;
  videoKey?: string | null;
  videoUrl?: string | null;
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
