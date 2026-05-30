import { CompleteDate } from "@/types/exercises";

export const determineDate = (date: string): CompleteDate => {
  const newFecha = new Date(date);

  const completeName = newFecha.toLocaleDateString("es-ES", {
    weekday: "long",
    timeZone: "UTC",
  });

  const initial = newFecha.toLocaleDateString("es-ES", {
    weekday: "narrow",
    timeZone: "UTC",
  });

  return {
    day: completeName,
    short: initial,
    original: date,
  };
};

export const determineDates = (dates: string[]): CompleteDate[] => {
  const completeDates = dates.map((date) => {
    const newFecha = new Date(date);

    const completeName = newFecha.toLocaleDateString("es-ES", {
      weekday: "long",
      timeZone: "UTC",
    });

    const initial = newFecha.toLocaleDateString("es-ES", {
      weekday: "narrow",
      timeZone: "UTC",
    });

    return {
      day: completeName,
      short: initial,
      original: date,
    };
  });

  return completeDates;
};
