import { createFileRoute, Link, redirect, useParams, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { weekPlan } from "@/lib/mock-data";
import { Calendar, ChevronRight, Clock, Dumbbell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { CompleteDate, DailyExerciseSets, DayRoutine, Exercise } from "@/types/exercises";
import { determineDate, determineDates } from "@/utils/determineDate";
import {
  getDailyStudentExercisesByStudentId,
  getDailyStudentExercisesByStudentIdAndDate,
} from "@/services/routine.service";
import { GetDailyStudentExerciseDto } from "@/dtos/exerciseDto";
import DatePicker from "@/components/DatePicker";
import { DateRange } from "react-day-picker";
import WeekSlider from "@/components/ui/weekSlider";
import { addDays, startOfWeek, format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/rutina/$studentId/")({
  head: () => ({
    meta: [
      { title: "Rutina semanal — PYROSFIT" },
      { name: "description", content: "Tu calendario de entrenamiento de la semana." },
    ],
  }),
  component: RutinaPage,
  beforeLoad: ({ location }) => {
    const auth = localStorage.getItem("pyrosfit_user");
    const role = auth && JSON.parse(auth).role !== "student";

    if (role) {
      throw new Error("Unauthorized");
    }

    if (!auth) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
});

function RutinaPage() {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;
  // const { user } = useAuthStore();
  const { studentId } = useParams({ from: "/rutina/$studentId/" });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [weekRoutineList, setWeekRoutineList] = useState<DayRoutine[]>([
    {
      id: 0,
      scheduledDate: "2026-06-08",
      name: "Lunes",
      short: "L",
      estimated: "",
      rest: false,
      muscleGroupName: "",
      exercises: [],
    },
    {
      id: 1,
      scheduledDate: "2026-06-09",
      name: "Martes",
      short: "M",
      estimated: "",
      rest: false,
      muscleGroupName: "",
      exercises: [],
    },
    {
      id: 2,
      scheduledDate: "2026-06-10",
      name: "Miércoles",
      short: "X",
      estimated: "",
      rest: false,
      muscleGroupName: "",
      exercises: [],
    },
    {
      id: 3,
      scheduledDate: "2026-06-11",
      name: "Jueves",
      short: "J",
      estimated: "",
      rest: false,
      muscleGroupName: "",
      exercises: [],
    },
    {
      id: 4,
      scheduledDate: "2026-06-12",
      name: "Viernes",
      short: "V",
      estimated: "",
      rest: false,
      muscleGroupName: "",
      exercises: [],
    },
    {
      id: 5,
      scheduledDate: "2026-06-13",
      name: "Sábado",
      short: "S",
      estimated: "",
      rest: false,
      muscleGroupName: "",
      exercises: [],
    },
    {
      id: 6,
      scheduledDate: "2026-06-14",
      name: "Domingo",
      short: "D",
      estimated: "",
      rest: false,
      muscleGroupName: "",
      exercises: [],
    },
  ]);

  const days: DayRoutine[] = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const currentDayDate = addDays(selectedDate!, i);
        const dayName = format(currentDayDate, "EEEE", { locale: es });
        const dayShort = format(currentDayDate, "eeeeee", { locale: es });

        return {
          id: i,
          scheduledDate: currentDayDate!.toISOString(),
          name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          short: dayShort.charAt(0).toUpperCase(),
          estimated: "",
          rest: false,
          muscleGroupName: "",
          exercises: [],
        };
      }),
    [selectedDate],
  );

  useEffect(() => {
    const fetchRoutinesData = async () => {
      try {
        const exercisesData: GetDailyStudentExerciseDto[] =
          await getDailyStudentExercisesByStudentIdAndDate(
            Number(studentId),
            selectedDate!.toISOString(),
          );

        const mappedExercises: Exercise[] = exercisesData.map((e) => {
          const completeDate: CompleteDate = determineDate(e.scheduledDate);

          const newExercise: Exercise = {
            dailyExerciseId: e.id,
            coachId: e.coachId,
            exerciseId: e.exerciseId,
            studentId: e.studentId,
            exerciseName: e.exerciseName,
            muscleGroupName: e.muscleGroupName,
            coachNotes: e.coachNotes,
            scheduledDate: e.scheduledDate,
            day: completeDate.day,
            short: completeDate.short,
            dailyExerciseSets: e.dailyExerciseSets as DailyExerciseSets[],
          };

          return newExercise;
        });

        const weekRoutine: DayRoutine[] = days.map((day) => {
          const dayExercises = mappedExercises.filter(
            (ex) => ex.scheduledDate.split("T")[0] === day.scheduledDate.split("T")[0],
          );

          return {
            ...day,
            muscleGroupName: "",
            rest: dayExercises.length > 0 ? false : true,
            exercises: dayExercises,
          };
        });

        setWeekRoutineList(weekRoutine);
      } catch (error) {
        console.error("Error fetching routine data:", error);
      }
    };

    fetchRoutinesData();
  }, [studentId, selectedDate]);

  const handleWeekDate = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDate(date);
  };
  return (
    <AppShell>
      <WeekSlider
        value={selectedDate}
        onChange={handleWeekDate}
        weeksAfter={4}
        weeksBefore={4}
        className="mb-4"
      />
      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
          Tu programa
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl">Rutina semanal</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Pulsa cualquier día para ver los ejercicios, registrar tu sesión y consultar el historial.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {weekRoutineList.map((day, i) => {
          const isToday = i === todayIndex;
          return (
            <Link
              key={day.id}
              to="/rutina/$dayId"
              params={{ dayId: day.id.toString()! }}
              className="group"
            >
              <Card
                className={`relative overflow-hidden p-6 h-full transition-all duration-300 hover:-translate-y-1 ${
                  isToday
                    ? "bg-gradient-primary border-primary-glow shadow-glow"
                    : day.short
                      ? "bg-card/40 border-border"
                      : "bg-gradient-card border-border hover:border-primary/50 hover:shadow-card"
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-70">
                      {isToday ? "Hoy" : day.name}
                    </p>
                    <p className="font-display text-5xl leading-none mt-1">{day.short}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="font-display text-2xl mb-3">{day.muscleGroupName}</h3>

                {day.rest ? (
                  <Badge variant="secondary" className="bg-muted/50">
                    Descanso
                  </Badge>
                ) : (
                  <div className="flex items-center gap-3 text-xs opacity-80">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {day.estimated} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      {day.exercises!.length} ej.
                    </span>
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
