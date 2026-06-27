import { CoachStudentsDto, StudentDto } from "@/dtos/userDto";

export const countActiveClients = (studentsData: CoachStudentsDto[]) => {
  return studentsData.length;
};

export const countPorcentageStudents = (
  studentsListData: StudentDto[],
  studentsData: CoachStudentsDto[],
) => {
  const porcentage = (studentsData.length / studentsListData.length) * 100;
  return porcentage;
};
