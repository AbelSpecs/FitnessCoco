import { Goal } from "./goals";

export interface User {
  id?: number;
  studentId?: number;
  firstName?: string;
  lastName?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  fitnessGoal?: Goal;
  bodyFatPercentage?: string;
  activityLevel?: string;
  medicalConditions?: string;
  allergies?: string;
  fitnessExperience?: string;
  generalNotes?: string;
  streak?: number;
  planType?: "basic" | "health" | "pro";
  parqCompleted?: boolean;
  parqValidUntil?: string;
  coachId?: number;
  bio?: string;
  certifications?: string;
}

export interface Student {
  weight?: number;
  goal?: Goal;
  streak?: number;
}
