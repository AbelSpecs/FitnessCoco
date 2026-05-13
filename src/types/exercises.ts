export interface Exercise {
  id: number;
  coachId?: number;
  name?: string;
  description?: string;
  muscle: string;
  videoUrl?: string;
  isCustom?: boolean;

  sets: number;
  reps: string;
  restSec: number;
  history: { date: string; weight: number; reps: number; rpe: number }[];
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
