import { addDays, format } from "date-fns";

export const getSixDaysLater = (date: Date): Date => {
  return addDays(date, 6);
};

export const getSixDaysLaterFormatted = (date: Date): string => {
  return format(addDays(date, 6), "yyyy-MM-dd");
};
