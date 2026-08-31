import { CoachDto, GetUserDto, StudentDto, UserDto } from "@/dtos/userDto";
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

export const userCoachMapper = (apiUser: CoachDto) => {
  const userToMap = apiUser;

  const userMapped: User = {
    id: userToMap.userId || userToMap.id,
    firstName: userToMap.firstName,
    lastName: userToMap.lastName,
    profilePictureKey: userToMap.profilePictureKey,
    bannerPictureKey: userToMap.bannerPictureKey,
    coach: {
      id: userToMap.id,
      userId: userToMap.userId,
      bio: userToMap.bio,
      certifications: userToMap.certifications,
      isVerified: userToMap.isVerified,
      // bannerUrl: userToMap.bannerPicture || userToMap.bannerUrl,
      // bannerPictureKey: userToMap.bannerPictureKey,
      // profilePictureKey: userToMap.profilePictureKey,
      experienceYears: userToMap.experienceYears ?? userToMap.yearsOfExperience ?? 0,
      studentsCount: userToMap.studentsCount,
      routinesCount: userToMap.routinesCount,
      rating: userToMap.rating,
      sessionsPerWeek: userToMap.sessionsPerWeek,
      retentionRate: userToMap.retentionRate,
      averageStreak: userToMap.averageStreak,
    },
    isStudent: false,
  };

  return userMapped;
};
