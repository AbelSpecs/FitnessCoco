import { Goal } from "./goals";
export interface Student {
  id?: number;
  userId?: number;
  weight?: number;
  height?: number;
  bodyFatPercentage?: number;
  fitnessGoal?: Goal;
  activityLevel?: string;
  medicalConditions?: string;
  allergies?: string;
  fitnessExperience?: string;
  generalNotes?: string;
}
export interface Coach {
  id?: number;
  userId?: number;
  bio?: string;
  certifications?: string;
  isVerified?: boolean;
}

export interface User {
  id?: number;
  firstName?: string;
  lastName?: string;
  gender?: string;
  age?: number;
  streak?: number;
  planType?: "basic" | "health" | "pro";
  parqCompleted?: boolean;
  parqValidUntil?: string;
  student?: Student;
  coach?: Coach;
}
