import { useState, useEffect } from "react";
import { calculateMaxWeightLifted } from "@/helpers/studentsHelper";
import { GetDailyStudentExerciseDto } from "@/dtos/exerciseDto";
import { startOfWeek } from "date-fns";

export const useWeeklyRecord = (exercises: GetDailyStudentExerciseDto[]) => {
  const [maxWeight, setMaxWeight] = useState<number>(0);
  console.log(exercises);

  useEffect(() => {
    const storageKey = "pyrosfit_weekly_max_weight";
    const storedData = localStorage.getItem(storageKey);
    const now = new Date().getTime();

    const currentMaxWeight = calculateMaxWeightLifted(exercises);

    if (storedData) {
      const parsedData = JSON.parse(storedData);

      const startOfCurrentWeek = startOfWeek(now);
      const startOfCachedData = startOfWeek(parsedData.timestamp);

      if (startOfCurrentWeek === startOfCachedData) {
        setMaxWeight(Math.max(currentMaxWeight, parsedData.value));
        return;
      }
    }

    setMaxWeight(currentMaxWeight);
    const dataToSave = {
      value: currentMaxWeight,
      timestamp: new Date().getTime(),
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [exercises]);

  return maxWeight;
};
