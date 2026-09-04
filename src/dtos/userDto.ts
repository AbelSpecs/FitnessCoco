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
  profilePictureUrl?: string;
  // bannerPictureKey?: string;
}

export interface CoachDto {
  id?: number;
  firstName?: string;
  lastName?: string;
  userId?: number;
  bio?: string;
  isVerified?: boolean;
  certifications?: string;
  bannerUrl?: string;
  bannerPictureKey?: string;
  profilePictureKey?: string;
  profilePictureUrl?: string;
  bannerPictureUrl?: string;
  profilePicture?: string;
  bannerPicture?: string;
  yearsOfExperience?: number;
  experienceYears?: number;
  studentsCount?: number;
  routinesCount?: number;
  rating?: number;
  sessionsPerWeek?: number;
  retentionRate?: number;
  averageStreak?: number;
  totalStudents?: number;
  activeStudents?: number;
  inactiveStudents?: number;
  totalRoutinesCreated?: number;
  averageRating?: number;
  totalRatingsCount?: number;
}

export interface CoachStudentsDto {
  studentId: number;
  name: string;
  fitnessGoal: string;
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

export interface CoachProfileDto {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
  certifications?: string;
  isVerified: boolean;
  yearsOfExperience: number;
  experienceYears?: number;
  profilePicture?: string;
  bannerPicture?: string;
  profilePictureKey?: string;
  bannerPictureKey?: string;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalRoutinesCreated: number;
  averageRating: number;
  totalRatingsCount: number;
  studentsCount?: number;
  routinesCount?: number;
  rating?: number;
  sessionsPerWeek?: number;
  retentionRate?: number;
  averageStreak?: number;
}
