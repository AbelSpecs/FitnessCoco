import { CoachDto, CoachProfileDto, GetUserDto, StudentDto, UserDto } from "@/dtos/userDto";
import { Goal } from "@/types/goals";
import { User } from "@/types/user";
import { age } from "@/utils/age";

export const userStudentMapper = (apiUser: StudentDto) => {
  const userToMap = apiUser;

  const userMapped: User = {
    id: userToMap.userId || userToMap.id,
    firstName: userToMap.firstName,
    lastName: userToMap.lastName,
    profilePictureUrl: userToMap.profilePictureUrl,
    // bannerPicture: userToMap.bannerPicture,
    age: age(userToMap.birthdate!),
    streak: 12,
    student: {
      id: userToMap.id,
      userId: userToMap.userId,
      weight: userToMap.weight,
      height: userToMap.height,
      fitnessGoal: userToMap.fitnessGoal as Goal,
      bodyFatPercentage: userToMap.bodyFatPercentage,
      activityLevel: userToMap.activityLevel,
      medicalConditions: userToMap.medicalConditions,
      allergies: userToMap.allergies,
      fitnessExperience: userToMap.fitnessExperience,
      generalNotes: userToMap.generalNotes,
      gymId: userToMap.gymId ? userToMap.gymId : 1,
    },
    isStudent: true,
  };

  return userMapped;
};

export const userCoachMapper = (apiUser: CoachDto | CoachProfileDto | Record<string, any>) => {
  const userToMap: any = apiUser;

  const userMapped: User = {
    id: userToMap.userId || userToMap.id,
    firstName: userToMap.firstName,
    lastName: userToMap.lastName,
    profilePictureKey: userToMap.profilePictureKey || (userToMap.profilePicture && !userToMap.profilePicture.startsWith("http") ? userToMap.profilePicture : undefined),
    bannerPictureKey: userToMap.bannerPictureKey || (userToMap.bannerPicture && !userToMap.bannerPicture.startsWith("http") ? userToMap.bannerPicture : undefined),
    coach: {
      id: userToMap.id,
      userId: userToMap.userId,
      bio: userToMap.bio,
      certifications: userToMap.certifications,
      isVerified: userToMap.isVerified,
      experienceYears: userToMap.yearsOfExperience ?? userToMap.experienceYears ?? 0,
      studentsCount: userToMap.activeStudents ?? userToMap.totalStudents ?? userToMap.studentsCount ?? 0,
      activeStudents: userToMap.activeStudents,
      totalStudents: userToMap.totalStudents,
      routinesCount: userToMap.totalRoutinesCreated ?? userToMap.routinesCount ?? 0,
      totalRoutinesCreated: userToMap.totalRoutinesCreated,
      rating: userToMap.averageRating ?? userToMap.rating ?? 0,
      averageRating: userToMap.averageRating,
      totalRatingsCount: userToMap.totalRatingsCount,
      sessionsPerWeek: userToMap.sessionsPerWeek,
      retentionRate: userToMap.retentionRate,
      averageStreak: userToMap.averageStreak,
    },
    isStudent: false,
  };

  return userMapped;
};
