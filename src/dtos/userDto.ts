import { Goal } from "@/types/goals";

export interface StudentDto {
  id?: number;
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  birthdate?: string;
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

export interface CoachDto {
  id?: number;
  firstName?: string;
  lastName?: string;
  userId?: number;
  bio?: string;
  isVerified?: boolean;
  certifications?: string;
}

export interface UserDto {
  student: StudentDto;
  coach: CoachDto;
  isSuccess: true;
  message: null;
  errors: null;
}

export interface GetUserDto {
  student?: StudentDto;
  coach?: CoachDto;
}
