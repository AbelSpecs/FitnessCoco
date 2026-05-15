export interface Exercise {
  id: number;
  coachId?: number;
  exerciseId: number;
  name?: string;
  description?: string;
  muscle?: string;
  videoUrl?: string;
  isCustom?: boolean;

  sets: number;
  reps: string;
  restSec: number;
  history?: { date: string; weight: number; reps: number; rpe: number }[];
  todayLog?: { weight?: number; reps?: number; rpe?: number; notes?: string };
}

export interface DayRoutine {
  id: string;
  day: string;
  short: string;
  focus: string;
  durationMin: number;
  exercises: Exercise[];
  rest?: boolean;
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

// interface Routine {
//   id: number;
//   coachId: number;
//   studentId: number;
//   exerciseId: number;
//   name: string;
//   durationMin: number;
//   scheduleDate: date;
//   coachNotes: text;
//   studentNotes: Text;
//   isCompleted: boolean;
//   rest: boolean;
// }

// interface Exercise {
//   id: number;
//   coachId: number;
//   name: string;
//   description: string;
//   muscle or MuscleGroup: string;
//   sets: number;
//   reps: string or number;
//   weight: number;
//   rpe: number; // esto seria del 1 al 10
//   restTime: string;
//   coachNotes: string;
//   studentNotes: string;
//   isCompleted: boolean;
//   isCustom: boolean;
//   videoUrl: string;

// }
