export interface StudentStreakDto {
  studentId: number;
  studentName: string;
  currentStreak: number;
  longestStreak?: number;
  lastCompletedDate: string;
  freezeShieldsAvailable: number;
  updatedAt: string;
  isCompletedToday: boolean;
  daysInactive: number;
  status: string;
}

export interface WorkoutCompletedDto {
  studentId: number;
  activityDate: string;
}

export interface RiskRadarStudentDto {
  studentId: number;
  studentName?: string;
  currentStreak?: number;
  daysInactive?: number;
  riskLevel?: number;
}

export interface StreakHistoryLogDto {
  id: number;
  studentId: number;
  activityTypeId: number;
  activityTypeCode: string;
  activityTypeName: string;
  activityDate: string;
  createdAt: string;
}

export interface UseFreezeShieldDto {
  shieldDate?: string;
}

export interface StreakLeaderboardItemDto {
  rank: number;
  studentId: number;
  studentName: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string | null;
  freezeShieldsAvailable: number;
}
