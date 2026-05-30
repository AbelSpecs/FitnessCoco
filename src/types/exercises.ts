export interface Exercise {
  id: number;
  coachId?: number;
  exerciseId: number;
  name?: string;
  description?: string;
  muscle?: string;
  videoUrl?: string;
  isCustom?: boolean;
  scheduledDate?: string;
  sets: number;
  reps: string;
  restSec: number;
  history?: { date: string; weight: number; reps: number; rpe: number }[];
  todayLog?: { weight?: number; reps?: number; rpe?: number; notes?: string };
}

export interface DayRoutine {
  id?: string;
  day?: string;
  short?: string;
  focus?: string;
  durationMin?: number;
  exercises?: Exercise[];
  rest?: boolean;
  scheduledDate?: string;
}

export interface BadRoutine {
  coachId: number;
  name: string;
  description: string;
  muscleGroup: string;
  videoUrl: string;
  isCustom: boolean;
}
export interface BadExercise {
  coachId: number;
  coachNotes: string;
  exerciseId: number;
  reps: string;
  restTime: string;
  scheduledDate: string;
  sets: number;
  studentId: number;
  weight: number;
}
// interface for the dates calculated in the routine page
export interface CompleteDate {
  day: string;
  short: string;
  original: string;
}

// interface for the exercises form
export interface ExerciseDraft {
  id: string;
  name: string;
  muscle: string;
  sets: string;
  reps: string;
  weight: string;
  coaNotes: string;
  restSec: string;
  scheduledDate: string;
}

// interface for the routine form
export interface RoutineDraft {
  routineName: string;
  muscleGroup: string;
  exercises: ExerciseDraft[];
}
