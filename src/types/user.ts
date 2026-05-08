import { Goal } from "./goals";

export interface User {
  id?: number;
  studentId?: number;
  name?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  fitnessGoal?: Goal;
  activityLevel?: string;
  medicalConditions?: string;
  allergies?: string;
  fitnessExperience?: string;
  generalNotes?: string;
  coachId?: number;
  streak?: number;
  planType?: "basic" | "health" | "pro";
  parqCompleted?: boolean;
  parqValidUntil?: string;
}

export interface Student {
  weight?: number;
  goal?: Goal;
  streak?: number;
}
