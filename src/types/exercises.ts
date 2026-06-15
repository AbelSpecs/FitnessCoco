// Type Exercise for Exercises View (Coach)

export interface DailyExerciseSets {
  id: number;
  setNumber: string;
  targetReps: string;
  targetWeight: string;
  restTime: string;
  actualReps: number;
  actualWeight: number;
  isAchieved: boolean;
}

export interface Exercise {
  dailyExerciseId: number;
  exerciseId: number;
  coachId: number;
  studentId: number;
  exerciseName: string;
  description?: string;
  muscleGroupName: string;
  coachNotes: string;
  studentNotes: string;
  isCompleted: boolean;
  scheduledDate: string;
  day: string;
  short: string;
  dailyExerciseSets: DailyExerciseSets[];
}

export interface DailyExerciseSetsForm {
  id: number | string;
  setNumber: string;
  targetReps: string;
  targetWeight: string;
  restTime: string;
  actualReps?: number;
  actualWeight?: number;
  isAchieved: boolean;
}

export interface ExerciseForm {
  exerciseId: number;
  exerciseName: string;
  muscleGroupId: number;
  muscleGroupName: string;
  description?: string;
  coachNotes?: string;
  studentNotes?: string;
  scheduledDate: string;
  dailyExerciseSets: DailyExerciseSetsForm[];
}

export interface MuscleGroupSelect {
  id: number;
  name: string;
}

export interface ExerciseSelect {
  id: number;
  name: string;
}

// interface for the dates calculated in the routine page
export interface CompleteDate {
  day: string;
  short: string;
  original: string;
}

export interface NewExercise {
  name: string;
  muscleGroupId: number;
}

// (Client)
export interface DayRoutine {
  id: number;
  name: string;
  short: string;
  scheduledDate: string;
  rest: boolean;
  muscleGroupName: string;
  estimated: string;
  exercises: Exercise[];
}
