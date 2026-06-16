import { CoachDto, GetUserDto, StudentDto, UserDto } from "@/dtos/userDto";
import { Goal } from "@/types/goals";
import { User } from "@/types/user";
import { age } from "@/utils/age";

export const userStudentMapper = (apiUser: StudentDto) => {
  const userToMap = apiUser;

  const userMapped: User = {
    firstName: userToMap.firstName,
    lastName: userToMap.lastName,
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
    firstName: userToMap.firstName,
    coach: {
      bio: userToMap.bio,
    },
    isStudent: false,
  };

  return userMapped;
};
