export interface WorkoutCompletedDto {
  studentId?: number;
  activityDate: string;
}

export interface RiskRadarStudentDto {
  studentId: number;
  studentName?: string;
  currentStreak?: number;
  daysInactive?: number;
  riskLevel?: number;
}
