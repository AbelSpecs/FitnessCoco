import { TierMilestone } from "@/types/general";
import { addDays, format } from "date-fns";

export const getSixDaysLater = (date: Date): Date => {
  return addDays(date, 6);
};

export const getSixDaysLaterFormatted = (date: Date): string => {
  return format(addDays(date, 6), "yyyy-MM-dd");
};

export const calculateStreakExperience = (
  currentStreak: number,
  tiers: TierMilestone[] = [{ min: 0 }, { min: 3 }, { min: 7 }, { min: 14 }, { min: 30 }],
): number => {
  if (!currentStreak || currentStreak <= 0) return 0;
  if (!tiers || tiers.length <= 1) return 0;

  const maxMin = tiers[tiers.length - 1].min;
  if (currentStreak >= maxMin) return 100;

  const totalSegments = tiers.length - 1;
  const segmentWidth = 100 / totalSegments;

  for (let i = 0; i < totalSegments; i++) {
    const currentMin = tiers[i].min;
    const nextMin = tiers[i + 1].min;

    if (currentStreak >= currentMin && currentStreak <= nextMin) {
      const segmentProgress = (currentStreak - currentMin) / (nextMin - currentMin);
      const startPercent = i * segmentWidth;
      const endPercent = (i + 1) * segmentWidth;
      const totalPercent = startPercent + segmentProgress * (endPercent - startPercent);
      return Math.min(100, Math.max(0, totalPercent));
    }
  }

  return 100;
};
