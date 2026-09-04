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
  gymId?: number;
}

export interface StudentInfo {
  studentId: string;
  name: string;
  fitnessGoal?: string;
  plan?: "basic" | "health" | "pro";
  streak: number;
  initials?: string;
  lastWorkout?: string;
  inactivity?: number;
  risk?: "high" | "medium" | "low";
}

export interface Coach {
  id?: number;
  userId?: number;
  bio?: string;
  certifications?: string;
  isVerified?: boolean;
  bannerUrl?: string;
  bannerPicture?: string;
  profilePicture?: string;
  profilePictureKey?: string;
  bannerPictureKey?: string;
  profilePictureUrl?: string;
  bannerPictureUrl?: string;
  experienceYears?: number;
  studentsCount?: number;
  routinesCount?: number;
  rating?: number;
  sessionsPerWeek?: number;
  retentionRate?: number;
  averageStreak?: number;
  activeStudents?: number;
  totalStudents?: number;
  totalRoutinesCreated?: number;
  averageRating?: number;
  totalRatingsCount?: number;
}

export interface User {
  id?: number;
  firstName?: string;
  lastName?: string;
  gender?: string;
  age?: number;
  streak?: number;
  profilePictureKey?: string;
  bannerPictureKey?: string;
  profilePictureUrl?: string;
  bannerPictureUrl?: string;
  planType?: "basic" | "health" | "pro";
  parqCompleted?: boolean;
  parqValidUntil?: string;
  student?: Student;
  coach?: Coach;
  isStudent: boolean;
}
